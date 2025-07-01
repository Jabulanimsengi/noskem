// src/app/components/ImageUploader.tsx

'use client';

import { useState, useRef, useCallback, useEffect } from 'react'; // FIX: Added useEffect
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { Json } from '@/database.types'; // FIX: Import Json type for existingImages

interface ImageUploaderProps {
    onFilesChange: (files: File[]) => void;
    // FIX: Added existingImages prop
    existingImages?: Json[]; // Assuming Json[] is compatible with string[] for URLs
}

export default function ImageUploader({ onFilesChange, existingImages = [] }: ImageUploaderProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // FIX: State for current image URLs (could be from existingImages or new uploads)
    const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);

    useEffect(() => {
        // Initialize currentImageUrls with existingImages on mount
        const stringExistingImages = existingImages.filter((img): img is string => typeof img === 'string');
        setCurrentImageUrls(stringExistingImages);
    }, [existingImages]);


    const generatePreviews = useCallback((newFiles: File[]) => {
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        // FIX: Combine new previews with existing image URLs
        setPreviews(newPreviews);
        // Clean up old object URLs when new ones are generated
        // Only revoke URLs that were created here (i.e., not existing ones)
        previews.forEach(URL.revokeObjectURL);
        onFilesChange(newFiles); // Notify parent of file changes
    }, [onFilesChange, previews]); // Added 'previews' to dependency array for cleanup

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newSelectedFiles = Array.from(event.target.files).filter(file => file.size <= 10 * 1024 * 1024);
            if (Array.from(event.target.files).length > newSelectedFiles.length) {
                // You might want to use a toast or other feedback mechanism here
                console.warn(`Some images were too large (max 10MB) and were not added.`);
            }
            setFiles(prev => [...prev, ...newSelectedFiles]); // Update internal files state
            generatePreviews([...files, ...newSelectedFiles]); // Regenerate previews for all files
        }
    };

    const handleRemoveImage = (indexToRemove: number, isExisting: boolean = false) => {
        if (isExisting) {
            // If it's an existing image, remove it from currentImageUrls
            const updatedExisting = currentImageUrls.filter((_, index) => index !== indexToRemove);
            setCurrentImageUrls(updatedExisting);
            // You might need to communicate this back to the parent form if existing images are part of submission
            // For now, assume existing images are handled by their own update mechanisms or not part of this uploader's submission logic.
        } else {
            // If it's a newly selected file, remove it from 'files' and regenerate previews
            const updatedFiles = files.filter((_, index) => index !== indexToRemove);
            setFiles(updatedFiles); // Update internal files state
            generatePreviews(updatedFiles); // Regenerate previews and notify parent
        }

        // If all files are removed, clear the input so same file can be re-selected
        if (files.length === 0 && currentImageUrls.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // FIX: Combine existing image URLs with new previews for display
    const allPreviews = [...currentImageUrls, ...previews];

    return (
        <div>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                        <label
                            htmlFor="images"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-brand hover:text-brand-dark focus-within:outline-none"
                        >
                            <span>Upload files</span>
                            <input
                                id="images"
                                name="images" // This name must match what the server action expects
                                type="file"
                                multiple
                                accept="image/*"
                                className="sr-only"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
            </div>

            {allPreviews.length > 0 && ( // FIX: Use allPreviews for rendering
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {allPreviews.map((src, index) => (
                        <div key={index} className="relative group">
                            <Image
                                src={src}
                                alt={`Preview ${index + 1}`}
                                width={150}
                                height={150}
                                className="rounded-md object-cover"
                                onLoad={() => {
                                    // Revoke object URLs that were created on the client side
                                    if (src.startsWith('blob:')) {
                                        URL.revokeObjectURL(src);
                                    }
                                }}
                            />
                             <button
                                type="button"
                                onClick={() => handleRemoveImage(index, index < currentImageUrls.length)} // Pass whether it's an existing image
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-75 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}