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

    // Step 1: Geocode using Geoapify (simple and fast with US bias)
    let geocodeResponse
    try {
      geocodeResponse = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&limit=1&bias=countrycode:us&apiKey=${GEOAPIFY_API_KEY}`,
        { signal: AbortSignal.timeout(8000) } // 8 second timeout
      )
    } catch (fetchError) {
      console.error('Geocoding fetch error:', fetchError)
      return NextResponse.json({ error: "Location search timed out. Please try a different location." }, { status: 500 })
    }

    if (!geocodeResponse.ok) {
      console.error('Geocoding API error:', geocodeResponse.status)
      return NextResponse.json({ error: "Location not found. Please check your input and try again." }, { status: 400 })
    }

    const geocodeData = await geocodeResponse.json()

    if (!geocodeData.features || geocodeData.features.length === 0) {
      return NextResponse.json({ error: "Location not found. Please try a different search." }, { status: 400 })
    }

    const [lng, lat] = geocodeData.features[0].geometry.coordinates
    const locationName = geocodeData.features[0].properties.formatted

    // Convert miles to meters for Geoapify
    const radiusMeters = Math.round(radius * 1609.34)

    // Step 2: Search using Geoapify Places API (optimized for speed)
    const searchTypes = getSearchTypes(category)
    const allResources: ResourceResult[] = []
    const seenPlaces = new Set<string>()

    // Run searches in parallel with timeout protection
    const searchPromises = searchTypes.map(async (searchType) => {
      try {
        const categories = getGeoapifyCategories(searchType)
        
        for (const categoryFilter of categories) {
          const placesUrl = `https://api.geoapify.com/v2/places?categories=${categoryFilter}&filter=circle:${lng},${lat},${radiusMeters}&limit=30&apiKey=${GEOAPIFY_API_KEY}`
          
          try {
            const response = await fetch(placesUrl, {
              signal: AbortSignal.timeout(5000) // 5 second timeout per category
            })
            
            if (!response.ok) {
              console.error(`Geoapify search error for ${searchType} (${categoryFilter}): ${response.status}`)
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
          } catch (fetchErr) {
            console.error(`Timeout searching ${categoryFilter}:`, fetchErr)
            // Continue to next category even if this one times out
          }
        }
      } catch (err) {
        console.error(`Error searching for ${searchType}:`, err)
      }
    })

    // Wait for all searches to complete or timeout
    await Promise.all(searchPromises)

    // Sort by distance
    allResources.sort((a, b) => (a.distance || 0) - (b.distance || 0))

    return NextResponse.json({
      resources: allResources.slice(0, 100), // Increased from 50 to 100 results
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
  // Expanded categories for more comprehensive results
  const categories: Record<string, string[]> = {
    detox: [
      "healthcare.hospital",
      "healthcare.clinic_or_praxis",
      "healthcare.doctor",
      "healthcare",
    ],
    wellness: [
      "healthcare.pharmacy",
      "healthcare.clinic_or_praxis",
      "healthcare.alternative",
      "healthcare.counseling",
      "leisure.spa",
      "service.beauty.spa",
      "leisure.park",
    ],
    fitness: [
      "sport.fitness",
      "sport.sports_centre",
      "sport.swimming_pool",
      "sport.stadium",
      "leisure.sports_club",
      "leisure.park",
    ],
    career: [
      "education.school",
      "education.college",
      "education.university",
      "office.employment_agency",
      "office.government",
      "commercial.library",
    ],
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
