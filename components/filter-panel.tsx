"use client"
import { Slider } from "@/components/ui/slider"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export default function FilterPanel({
  radius,
  onRadiusChange,
  isLoading = false,
}: {
  radius: number
  onRadiusChange: (radius: number) => void
  isLoading?: boolean
}) {
  const [localRadius, setLocalRadius] = useState(radius)

  // Update local state while dragging
  const handleRadiusChange = (value: number[]) => {
    setLocalRadius(value[0])
  }

  // Only trigger search when user finishes dragging
  const handleRadiusCommit = (value: number[]) => {
    const newRadius = value[0]
    setLocalRadius(newRadius)
    onRadiusChange(newRadius)
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Filters</h3>
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
        </div>

        <div className="space-y-4">
          {/* Search Radius */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Search Radius: {localRadius} miles
              {isLoading && <span className="text-xs text-primary ml-2">(updating...)</span>}
            </label>
            
            {/* Quick buttons for common radii */}
            <div className="flex gap-2 mb-3">
              {[5, 10, 25, 50].map((miles) => (
                <button
                  key={miles}
                  onClick={() => {
                    setLocalRadius(miles)
                    onRadiusChange(miles)
                  }}
                  disabled={isLoading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    localRadius === miles
                      ? 'bg-[#8731F3] text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {miles}mi
                </button>
              ))}
            </div>
            
            <Slider
              value={[localRadius]}
              onValueChange={handleRadiusChange}
              onValueCommit={handleRadiusCommit}
              min={1}
              max={50}
              step={1}
              className="w-full cursor-pointer"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>1 mi</span>
              <span>50 mi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-[#8731F3]/5 border border-[#8731F3]/20 rounded-lg p-4">
        <p className="text-sm text-foreground/80">
          <strong>Tip:</strong> Expand your search radius to find more resources in your area.
        </p>
      </div>
    </div>
  )
}
