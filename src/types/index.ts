import { type Database } from './supabase';

// Re-exporting generated types for easy access
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];

export type ItemWithProfile = Item & {
  profiles: Profile | null; 
};

export type OrderWithDetails = Order & {
    item: Item;
    seller: Profile;
    buyer: Profile;
};

// FIX: Add the 'order_id' property to this type definition.
// The 'order_id' is optional because it only exists on accepted offers.
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
    };
};