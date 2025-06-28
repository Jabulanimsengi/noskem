'use client';

// FIX: Import hooks from 'react' and 'react-dom' correctly.
import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { fileInspectionReport } from '../../actions';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';
import { FaTimes } from 'react-icons/fa';

const initialState = { success: false, error: null };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="w-full px-4 py-3 font-bold text-white bg-brand rounded-lg hover:bg-brand-dark transition-all disabled:bg-gray-400">
            {pending ? 'Submitting Report...' : 'Submit Report'}
        </button>
    );
}

export default function InspectionForm({ orderId }: { orderId: number }) {
    const router = useRouter();
    // FIX: The hook is correctly named useFormState.
    const [state, formAction] = useFormState(fileInspectionReport, initialState);
    const { showToast } = useToast();

    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const MAX_IMAGES = 3;

    useEffect(() => {
        if (state.success) {
            showToast("Inspection report submitted successfully!", "success");
            router.push('/agent/dashboard');
        }
        if (state.error) {
            showToast(state.error, "error");
        }
    }, [state, showToast, router]);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles].slice(0, MAX_IMAGES));
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const urls = images.map(file => URL.createObjectURL(file));
        setImagePreviews(urls);
        return () => { urls.forEach(URL.revokeObjectURL); };
    }, [images]);

    const inputStyles = "w-full px-3 py-2 text-text-primary bg-background border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand";
    const labelStyles = "block text-sm font-medium text-text-secondary mb-1";

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="orderId" value={orderId} />

            <div>
                <label htmlFor="inspectionResult" className={labelStyles}>Inspection Result</label>
                <select name="inspectionResult" id="inspectionResult" required className={inputStyles}>
                    <option value="pass">Pass</option>
                    <option value="fail_damaged">Fail - Damaged</option>
                    <option value="fail_counterfeit">Fail - Counterfeit</option>
                    <option value="fail_not_as_described">Fail - Not as Described</option>
                </select>
            </div>

            <div>
                <label htmlFor="reportText" className={labelStyles}>Notes</label>
                <textarea name="reportText" id="reportText" rows={5} className={inputStyles} placeholder="Describe the item's condition..."></textarea>
            </div>
            
            <div>
              <label htmlFor="images" className={labelStyles}>Upload Images ({images.length}/{MAX_IMAGES})</label>
              <input name="images" id="images" type="file" multiple accept="image/*" onChange={handleImageChange} disabled={images.length >= MAX_IMAGES} className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 disabled:opacity-50"/>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((previewUrl, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image src={previewUrl} alt={`Preview ${index + 1}`} fill className="rounded-md object-cover"/>
                    <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                      <FaTimes size={10}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
                <SubmitButton />
            </div>
        </form>
    );
}
