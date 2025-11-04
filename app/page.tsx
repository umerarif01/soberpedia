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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError("Please enter a location");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Encode location and redirect to results page with selected category
      const encodedLocation = encodeURIComponent(location);
      const categoryParam = selectedCategory !== "all" ? `&category=${selectedCategory}` : "";
      router.push(`/results?location=${encodedLocation}${categoryParam}`);
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
      const categoryParam = selectedCategory !== "all" ? `&category=${selectedCategory}` : "";
      router.push(`/results?location=${encodedLocation}${categoryParam}`);
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
                    Discover treatment facilities, wellness centers, fitness resources,
                    nutrition options, recreation, spiritual support, and community services
                    to support your recovery journey.
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
                    <div className="space-y-2">
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
                      {selectedCategory !== "all" && (
                        <div className="flex items-center gap-2 text-sm text-purple-300 animate-fade-in">
                          <span className="text-purple-400">🎯</span>
                          <span>
                            Searching for:{" "}
                            <span className="font-semibold text-purple-200">
                              {selectedCategory === "detox" && "Detox & Treatment"}
                              {selectedCategory === "wellness" && "Health & Wellness"}
                              {selectedCategory === "fitness" && "Fitness Centers"}
                              {selectedCategory === "career" && "Career Support"}
                              {selectedCategory === "nutrition" && "Food & Nutrition"}
                              {selectedCategory === "recreation" && "Recreation"}
                              {selectedCategory === "spiritual" && "Spiritual Support"}
                              {selectedCategory === "community" && "Community Services"}
                            </span>
                          </span>
                        </div>
                      )}
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
          <div className="space-y-3">
            <p className="text-sm text-purple-300/80 text-center">
              Select a category (optional):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <CategoryCard
                title="All Categories"
                description="Search all types of resources"
                categoryId="all"
                isSelected={selectedCategory === "all"}
                onClick={() => setSelectedCategory("all")}
              />
              <CategoryCard
                title="Detox & Treatment"
                description="Addiction treatment and rehabilitation"
                categoryId="detox"
                isSelected={selectedCategory === "detox"}
                onClick={() => setSelectedCategory("detox")}
              />
              <CategoryCard
                title="Health & Wellness"
                description="Mental health and wellness services"
                categoryId="wellness"
                isSelected={selectedCategory === "wellness"}
                onClick={() => setSelectedCategory("wellness")}
              />
              <CategoryCard
                title="Fitness Centers"
                description="Gyms, yoga studios, and sports"
                categoryId="fitness"
                isSelected={selectedCategory === "fitness"}
                onClick={() => setSelectedCategory("fitness")}
              />
              <CategoryCard
                title="Career Support"
                description="Job training and employment services"
                categoryId="career"
                isSelected={selectedCategory === "career"}
                onClick={() => setSelectedCategory("career")}
              />
              <CategoryCard
                title="Food & Nutrition"
                description="Restaurants, cafes, and markets"
                categoryId="nutrition"
                isSelected={selectedCategory === "nutrition"}
                onClick={() => setSelectedCategory("nutrition")}
              />
              <CategoryCard
                title="Recreation"
                description="Parks, museums, and entertainment"
                categoryId="recreation"
                isSelected={selectedCategory === "recreation"}
                onClick={() => setSelectedCategory("recreation")}
              />
              <CategoryCard
                title="Spiritual Support"
                description="Places of worship and meditation"
                categoryId="spiritual"
                isSelected={selectedCategory === "spiritual"}
                onClick={() => setSelectedCategory("spiritual")}
              />
              <CategoryCard
                title="Community Services"
                description="Libraries, social services, and support"
                categoryId="community"
                isSelected={selectedCategory === "community"}
                onClick={() => setSelectedCategory("community")}
              />
            </div>
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
  categoryId,
  isSelected,
  onClick,
}: {
  title: string;
  description: string;
  categoryId: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 group cursor-pointer border ${
        isSelected
          ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-400 shadow-lg shadow-purple-500/30"
          : "glass-light border-white/10 hover:bg-white/10 hover:border-purple-400/50"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3
          className={`font-semibold transition-colors ${
            isSelected ? "text-purple-300" : "text-white group-hover:text-purple-300"
          }`}
        >
          {title}
        </h3>
        {isSelected && (
          <span className="text-purple-400 text-lg">✓</span>
        )}
      </div>
      <p className={`text-sm ${isSelected ? "text-purple-200/80" : "text-purple-200/60"}`}>
        {description}
      </p>
    </button>
  );
}
