import { type NextRequest, NextResponse } from "next/server"

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY

interface ResourceSearchRequest {
  location: string
  category?: string
  radius?: number
}

interface ResourceResult {
  id: string
  name: string
  address: string
  phone?: string
  website?: string
  type: string
  lat: number
  lng: number
  distance?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: ResourceSearchRequest = await request.json()
    const { location, category, radius = 25 } = body

    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 })
    }

    if (!GEOAPIFY_API_KEY) {
      return NextResponse.json({ error: "Geoapify API key not configured" }, { status: 500 })
    }

    // Step 1: Geocode using Geoapify
    const geocodeResponse = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&limit=1&apiKey=${GEOAPIFY_API_KEY}`
    )

    const geocodeData = await geocodeResponse.json()

    if (!geocodeData.features || geocodeData.features.length === 0) {
      return NextResponse.json({ error: "Could not find that location. Please try again." }, { status: 400 })
    }

    const [lng, lat] = geocodeData.features[0].geometry.coordinates
    const locationName = geocodeData.features[0].properties.formatted

    // Convert miles to meters for Geoapify
    const radiusMeters = Math.round(radius * 1609.34)

    // Step 2: Search using Geoapify Places API
    const searchTypes = getSearchTypes(category)
    const allResources: ResourceResult[] = []
    const seenPlaces = new Set<string>()

    // Run searches in parallel (Geoapify handles this well)
    await Promise.all(
      searchTypes.map(async (searchType) => {
        try {
          const categories = getGeoapifyCategories(searchType)
          
          for (const categoryFilter of categories) {
            const placesUrl = `https://api.geoapify.com/v2/places?categories=${categoryFilter}&filter=circle:${lng},${lat},${radiusMeters}&limit=50&apiKey=${GEOAPIFY_API_KEY}`
            
            const response = await fetch(placesUrl)
            
            if (!response.ok) {
              const errorText = await response.text()
              console.error(`Geoapify search error for ${searchType} (${categoryFilter}): ${response.status}`, errorText)
              continue
            }

            const data = await response.json()

            for (const feature of data.features || []) {
              const props = feature.properties
              const [placeLng, placeLat] = feature.geometry.coordinates
              
              const distance = calculateDistance(lat, lng, placeLat, placeLng)
              if (distance > radius) continue

              const placeId = props.place_id
              if (seenPlaces.has(placeId)) continue
              
              seenPlaces.add(placeId)

              allResources.push({
                id: placeId,
                name: props.name || props.address_line1 || "Unnamed Place",
                address: props.formatted || props.address_line2 || "Address not available",
                phone: props.datasource?.raw?.phone || props.datasource?.raw?.["contact:phone"],
                website: props.datasource?.raw?.website,
                type: getCategoryLabel(searchType),
                lat: placeLat,
                lng: placeLng,
                distance,
              })
            }
          }
        } catch (err) {
          console.error(`Error searching for ${searchType}:`, err)
        }
      })
    )

    // Sort by distance
    allResources.sort((a, b) => (a.distance || 0) - (b.distance || 0))

    return NextResponse.json({
      resources: allResources.slice(0, 50),
      location: locationName,
      centerCoords: { lat, lng },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getGeoapifyCategories(searchType: string): string[] {
  // Geoapify category codes: https://apidocs.geoapify.com/docs/places/#categories
  // Using only validated, working categories from the API documentation
  const categories: Record<string, string[]> = {
    detox: ["healthcare.hospital", "healthcare.clinic_or_praxis"],
    wellness: ["healthcare.pharmacy", "leisure.spa", "service.beauty.spa"],
    fitness: ["sport.fitness", "sport.sports_centre", "sport.swimming_pool"],
    career: ["education.school", "education.college", "education.university"],
  }

  return categories[searchType] || categories.wellness
}

function getCategoryLabel(searchType: string): string {
  const labels: Record<string, string> = {
    detox: "Health & Wellness",
    wellness: "Wellness Center",
    fitness: "Fitness",
    career: "Career Support",
  }

  return labels[searchType] || "Wellness Center"
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

function getSearchTypes(category?: string): string[] {
  if (!category || category === "all") {
    return ["detox", "wellness", "fitness", "career"]
  }
  return [category]
}
