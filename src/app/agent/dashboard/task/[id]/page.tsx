// src/app/agent/dashboard/task/[id]/page.tsx
'use client';

import { Suspense, useState, useTransition } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/client'; // Use client for client component
import { type OrderWithDetails } from '@/types';
import BackButton from '@/app/components/BackButton';
import PageHeader from '@/app/components/PageHeader';
import LoadingIndicator from '@/app/components/global/LoadingIndicator';
import { useToast } from '@/context/ToastContext'; // Import useToast
import { submitInspectionReport } from './actions'; // Import the new action

// Dynamic import for client components
import dynamic from 'next/dynamic';
const InspectionForm = dynamic(() => import('./InspectionForm'));

export default function AgentTaskDetails({ params }: { params: { id: string } }) {
    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
        notFound();
    }

    const [order, setOrder] = useState<OrderWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, startTransition] = useTransition(); // useTransition for form submission
    const { showToast } = useToast(); // Initialize useToast

    // FIX: Define the onSubmit handler for the InspectionForm
    const handleInspectionSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await submitInspectionReport(formData);
            if (result.success) {
                showToast('Inspection report submitted successfully!', 'success');
                // Potentially redirect or refresh data
                // For now, let's just log and consider next steps
                console.log('Report submitted, result:', result);
                redirect(`/agent/dashboard?status=awaiting_collection`); // Redirect to dashboard or relevant page
            } else {
                showToast(result.error || 'Failed to submit inspection report.', 'error');
            }
        });
    };

    // Placeholder for fetching order details (can be moved to a server component or a client-side fetch)
    // For simplicity, this example assumes `order` data is available or fetched elsewhere.
    // In a real app, you'd fetch this data.
    // Example: useEffect(() => { /* fetch order data */ }, [orderId]);

    // Dummy order data for demonstration
    useState(() => {
        // In a real application, you would fetch the order details here.
        // For this example, we'll simulate a fetch.
        const dummyOrder: OrderWithDetails = {
            id: orderId,
            item_id: 1, // dummy
            buyer_id: '123e4567-e89b-12d3-a456-426614174000', // dummy
            seller_id: '123e4567-e89b-12d3-a456-426614174001', // dummy
            final_amount: 100.00, // dummy
            paystack_ref: null, // dummy
            status: 'inspection_pending', // dummy
            created_at: '2023-01-01T00:00:00Z', // dummy
            updated_at: '2023-01-01T00:00:00Z', // dummy
            agent_id: '123e4567-e89b-12d3-a456-426614174002', // dummy
            created_from_offer_id: null, // dummy
            inspection_fee_paid: 0, // dummy
            collection_fee_paid: 0, // dummy
            delivery_fee_paid: 0, // dummy
            item: {
                id: 1, // dummy
                seller_id: '123e4567-e89b-12d3-a456-426614174001', // dummy
                title: 'Sample Item', // dummy
                description: 'This is a sample item.', // dummy
                images: [], // dummy
                category: 'Electronics', // dummy
                condition: 'like_new', // dummy
                buy_now_price: 100.00, // dummy
                status: 'available', // dummy
                created_at: '2023-01-01T00:00:00Z', // dummy
                category_id: 1, // dummy
                view_count: 0, // dummy
                is_featured: false, // dummy
                latitude: null, // dummy
                longitude: null, // dummy
                fts: '', // dummy - tsvector type
                location_description: null, // dummy
                updated_at: '2023-01-01T00:00:00Z', // dummy
                discount_percentage: 0, // dummy
                likes_count: 0, // dummy
                new_item_price: null, // dummy
                purchase_date: null, // dummy
                last_bumped_at: null, // FIX: Added missing property
            },
            seller: {
                id: '123e4567-e89b-12d3-a456-426614174001', // dummy
                username: 'selleruser', // dummy
                first_name: 'Seller', // dummy
                avatar_url: null, // dummy
                updated_at: '2023-01-01T00:00:00Z', // dummy
                created_at: '2023-01-01T00:00:00Z', // dummy
                account_type: 'individual', // dummy
                last_name: 'User', // dummy
                company_name: null, // dummy
                company_registration: null, // dummy
                credit_balance: 0, // dummy
                role: 'user', // dummy
                average_rating: 0, // dummy
                address: null, // dummy
                availability_notes: null, // FIX: Added missing property
                email: 'seller@example.com', // Added email as it might be part of Profile (from src/types/index.ts)
                verification_status: 'not_verified', // FIX: Added missing property based on 20250629_add_verification_and_searches.sql
                verification_documents: null, // FIX: Added missing property based on 20250629_add_verification_and_searches.sql
            },
            buyer: {
                id: '123e4567-e89b-12d3-a456-426614174000', // dummy
                username: 'buyeruser', // dummy
                first_name: 'Buyer', // dummy
                avatar_url: null, // dummy
                updated_at: '2023-01-01T00:00:00Z', // dummy
                created_at: '2023-01-01T00:00:00Z', // dummy
                account_type: 'individual', // dummy
                last_name: 'User', // dummy
                company_name: null, // dummy
                company_registration: null, // dummy
                credit_balance: 0, // dummy
                role: 'user', // dummy
                average_rating: 0, // dummy
                address: null, // dummy
                availability_notes: null, // FIX: Added missing property
                email: 'buyer@example.com', // Added email as it might be part of Profile (from src/types/index.ts)
                verification_status: 'not_verified', // FIX: Added missing property based on 20250629_add_verification_and_searches.sql
                verification_documents: null, // FIX: Added missing property based on 20250629_add_verification_and_searches.sql
            },
            reviews: null, // dummy
        };
        setOrder(dummyOrder);
        setIsLoading(false);
    });

    if (isLoading) {
        return <LoadingIndicator />;
    }

    if (!order) {
        return notFound();
    }

    // Dummy agent ID for demonstration, replace with actual auth.uid() check
    const isTaskAssignedToAgent = order.agent_id === '123e4567-e89b-12d3-a456-426614174002';
    const isInspectionPending = order.status === 'inspection_pending';

    return (
        <div className="container mx-auto px-4 py-8">
            <BackButton />
            <PageHeader
                title={`Inspection for Order #${order.id}`}
                // FIX: Removed the subtitle prop as it does not exist on PageHeaderProps
                // subtitle={`Item: ${order.item?.title}`}
            />

            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                {order && order.item ? (
                    <>
                        <h3 className="text-xl font-semibold mb-4">Submit Inspection Report</h3>
                        {/* FIX: Pass the required props */}
                        <InspectionForm
                            orderId={order.id}
                            isPending={isSubmitting} // Pass isSubmitting from useTransition
                            onSubmit={handleInspectionSubmit} // Pass the new onSubmit handler
                        />
                    </>
                ) : (
                    <div>
                        <p>No order details found or item is missing.</p>
                    </div>
                )}
            </div>
        </div>
    );
}