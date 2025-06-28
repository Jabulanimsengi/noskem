import { type Database } from './supabase';

// Re-exporting generated types for easy access
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];

// FIX: This creates a union of all possible statuses from the database enum AND our custom status.
// This is the definitive fix for the type error.
export type OrderStatus = Database['public']['Enums']['order_status'] | 'funds_paid_out';

export type ItemWithProfile = Item & {
  profiles: Profile | null; 
};

// FIX: Update OrderWithDetails to use the corrected OrderStatus type.
export type OrderWithDetails = Omit<Order, 'status'> & {
    status: OrderStatus; // Use the corrected OrderStatus type
    item: { id: number; title: string | null; images: (string | null)[] | null } | null;
    seller: Profile | null;
    buyer: Profile | null;
    reviews: { id: number }[] | null;
};

export type OfferWithDetails = Database['public']['Tables']['offers']['Row'] & {
    item: Item | null;
    buyer: Profile | null;
    seller: Profile | null;
    order_id?: number | null;
};

export type Conversation = {
    room_id: string;
    last_message: string;
    last_message_at: string;
    is_last_message_read: boolean;
    other_user: {
        id: string;
        username: string;
        avatar_url: string | null;
    };
    item: {
        title: string;
    } | null;
};