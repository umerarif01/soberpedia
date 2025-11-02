"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

interface MapViewProps {
  lat: number
  lng: number
  resources: Array<{
    id: string
    name: string
    address: string
    lat: number
    lng: number
  }>
}

export default function MapView({ lat, lng, resources }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map with Leaflet and OpenStreetMap
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 13)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
    }

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current?.removeLayer(layer)
      }
    })

    // Create emoji-based icon for center marker
    const centerIcon = L.divIcon({
      html: '<div style="font-size: 32px;">📍</div>',
      className: 'custom-emoji-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    // Add center marker with emoji
    const centerMarker = L.marker([lat, lng], {
      icon: centerIcon,
    }).addTo(mapInstanceRef.current)

    centerMarker.bindPopup("📍 <strong>Search Location</strong>")

    // Create emoji-based icon for resource markers
    const resourceIcon = L.divIcon({
      html: '<div style="font-size: 28px;">🏥</div>',
      className: 'custom-emoji-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    })

    // Add resource markers with emoji
    resources.forEach((resource) => {
      const marker = L.marker([resource.lat, resource.lng], {
        icon: resourceIcon,
      }).addTo(mapInstanceRef.current!)
      marker.bindPopup(`<strong>${resource.name}</strong><br>${resource.address}`)
    })

    // Fit bounds to show all markers
    if (resources.length > 0) {
      const group = new L.FeatureGroup([L.marker([lat, lng]), ...resources.map((r) => L.marker([r.lat, r.lng]))])
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }, [lat, lng, resources])

  return <div ref={mapRef} className="w-full h-full rounded-lg border border-border/40 overflow-hidden" />
}
