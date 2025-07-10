'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitServiceApplication, type ApplicationFormState } from '@/app/services/actions'
import { useEffect } from 'react'
import { useToast } from '@/context/ToastContext'
import ImageUploader from '@/components/ImageUploader' 
import LocationPicker from '@/components/LocationPicker' 

const initialState: ApplicationFormState = { error: null, success: false }

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex justify-center rounded-lg border border-transparent bg-brand py-3 px-8 text-base font-medium text-white shadow-sm hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:bg-gray-400"
    >
      {pending ? 'Submitting...' : 'Submit for Review'}
    </button>
  );
}

// Updated: Define the Category type directly here for simplicity
interface AdvertiseFormProps {
  userEmail: string;
  categories: { id: number; name: string }[];
}

// New Section Component for cleaner styling
const FormSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="p-6 border rounded-lg bg-white">
        <h2 className="text-xl font-semibold mb-5 text-text-primary border-l-4 border-brand pl-3">
            {title}
        </h2>
        {children}
    </div>
);


export default function AdvertiseForm({ userEmail, categories }: AdvertiseFormProps) {
  const [state, formAction] = useFormState(submitServiceApplication, initialState);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.error) {
      showToast(state.error, 'error');
    }
  }, [state, showToast]);

  const inputStyles = "block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand focus:ring-1 focus:ring-brand text-base p-3";
  const labelStyles = "block text-base font-medium text-text-primary mb-2";

  return (
    <form action={formAction} className="space-y-8">
        
        <FormSection title="Business Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="business_name" className={labelStyles}>Business Name</label>
                    <input type="text" name="business_name" id="business_name" required className={inputStyles}/>
                </div>

                <div>
                    <label htmlFor="category_id" className={labelStyles}>Service Category</label>
                    <select id="category_id" name="category_id" required className={inputStyles}>
                        <option value="">Select a category...</option>
                        {categories?.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="description" className={labelStyles}>Service Description</label>
                    <textarea id="description" name="description" rows={4} required placeholder="Describe what your business does, your experience, and what makes your service unique." className={inputStyles}></textarea>
                </div>
                 
                <div className="md:col-span-2">
                    <label htmlFor="service_areas" className={labelStyles}>Areas You Serve</label>
                    <input type="text" name="service_areas" id="service_areas" placeholder="e.g., Sandton, Midrand, Randburg" required className={inputStyles}/>
                </div>
            </div>
        </FormSection>

        <FormSection title="Contact Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="contact_phone" className={labelStyles}>Public Phone Number</label>
                    <input type="tel" name="contact_phone" id="contact_phone" required className={inputStyles}/>
                </div>
                <div>
                    <label htmlFor="contact_email" className={labelStyles}>Public Email Address</label>
                    <input type="email" name="contact_email" id="contact_email" defaultValue={userEmail} required className={inputStyles}/>
                </div>
            </div>
        </FormSection>

        <FormSection title="Media & Location">
            <div className="space-y-6">
              <ImageUploader name="images" maxImages={5} />
              <LocationPicker name="location" />
            </div>
        </FormSection>
        
        <div className="flex justify-end pt-4 border-t">
          <SubmitButton />
        </div>
    </form>
  )
}