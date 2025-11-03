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
      <div className="glass rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Filters</h3>
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          )}
        </div>

        <div className="space-y-4">
          {/* Search Radius */}
          <div>
            <label className="text-sm font-medium text-white mb-3 block">
              Search Radius: <span className="text-purple-400">{localRadius}</span> miles
              {isLoading && <span className="text-xs text-purple-400 ml-2 animate-pulse">(updating...)</span>}
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
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                    localRadius === miles
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                      : 'glass-light text-purple-300 hover:bg-white/10'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
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
            <div className="flex justify-between text-xs text-purple-300/70 mt-2">
              <span>1 mi</span>
              <span>50 mi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="glass rounded-lg p-4 border border-purple-400/30 bg-gradient-to-br from-purple-600/10 to-pink-600/10">
        <p className="text-sm text-purple-200/90">
          <strong className="text-purple-300">Tip:</strong> Expand your search radius to find more resources in your area.
        </p>
      </div>
    </div>
  )
}
