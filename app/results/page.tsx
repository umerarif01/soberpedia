"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ResourceCard from "@/components/resource-card";
import FilterPanel from "@/components/filter-panel";
import dynamic from "next/dynamic";

// Dynamic import to handle Google Maps
const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg" />,
});

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsLoadingPage />}>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const location = searchParams.get("location") || "";
  const category = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "distance";

  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [radius, setRadius] = useState(25);
  const [centerCoords, setCenterCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      if (!location) {
        setError("No location provided");
        setLoading(false);
        return;
      }

      // Only show full loading on initial load, use refreshing for filter changes
      const isInitialLoad = resources.length === 0 && !error;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError("");

      try {
        const response = await fetch("/api/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location,
            category: category !== "all" ? category : undefined,
            radius,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch resources");
        }

        // Extract center coordinates from geocoded location
        if (data.centerCoords) {
          setCenterCoords(data.centerCoords);
        }

        // Sort resources
        const sorted = [...data.resources];
        if (sortBy === "rating") {
          sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        setResources(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchResources();
  }, [location, category, radius, sortBy]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 glass-light backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 glass-light hover:bg-white/10 text-purple-200 hover:text-white transition-all">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div className="flex-1 flex flex-col items-center">
              <Image
                src="/logo-soberpedia.png"
                alt="Soberpedia"
                width={240}
                height={70}
                className="h-8 w-auto mb-1 brightness-0 invert drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]"
              />
              <p className="text-sm text-purple-300/80">
                Resources in {decodeURIComponent(location)}
              </p>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="glass border border-red-400/30 rounded-lg p-4 text-red-300 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <aside className="xl:col-span-1">
              <FilterPanel
                radius={radius}
                onRadiusChange={setRadius}
                isLoading={isRefreshing}
              />
            </aside>

            {/* Main Results */}
            <main className="xl:col-span-3 relative">
              {/* Refreshing overlay */}
              {isRefreshing && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="glass border-purple-400/50 shadow-lg shadow-purple-500/20 rounded-lg px-6 py-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    <span className="text-sm font-medium text-white">
                      Updating results...
                    </span>
                  </div>
                </div>
              )}

              {resources.length === 0 ? (
                <div className="text-center py-12 glass rounded-lg border border-white/10">
                  <MapPin className="w-12 h-12 text-purple-300 mx-auto mb-3 opacity-50" />
                  <p className="text-purple-200/80 mb-4">
                    No resources found. Try expanding your search radius.
                  </p>
                  <Button
                    onClick={() => setRadius(radius + 10)}
                    variant="outline"
                    className="glass-light border-white/20 text-purple-200 hover:text-white hover:border-purple-400"
                  >
                    Expand Search Area
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Map Toggle */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-purple-300/80">
                      Found <span className="text-purple-400 font-semibold">{resources.length}</span> resources
                      {isRefreshing && (
                        <span className="ml-2 text-xs text-purple-400 animate-pulse">
                          (updating...)
                        </span>
                      )}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMap(!showMap)}
                      className="hidden xl:inline-flex glass-light border-white/20 text-purple-200 hover:text-white hover:border-purple-400"
                    >
                      {showMap ? "Hide Map" : "Show Map"}
                    </Button>
                  </div>

                  {/* Map Display */}
                  {showMap && centerCoords && (
                    <div className="h-96 rounded-lg overflow-hidden border border-white/20 shadow-lg shadow-purple-500/10">
                      <MapView
                        lat={centerCoords.lat}
                        lng={centerCoords.lng}
                        resources={resources}
                      />
                    </div>
                  )}

                  {/* Resources List */}
                  <div className="space-y-4">
                    {resources.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsLoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </div>
  );
}
