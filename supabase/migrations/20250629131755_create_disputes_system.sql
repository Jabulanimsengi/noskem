-- Create a new table to store messages related to a disputed order
CREATE TABLE IF NOT EXISTS public.dispute_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    image_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add an index for faster querying of messages for a specific order
CREATE INDEX IF NOT EXISTS idx_dispute_messages_order_id ON public.dispute_messages (order_id);

-- Enable Row Level Security on the new table
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- Create policies to control access:
-- Admins can see all dispute messages
CREATE POLICY "Admins can view all dispute messages"
ON public.dispute_messages FOR SELECT
TO authenticated
USING ( (SELECT get_user_role(auth.uid())) = 'admin' );

-- The buyer or seller involved in the order can see the messages
CREATE POLICY "Parties involved can view their dispute messages"
ON public.dispute_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = dispute_messages.order_id
        AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
);

-- The buyer or seller can post messages to their own dispute
CREATE POLICY "Parties involved can create dispute messages"
ON public.dispute_messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = dispute_messages.order_id
        AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
        AND dispute_messages.profile_id = auth.uid()
    )
);