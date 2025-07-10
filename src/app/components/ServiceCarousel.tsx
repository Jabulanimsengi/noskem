import ServiceProviderCard, { type ServiceProviderForCard } from './ServiceProviderCard'
import Link from 'next/link'

interface ServiceCarouselProps {
  title: string
  providers: ServiceProviderForCard[]
  viewAllLink?: string
}

export default function ServiceCarousel({ title, providers, viewAllLink }: ServiceCarouselProps) {
  if (!providers || providers.length === 0) {
    return null // Don't render anything if there are no providers
  }

  return (
    <section className="py-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-brand hover:underline">
            View all
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {providers.map((provider) => (
          <ServiceProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </section>
  )
}