import { Star, Phone, MapPin, Globe, ExternalLink } from "lucide-react"

interface Resource {
  placeId: string
  name: string
  address: string
  phone?: string
  website?: string
  rating?: number
  reviews?: number
  distance?: number
  type: string
}

export default function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <div className="glass rounded-lg p-5 hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 border border-white/10 hover:border-purple-400/50 group">
      <div className="space-y-4">
        {/* Header with name and type */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">{resource.name}</h3>
            <div className="inline-block px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 rounded-full border border-purple-400/30">
              {resource.type}
            </div>
          </div>
          {resource.distance && (
            <div className="text-right text-sm text-purple-300 font-medium">{resource.distance.toFixed(1)} mi</div>
          )}
        </div>

        {/* Rating */}
        {resource.rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-white">{resource.rating.toFixed(1)}</span>
            </div>
            {resource.reviews && <span className="text-sm text-purple-300/70">({resource.reviews} reviews)</span>}
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-3 text-sm">
          <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-purple-200/80">{resource.address}</p>
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap items-center gap-4">
          {resource.phone && (
            <a
              href={`tel:${resource.phone}`}
              className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {resource.phone}
            </a>
          )}
          {resource.website && (
            <a
              href={resource.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Globe className="w-4 h-4" />
              Visit
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
