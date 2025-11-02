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
    <div className="bg-card border border-border/40 rounded-lg p-5 hover:border-border/60 transition-colors hover:shadow-sm">
      <div className="space-y-4">
        {/* Header with name and type */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">{resource.name}</h3>
            <div className="inline-block px-2.5 py-1 text-xs font-medium bg-[#8731F3]/10 text-[#8731F3] rounded-full">
              {resource.type}
            </div>
          </div>
          {resource.distance && (
            <div className="text-right text-sm text-muted-foreground">{resource.distance.toFixed(1)} mi</div>
          )}
        </div>

        {/* Rating */}
        {resource.rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{resource.rating.toFixed(1)}</span>
            </div>
            {resource.reviews && <span className="text-sm text-muted-foreground">({resource.reviews} reviews)</span>}
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-3 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-foreground/80">{resource.address}</p>
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap items-center gap-4">
          {resource.phone && (
            <a
              href={`tel:${resource.phone}`}
              className="flex items-center gap-2 text-sm text-[#8731F3] hover:text-[#7621E3] transition-colors"
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
              className="flex items-center gap-1 text-sm text-[#8731F3] hover:text-[#7621E3] transition-colors"
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
