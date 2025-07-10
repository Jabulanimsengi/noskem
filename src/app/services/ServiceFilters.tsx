'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { type ServiceSearchParams } from './page'

interface ServiceFiltersProps {
  categories: { id: number; name: string }[];
  searchParams: ServiceSearchParams;
}

export default function ServiceFilters({ categories, searchParams }: ServiceFiltersProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  
  const [query, setQuery] = useState(searchParams.q || '')
  const [category, setCategory] = useState(searchParams.category || '')
  const [isLocating, setIsLocating] = useState(false)

  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    const params = new URLSearchParams(currentSearchParams.toString())
    if (debouncedQuery) {
      params.set('q', debouncedQuery)
    } else {
      params.delete('q')
    }
    router.push(`/services?${params.toString()}`)
  }, [debouncedQuery, router, currentSearchParams])

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value
    setCategory(newCategory)
    
    const params = new URLSearchParams(currentSearchParams.toString())
    if (newCategory) {
      params.set('category', newCategory)
    } else {
      params.delete('category')
    }
    router.push(`/services?${params.toString()}`)
  }
  
  const handleLocationSearch = () => {
    setIsLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const params = new URLSearchParams(currentSearchParams.toString())
          params.set('lat', latitude.toString())
          params.set('lon', longitude.toString())
          router.push(`/services?${params.toString()}`)
          setIsLocating(false)
        },
        (error) => {
          console.error("Geolocation error:", error)
          alert("Could not get your location. Please ensure location services are enabled.")
          setIsLocating(false)
        }
      )
    } else {
      alert("Geolocation is not supported by your browser.")
      setIsLocating(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-20 bg-background/80 backdrop-blur-md z-10 p-4 rounded-lg border">
      {/* Search Input */}
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by service, keyword..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md"
        />
      </div>

      {/* Category Select */}
      <select
        value={category}
        onChange={handleCategoryChange}
        className="w-full md:w-auto border rounded-md px-4 py-2"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      
      {/* Location Button */}
      <button
        onClick={handleLocationSearch}
        disabled={isLocating}
        className="w-full md:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLocating ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <MapPin className="mr-2 h-5 w-5" />
        )}
        Near Me
      </button>
    </div>
  )
}