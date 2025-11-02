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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
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
                className="h-8 w-auto mb-1"
              />
              <p className="text-sm text-muted-foreground">
                Resources in {decodeURIComponent(location)}
              </p>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="bg-card border border-border shadow-lg rounded-lg px-6 py-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">
                      Updating results...
                    </span>
                  </div>
                </div>
              )}

              {resources.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border/40 rounded-lg">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    No resources found. Try expanding your search radius.
                  </p>
                  <Button
                    onClick={() => setRadius(radius + 10)}
                    variant="outline"
                  >
                    Expand Search Area
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Map Toggle */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Found {resources.length} resources
                      {isRefreshing && (
                        <span className="ml-2 text-xs text-primary">
                          (updating...)
                        </span>
                      )}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMap(!showMap)}
                      className="hidden xl:inline-flex"
                    >
                      {showMap ? "Hide Map" : "Show Map"}
                    </Button>
                  </div>

                  {/* Map Display */}
                  {showMap && centerCoords && (
                    <div className="h-96 rounded-lg overflow-hidden border border-border/40">
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}
