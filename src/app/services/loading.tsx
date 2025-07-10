import { Search } from 'lucide-react'

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Header */}
      <div className="bg-gray-200 dark:bg-gray-700 h-10 w-1/3 rounded-lg mb-4"></div>
      <div className="bg-gray-200 dark:bg-gray-700 h-6 w-1/2 rounded-lg mb-8"></div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="bg-gray-200 dark:bg-gray-700 h-12 flex-grow rounded-md"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-12 w-full md:w-48 rounded-md"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-12 w-full md:w-48 rounded-md"></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border rounded-lg shadow-sm">
            <div className="bg-gray-300 dark:bg-gray-600 h-48 w-full"></div>
            <div className="p-4">
              <div className="bg-gray-300 dark:bg-gray-600 h-4 w-2/4 rounded mb-2"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-6 w-3/4 rounded mb-4"></div>
              <div className="bg-gray-300 dark:bg-gray-600 h-4 w-full rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}