import { type NextRequest, NextResponse } from "next/server"

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json()

    if (!lat || !lng) {
      return NextResponse.json({ error: "Coordinates required" }, { status: 400 })
    }

    if (!GEOAPIFY_API_KEY) {
      return NextResponse.json({ error: "Geoapify API key not configured" }, { status: 500 })
    }

    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`
    )

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      return NextResponse.json({
        address: data.features[0].properties.formatted,
      })
    }

    return NextResponse.json({ address: `${lat},${lng}` })
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 })
  }
}
