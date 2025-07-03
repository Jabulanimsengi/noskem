// src/app/admin/inspections/page.tsx

import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';
import ApprovalActions from './ApprovalActions';
import { type InspectionWithDetails } from '@/types';
import { format } from 'date-fns';

export default async function AdminInspectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    notFound();
  }

  // UPDATED QUERY: This now fetches all reports and their statuses.
  const { data: inspections, error } = await supabase
    .from('inspections')
    .select(`
      *,
      orders!inner (
        id,
        items (
          id,
          title
        ),
        profiles!orders_agent_id_fkey (
          id,
          username
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inspections:', error);
    return <p className="text-red-500">Error loading inspection reports.</p>;
  }

  return (
    <div>
      <PageHeader title="All Inspection Reports" />
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm divide-y-2 divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Order ID</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Item</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Agent</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Agent Verdict</th>
              {/* FIX: Add the new header for Admin Status */}
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Admin Status</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Submitted At</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(inspections as InspectionWithDetails[]).map((inspection) => (
              <tr key={inspection.id}>
                <td className="px-4 py-2 font-medium text-gray-900">#{inspection.order_id}</td>
                <td className="px-4 py-2 text-gray-700">{inspection.orders?.items?.title ?? 'N/A'}</td>
                <td className="px-4 py-2 text-gray-700">{inspection.orders?.profiles?.username ?? 'N/A'}</td>
                <td className="px-4 py-2 font-semibold capitalize" style={{ color: inspection.final_verdict === 'approved' ? 'green' : 'red' }}>{inspection.final_verdict}</td>
                {/* FIX: Add the new cell to display the admin_status */}
                <td className="px-4 py-2 font-semibold capitalize">
                  {inspection.admin_status ? (
                    <span style={{ color: inspection.admin_status === 'approved' ? 'green' : 'red' }}>
                      {inspection.admin_status}
                    </span>
                  ) : (
                    <span className="text-gray-500">Pending</span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-700">{inspection.created_at ? format(new Date(inspection.created_at), 'yyyy/MM/dd, HH:mm') : 'N/A'}</td>
                <td className="px-4 py-2">
                  <ApprovalActions inspection={inspection} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inspections.length === 0 && (
          <p className="p-4 text-center text-gray-500">No inspection reports found.</p>
        )}
      </div>
    </div>
  );
}