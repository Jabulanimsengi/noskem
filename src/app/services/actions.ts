'use server'

import { createClient } from '@/utils/supabase/server' // Corrected import name
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { createBulkNotifications } from '@/lib/notifications' 

// Define the structure for the form state
export interface ApplicationFormState {
  error?: string | null;
  success?: boolean;
}

export async function submitServiceApplication(
  prevState: ApplicationFormState, 
  formData: FormData
): Promise<ApplicationFormState> {
  const supabase = createClient() // Corrected function call

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to submit an application.' }
  }

  const images = formData.getAll('images') as File[]
  const imagePaths: string[] = []

  // 1. Upload images
  if (images.length > 0 && images[0].size > 0) {
    for (const image of images) {
      if (image.size > 10 * 1024 * 1024) { // 10MB limit per file
          return { error: `File ${image.name} is too large. Max size is 10MB.` };
      }
      const fileName = `${user.id}/${uuidv4()}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(fileName, image)

      if (uploadError) {
        console.error('Image upload error:', uploadError)
        return { error: 'Failed to upload one or more images.' }
      }
      const { data: { publicUrl } } = supabase.storage.from('service-photos').getPublicUrl(uploadData.path)
      imagePaths.push(publicUrl)
    }
  } else {
    return { error: 'Please upload at least one photo of your service.' };
  }


  // 2. Prepare the data for insertion
  const locationData = formData.get('location') as string;
  const location = locationData ? JSON.parse(locationData) : null;
  const businessName = formData.get('business_name') as string;

  const dataToInsert = {
    user_id: user.id,
    business_name: businessName,
    description: formData.get('description') as string,
    service_areas: formData.get('service_areas') as string,
    category_id: Number(formData.get('category_id')),
    contact_details: {
      phone: formData.get('contact_phone') as string,
      email: formData.get('contact_email') as string,
    },
    location: location ? `POINT(${location.longitude} ${location.latitude})` : null,
    photos: imagePaths,
    status: 'pending_approval'
  }

  // 3. Insert into the database
  const { error } = await supabase.from('service_providers').insert(dataToInsert)

  if (error) {
    console.error('Error inserting service provider:', error)
    return { error: 'There was an error submitting your application. Please try again.' }
  }

  // 4. Notify all admins of new application
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  if (admins && admins.length > 0) {
      // Added type for the 'admin' parameter here
      const adminNotifications = admins.map((admin: { id: string }) => ({
          profile_id: admin.id,
          message: `New service application from "${businessName}" for review.`,
          link_url: '/admin/services'
      }));
      await createBulkNotifications(adminNotifications);
  }

  revalidatePath('/account/dashboard')
  redirect('/advertise-services/success')
}