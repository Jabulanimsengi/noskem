import { createAdminClient } from '@/app/utils/supabase/admin';
import Link from 'next/link';
import ApprovalActions from './ApprovalActions';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

// A more specific type for the data we are fetching
type ReportForApproval = {
    id: number;
    items: { title: string | null } | null;
    inspection_reports: {
        id: number;
        created_at: string;
        report_text: string | null;
        image_urls: string[] | null;
        profiles: { username: string | null } | null;
    }[];
};

export default async function AdminAllInspectionsPage() {
  const supabase = createAdminClient();

  // FIX: The query now starts from 'orders' and filters for the correct status.
  const { data: reports, error } = await supabase
    .from('orders')
    .select(`
        id,
        items (title),
        inspection_reports!inner (
            id, created_at, report_text, image_urls,
            profiles:agent_id (username)
        )
    `)
    .eq('status', 'pending_admin_approval')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching inspection reports:", error);
    return <p className="text-red-500 p-4">Error fetching reports for approval: {error.message}</p>;
  }

  const typedReports = reports as unknown as ReportForApproval[];

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Inspection Reports for Approval</h2>
      <div className="space-y-4">
        {typedReports.length > 0 ? (
          typedReports.map(task => {
            const report = task.inspection_reports[0]; // Each task will have one report
            return (
              <div key={report.id} className="bg-gray-50 border rounded-lg p-4">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <Link href={`/orders/${task.id}`} className="font-bold text-brand hover:underline">
                            Order #{task.id}
                        </Link>
                        <p className="text-sm text-text-secondary">{task.items?.title || 'Item Not Found'}</p>
                        <p className="text-xs text-text-secondary mt-1">
                            Report by: <strong>{report.profiles?.username || 'N/A'}</strong>
                        </p>
                    </div>
                    <ApprovalActions orderId={task.id} />
                </div>
                {report.report_text && (
                    <p className="mt-3 text-text-primary border-t pt-3 whitespace-pre-wrap italic">
                        "{report.report_text}"
                    </p>
                )}
                {report.image_urls && report.image_urls.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                        <p className="text-sm font-semibold mb-2">Attached Images:</p>
                        <div className="flex gap-2">
                          {report.image_urls.map((url, index) => (
                            <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                              <Image src={url} alt={`Inspection image ${index + 1}`} width={96} height={96} className="w-24 h-24 object-cover rounded-md border" />
                            </a>
                          ))}
                        </div>
                    </div>
                )}
              </div>
            )
          })
        ) : (
          <p className="text-center text-text-secondary p-8">No inspection reports are currently awaiting approval.</p>
        )}
      </div>
    </div>
  );
}