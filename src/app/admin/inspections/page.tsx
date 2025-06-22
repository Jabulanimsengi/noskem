import { createClient } from '@/app/utils/supabase/server';
import Link from 'next/link';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// Define a type for the data we'll fetch
type InspectionReportWithDetails = {
    id: number;
    created_at: string;
    report_text: string | null;
    image_urls: string[] | null;
    orders: {
        id: number;
        status: string;
        items: {
            title: string;
        } | null;
    } | null;
    profiles: {
        username: string | null;
    } | null;
};

export default async function AdminAllInspectionsPage() {
  const supabase = await createClient();

  // Fetch all reports with related data
  const { data: reports, error } = await supabase
    .from('inspection_reports')
    .select(`
        id,
        created_at,
        report_text,
        image_urls,
        orders (id, status, items (title)),
        profiles (username)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500 p-4">Error fetching inspection reports: {error.message}</p>;
  }

  const typedReports = reports as unknown as InspectionReportWithDetails[];

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">All Inspection Reports</h2>
      <div className="space-y-4">
        {typedReports.length > 0 ? (
          typedReports.map(report => {
            const order = report.orders;
            const isPassed = order?.status === 'inspection_passed';

            return (
              <div key={report.id} className="bg-gray-50 border rounded-lg p-4">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <Link href={`/orders/${order?.id}`} className="font-bold text-brand hover:underline">
                            Order #{order?.id}
                        </Link>
                        <p className="text-sm text-text-secondary">{order?.items?.title || 'Item Not Found'}</p>
                        <p className="text-xs text-text-secondary mt-1">
                            Report by: <strong>{report.profiles?.username || 'N/A'}</strong> on {new Date(report.created_at).toLocaleString('en-ZA')}
                        </p>
                    </div>
                    <div className={`flex items-center gap-2 font-semibold text-sm px-3 py-1 rounded-full ${isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isPassed ? <FaCheckCircle /> : <FaTimesCircle />}
                        <span>{isPassed ? 'Passed' : 'Failed'}</span>
                    </div>
                </div>
                {report.report_text && (
                    <p className="mt-3 text-text-primary border-t pt-3 whitespace-pre-wrap italic">
                        "{report.report_text}"
                    </p>
                )}
                {report.image_urls && report.image_urls.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                        <p className="text-sm font-semibold mb-2">Attached Images:</p>
                        <div className="flex gap-2 flex-wrap">
                            {report.image_urls.map((url, index) => (
                                <a href={url} key={index} target="_blank" rel="noopener noreferrer" className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                                    <img src={url} alt={`Inspection image ${index + 1}`} className="w-full h-full object-cover" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-center text-text-secondary p-8">No inspection reports have been filed yet.</p>
        )}
      </div>
    </div>
  );
}