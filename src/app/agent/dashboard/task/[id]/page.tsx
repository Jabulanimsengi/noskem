import { createClient } from '@/app/utils/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import InspectionForm from './InspectionForm';
import PageHeader from '@/app/components/PageHeader';

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    
    // --- FIX IS HERE ---
    // The 'params' object is now correctly awaited.
    const awaitedParams = await params;
    const id = awaitedParams?.id;
    // --- END OF FIX ---

    if (!id) {
        notFound();
    }
    const orderId = parseInt(id, 10);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        notFound();
    }

    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            item:item_id (*),
            seller:seller_id (username, avatar_url, address),
            buyer:buyer_id (username, avatar_url, address),
            inspection_reports (*)
        `)
        .eq('id', orderId)
        .single();

    if (error || !order || !order.item) {
        notFound();
    }

    if (order.agent_id !== user.id) {
        return (
            <div className="text-center p-8">
                <h1 className="text-xl font-bold text-red-500">Access Denied</h1>
                <p className="text-text-secondary">This task is not assigned to you.</p>
            </div>
        );
    }
    
    const imageUrl = (Array.isArray(order.item.images) && order.item.images.length > 0 && typeof order.item.images[0] === 'string')
        ? order.item.images[0]
        : 'https://placehold.co/600x400';

    const inspectionReport = order.inspection_reports && order.inspection_reports.length > 0 ? order.inspection_reports[0] : null;

    return (
        <div>
            <PageHeader title={`Task Details: Order #${order.id}`} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Item Details */}
                    <div className="bg-surface p-6 rounded-lg shadow-sm">
                        <h3 className="text-xl font-semibold mb-4">Item for Assessment</h3>
                        <div className="flex items-start gap-4">
                            <div className="relative w-32 h-32 rounded-md overflow-hidden flex-shrink-0">
                                <Image src={imageUrl} alt={order.item.title} fill style={{ objectFit: 'cover' }} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">{order.item.title}</h4>
                                <p className="text-sm text-text-secondary">{order.item.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Location Details */}
                    <div className="bg-surface p-6 rounded-lg shadow-sm">
                        <h3 className="text-xl font-semibold mb-4">Contact & Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold text-md mb-2 flex items-center gap-2"><FaUser /> Seller Details</h4>
                                <p className="text-text-primary">{order.seller?.username}</p>
                                <p className="text-sm text-text-secondary flex items-start gap-2 mt-1">
                                    <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                                    <span>Collection Address: {order.seller?.address || 'Not provided'}</span>
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-md mb-2 flex items-center gap-2"><FaUser /> Buyer Details</h4>
                                <p className="text-text-primary">{order.buyer?.username}</p>
                                <p className="text-sm text-text-secondary flex items-start gap-2 mt-1">
                                    <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                                    <span>Delivery Address: {order.buyer?.address || 'Not provided'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inspection Report Form or Details */}
                <div className="lg:col-span-1">
                    <div className="bg-surface p-6 rounded-lg shadow-sm sticky top-24">
                        {order.status === 'awaiting_assessment' ? (
                            <>
                                <h3 className="text-xl font-semibold mb-4">Submit Inspection Report</h3>
                                <InspectionForm orderId={order.id} />
                            </>
                        ) : (
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Inspection Report</h3>
                                {inspectionReport ? (
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Status:</strong> {order.status.replace(/_/g, ' ')}</p>
                                        <p><strong>Report:</strong> {inspectionReport.report_text}</p>
                                    </div>
                                ) : (
                                    <p>No inspection report filed yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}