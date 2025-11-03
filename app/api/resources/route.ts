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

    // Step 1: Geocode using Geoapify with smart location detection
    // For ambiguous inputs (like zip codes), get multiple results and pick the best one
    const isLikelyZipCode = /^\d{4,6}$/.test(location.trim())
    const limitResults = isLikelyZipCode ? 3 : 1 // Get multiple results for zip codes
    
    let geocodeResponse
    try {
      geocodeResponse = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&limit=${limitResults}&bias=countrycode:us&apiKey=${GEOAPIFY_API_KEY}`,
        { signal: AbortSignal.timeout(10000) } // 10 second timeout
      )
    } catch (fetchError) {
      console.error('Geocoding fetch error:', fetchError)
      return NextResponse.json({ error: "Geocoding request timed out. Please try again." }, { status: 500 })
    }

    if (!geocodeResponse.ok) {
      console.error('Geocoding API error:', geocodeResponse.status)
      return NextResponse.json({ error: "Could not geocode location. Please try again." }, { status: 500 })
    }

    const geocodeData = await geocodeResponse.json()
    console.log('Geocode results:', JSON.stringify(geocodeData.features?.slice(0, 3).map((f: any) => ({
      name: f.properties.formatted,
      country: f.properties.country_code
    }))))

    if (!geocodeData.features || geocodeData.features.length === 0) {
      return NextResponse.json({ error: "Could not find that location. Please try again." }, { status: 400 })
    }
    
    // For zip codes, prioritize US locations
    let selectedFeature = geocodeData.features[0]
    
    if (isLikelyZipCode && geocodeData.features.length > 1) {
      // First check if there's a US match
      const usMatch = geocodeData.features.find((f: any) => 
        f.properties.country_code?.toLowerCase() === 'us' || 
        f.properties.country?.toLowerCase() === 'united states'
      )
      if (usMatch) {
        selectedFeature = usMatch
        console.log('Selected US match:', selectedFeature.properties.formatted)
      }
    }

    const [lng, lat] = selectedFeature.geometry.coordinates
    const locationName = selectedFeature.properties.formatted
    
    console.log(`Selected location: ${locationName} (${lat}, ${lng})`)

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
