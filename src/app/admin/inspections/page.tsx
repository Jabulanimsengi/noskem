import { createClient } from '@/app/utils/supabase/server';
import Link from 'next/link';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
// We will create this client component next
import ApprovalActions from './ApprovalActions';

type InspectionReportWithDetails = {
    id: number;
    created_at: string;
    report_text: string | null;
    image_urls: string[] | null;
    orders: {
        id: number;
        status: string;
        items: { title: string; } | null;
    } | null;
    profiles: { username: string | null; } | null;
};

export default async function AdminAllInspectionsPage() {
  const supabase = await createClient();

  const { data: reports, error } = await supabase
    .from('inspection_reports')
    .select(`
        id, created_at, report_text, image_urls,
        orders!inner (id, status, items (title)),
        profiles!inner (username)
    `)
    .eq('orders.status', 'pending_admin_approval') // Only fetch reports needing approval
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500 p-4">Error fetching inspection reports: {error.message}</p>;
  }

  const typedReports = reports as unknown as InspectionReportWithDetails[];

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Inspection Reports for Approval</h2>
      <div className="space-y-4">
        {typedReports.length > 0 ? (
          typedReports.map(report => (
            <div key={report.id} className="bg-gray-50 border rounded-lg p-4">
              <div className="flex justify-between items-start gap-4">
                  <div>
                      <Link href={`/orders/${report.orders?.id}`} className="font-bold text-brand hover:underline">
                          Order #{report.orders?.id}
                      </Link>
                      <p className="text-sm text-text-secondary">{report.orders?.items?.title || 'Item Not Found'}</p>
                      <p className="text-xs text-text-secondary mt-1">
                          Report by: <strong>{report.profiles?.username || 'N/A'}</strong>
                      </p>
                  </div>
                  {/* Approval Actions Component */}
                  <ApprovalActions orderId={report.orders!.id} />
              </div>
              {report.report_text && (
                  <p className="mt-3 text-text-primary border-t pt-3 whitespace-pre-wrap italic">
                      "{report.report_text}"
                  </p>
              )}
              {report.image_urls && report.image_urls.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                      <p className="text-sm font-semibold mb-2">Attached Images:</p>
                      {/* ... image display logic ... */}
                  </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-text-secondary p-8">No inspection reports are currently awaiting approval.</p>
        )}
      </div>
    </div>
  );
}