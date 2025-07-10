'use client'

import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface Location {
  latitude: number
  longitude: number
}

export default function LocationPicker({ name }: { name: string }) {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetLocation = () => {
    setLoading(true)
    setError(null)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ latitude, longitude })
          setLoading(false)
        },
        (err) => {
          setError(`Error: ${err.message}`)
          setLoading(false)
        }
      )
    } else {
      setError('Geolocation is not supported by this browser.')
      setLoading(false)
    }
  }

  return (
    <div>
       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Business Location (Optional)
      </label>
      <div className="mt-2">
        <button
          type="button"
          onClick={handleGetLocation}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <MapPin className="mr-2 h-5 w-5" />
          )}
          {location ? 'Update My Location' : 'Get My Current Location'}
        </button>
      </div>
      {location && (
        <p className="mt-2 text-sm text-green-600">
          Location captured: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <input
        type="hidden"
        name={name}
        value={location ? JSON.stringify(location) : ''}
      />
    </div>
  )
}