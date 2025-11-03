"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError("Please enter a location");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Encode location and redirect to results page
      const encodedLocation = encodeURIComponent(location);
      router.push(`/results?location=${encodedLocation}`);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleUseLocation = async () => {
    setLoading(true);
    setError("");

    try {
      const position = await new Promise<GeolocationCoordinates>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => reject(err)
          );
        }
      );

      // Use coordinates to get location name via reverse geocoding
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: position.latitude,
          lng: position.longitude,
        }),
      });

      const data = await response.json();
      const locationName =
        data.address || `${position.latitude},${position.longitude}`;
      const encodedLocation = encodeURIComponent(locationName);
      router.push(`/results?location=${encodedLocation}`);
    } catch (err) {
      setError("Unable to access your location. Please enter it manually.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <header className="glass-light border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-soberpedia.png"
              alt="Soberpedia Logo"
              width={240}
              height={60}
              className="h-12 w-auto brightness-0 invert drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]"
              priority
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-block">
              <h2 className="text-5xl sm:text-6xl font-bold gradient-text text-balance leading-tight mb-2">
                Find Recovery Resources
              </h2>
              <div className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"></div>
            </div>
            <p className="text-lg text-purple-200/80 text-balance max-w-xl mx-auto">
              Discover detox facilities, wellness centers, career support, and
              fitness resources to support your recovery journey.
            </p>
            <p className="text-sm text-purple-300/60 text-center">
              💡 For international locations, include country name (e.g.,
              "Toronto Canada" or "London UK")
            </p>
          </div>

          {/* Search Section */}
          <div className="glass rounded-2xl p-8 shadow-2xl animate-fade-in relative overflow-hidden group">
            {/* Animated glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500"></div>

            <div className="relative space-y-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300 z-10" />
                  <Input
                    type="text"
                    placeholder="Enter city, ZIP code, or address (e.g., 'New York' or '90210')..."
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setError("");
                    }}
                    className="pl-12 py-6 text-base glass-light border-white/20 text-white placeholder:text-purple-300/60 focus:border-purple-400 transition-all duration-300"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-300 glass-light border border-red-400/30 rounded-lg p-3 animate-shake">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-6 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 hover:scale-105 border-0"
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
                    className="flex-1 py-6 text-base glass-light border-white/20 text-purple-200 hover:text-white hover:border-purple-400 transition-all duration-300 hover:scale-105"
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
          </div>

          {/* Resource Categories Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CategoryCard
              title="Detox & Treatment"
              description="Addiction treatment and rehabilitation facilities"
            />
            <CategoryCard
              title="Health & Wellness"
              description="Mental health services and wellness centers"
            />
            <CategoryCard
              title="Career Support"
              description="Job training and workforce development"
            />
            <CategoryCard
              title="Fitness Centers"
              description="Gyms, yoga studios, and recreation facilities"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-light border-t border-white/10 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-purple-300/70">
          <p>Support your recovery journey with resources in your community.</p>
        </div>
      </footer>
    </div>
  );
}

function CategoryCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="glass-light rounded-xl p-5 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 group cursor-pointer border border-white/10 hover:border-purple-400/50">
      <h3 className="font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-purple-200/60">{description}</p>
    </div>
  );
}
