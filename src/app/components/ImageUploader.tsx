// src/app/components/ImageUploader.tsx

'use client';

import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
    onFilesChange: (files: File[]) => void;
}

export default function ImageUploader({ onFilesChange }: ImageUploaderProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generatePreviews = useCallback((newFiles: File[]) => {
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setPreviews(newPreviews);
        // Clean up old object URLs when new ones are generated
        previews.forEach(URL.revokeObjectURL);
        onFilesChange(newFiles); // Notify parent of file changes
    }, [onFilesChange, previews]); // Added 'previews' to dependency array for cleanup

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const selectedFiles = Array.from(event.target.files);
            setFiles(selectedFiles); // Update internal files state
            generatePreviews(selectedFiles);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        const updatedFiles = files.filter((_, index) => index !== indexToRemove);
        setFiles(updatedFiles); // Update internal files state
        generatePreviews(updatedFiles); // Regenerate previews and notify parent

        // If all files are removed, clear the input so same file can be re-selected
        if (updatedFiles.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

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

            {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previews.map((src, index) => (
                        <div key={index} className="relative group">
                            <Image
                                src={src}
                                alt={`Preview ${index + 1}`}
                                width={150}
                                height={150}
                                className="rounded-md object-cover"
                                onLoad={() => URL.revokeObjectURL(src)} // Clean up object URLs to prevent memory leaks
                            />
                             <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
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