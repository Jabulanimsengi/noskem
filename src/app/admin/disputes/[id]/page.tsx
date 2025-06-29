import { createAdminClient } from "@/app/utils/supabase/admin";
import { notFound } from "next/navigation";
import { type Profile } from "@/types";
import PageHeader from "@/app/components/PageHeader";
import DisputeTimeline from "@/app/orders/[id]/DisputeTimeline"; // Re-using this component
import ResolutionForm from "./ResolutionForm";

type DisputeMessageWithProfile = {
    id: number;
    created_at: string;
    message: string;
    image_urls: string[] | null;
    profiles: Profile | null;
}

export default async function AdminDisputeDetailPage({ params }: { params: { id: string } }) {
    const supabase = createAdminClient();
    const orderId = parseInt(params.id);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        notFound();
    }
    
    const { data: order, error } = await supabase
        .from('orders')
        .select('*, buyer:buyer_id(username), seller:seller_id(username)')
        .eq('id', orderId)
        .single();

    if (error || !order) {
        notFound();
    }
    
    const { data: messages } = await supabase
        .from('dispute_messages')
        .select('*, profiles(*)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
        
    const disputeMessages = messages as DisputeMessageWithProfile[] || [];

    return (
        <div>
            <PageHeader title={`Reviewing Dispute for Order #${order.id}`} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-xl font-semibold mb-4">Dispute History</h3>
                    <DisputeTimeline messages={disputeMessages} currentUser={user} />
                </div>
                
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-24">
                        <h3 className="text-xl font-semibold mb-4">Case Details</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Buyer:</strong> {order.buyer?.username}</p>
                            <p><strong>Seller:</strong> {order.seller?.username}</p>
                            <p><strong>Amount:</strong> R{order.final_amount.toFixed(2)}</p>
                        </div>
                        <ResolutionForm orderId={order.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}