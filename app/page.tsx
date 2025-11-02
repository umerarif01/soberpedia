"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"

export default function LandingPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [location, setLocation] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim()) {
      setError("Please enter a location")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Encode location and redirect to results page
      const encodedLocation = encodeURIComponent(location)
      router.push(`/results?location=${encodedLocation}`)
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const handleUseLocation = async () => {
    setLoading(true)
    setError("")

    try {
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
        )
      })

      // Use coordinates to get location name via reverse geocoding
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: position.latitude,
          lng: position.longitude,
        }),
      })

      const data = await response.json()
      const locationName = data.address || `${position.latitude},${position.longitude}`
      const encodedLocation = encodeURIComponent(locationName)
      router.push(`/results?location=${encodedLocation}`)
    } catch (err) {
      setError("Unable to access your location. Please enter it manually.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Header with theme toggle */}
      <header className="border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo-soberpedia.png" 
              alt="Soberpedia Logo" 
              width={180} 
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground text-balance">
              Find Recovery Resources Near You
            </h2>
            <p className="text-lg text-muted-foreground text-balance">
              Discover detox facilities, wellness centers, career support, and fitness resources to support your
              recovery journey.
            </p>
          </div>

          {/* Search Section */}
          <div className="space-y-6 bg-card border border-border/40 rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter city, ZIP code, or address..."
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    setError("")
                  }}
                  className="pl-10 py-6 text-base"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-6 text-base bg-[#8731F3] hover:bg-[#7621E3] text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Find Resources"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 py-6 text-base bg-transparent"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Locating...
                    </>
                  ) : (
                    "Use My Location"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Resource Categories Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CategoryCard title="Detox & Treatment" description="Addiction treatment and rehabilitation facilities" />
            <CategoryCard title="Health & Wellness" description="Mental health services and wellness centers" />
            <CategoryCard title="Career Support" description="Job training and workforce development" />
            <CategoryCard title="Fitness Centers" description="Gyms, yoga studios, and recreation facilities" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>Support your recovery journey with resources in your community.</p>
        </div>
      </footer>
    </div>
  )
}

function CategoryCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-card border border-border/40 rounded-lg p-4 hover:border-border/60 transition-colors">
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
