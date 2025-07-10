'use client'

import { useState } from 'react'
import { UploadCloud, X } from 'lucide-react'
import Image from 'next/image'

interface ImageUploaderProps {
  name: string
  maxImages?: number
}

export default function ImageUploader({ name, maxImages = 5 }: ImageUploaderProps) {
  const [previews, setPreviews] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files)
      const allFiles = [...files, ...newFiles]

      if (allFiles.length > maxImages) {
        alert(`You can only upload a maximum of ${maxImages} images.`)
        return
      }
      
      setFiles(allFiles)

      const newPreviews = newFiles.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...newPreviews])
    }
  }

  const handleRemoveImage = (index: number) => {
    const newFiles = [...files]
    const newPreviews = [...previews]
    
    newFiles.splice(index, 1)
    URL.revokeObjectURL(newPreviews.splice(index, 1)[0]) // Clean up memory

    setFiles(newFiles)
    setPreviews(newPreviews)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Service Photos (up to {maxImages})
      </label>
      <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-6 pt-5 pb-6">
        <div className="space-y-1 text-center">
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600 dark:text-gray-400">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-medium text-indigo-600 dark:text-indigo-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900 hover:text-indigo-500"
            >
              <span>Upload files</span>
              <input
                id="file-upload"
                name={name}
                type="file"
                className="sr-only"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                // By leaving the files state managed internally, the parent form will receive them via the name attribute on submission.
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {previews.map((src, index) => (
            <div key={index} className="relative">
              <Image
                src={src}
                alt={`Preview ${index + 1}`}
                width={100}
                height={100}
                className="w-full h-24 object-cover rounded-md"
                onLoad={() => URL.revokeObjectURL(src)} // Revoke after load to free memory
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}