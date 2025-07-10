'use client'

import { useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { updateServiceStatus, toggleServiceFeature } from './actions'
// Corrected: Import the type directly from the page file.
import type { ServiceProviderData } from './page' 
import { useRouter } from 'next/navigation'
import { Check, X, Star, Loader2 } from 'lucide-react'

interface ServiceManagementClientProps {
  providers: ServiceProviderData[]
}

export default function ServiceManagementClient({ providers }: ServiceManagementClientProps) {
  const { showToast } = useToast()
  const router = useRouter()
  // ... (rest of the component code is unchanged and correct)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const handleUpdateStatus = async (providerId: number, userId: string, businessName: string, status: 'approved' | 'rejected') => {
    setLoadingStates(prev => ({ ...prev, [`status-${providerId}`]: true }))
    const result = await updateServiceStatus(providerId, userId, businessName, status)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast(`Provider has been ${status}.`, 'success')
      router.refresh() 
    }
    setLoadingStates(prev => ({ ...prev, [`status-${providerId}`]: false }))
  }

  const handleToggleFeature = async (providerId: number, currentStatus: boolean) => {
    setLoadingStates(prev => ({ ...prev, [`feature-${providerId}`]: true }))
    const result = await toggleServiceFeature(providerId, currentStatus)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Feature status updated.', 'success')
      router.refresh()
    }
    setLoadingStates(prev => ({ ...prev, [`feature-${providerId}`]: false }))
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {providers.map((provider) => (
            <tr key={provider.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900 dark:text-white">{provider.business_name}</div>
                <div className="text-sm text-gray-500">{provider.service_areas}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.contact_details?.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(provider.created_at).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  provider.status === 'approved' ? 'bg-green-100 text-green-800' :
                  provider.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {provider.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                {provider.status === 'pending_approval' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(provider.id, provider.user_id, provider.business_name, 'approved')}
                      disabled={loadingStates[`status-${provider.id}`]}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >
                      {loadingStates[`status-${provider.id}`] ? <Loader2 className="animate-spin" /> : <Check />}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(provider.id, provider.user_id, provider.business_name, 'rejected')}
                       disabled={loadingStates[`status-${provider.id}`]}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {loadingStates[`status-${provider.id}`] ? <Loader2 className="animate-spin" /> : <X />}
                    </button>
                  </>
                )}
                {provider.status === 'approved' && (
                   <button
                    onClick={() => handleToggleFeature(provider.id, provider.is_featured)}
                    disabled={loadingStates[`feature-${provider.id}`]}
                    className={`disabled:opacity-50 ${provider.is_featured ? 'text-yellow-500' : 'text-gray-400'}`}
                  >
                     {loadingStates[`feature-${provider.id}`] ? <Loader2 className="animate-spin" /> : <Star />}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}