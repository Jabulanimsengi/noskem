import { type Database } from './supabase';

// Re-exporting generated types for easy access
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type OrderStatus = Database['public']['Enums']['order_status'];

export type ItemWithProfile = Item & {
  profiles: Profile | null;
};

// This type is used by the admin orders page
export type OrderWithDetails = Order & {
    item: { title: string | null } | null;
    buyer: { username: string | null } | null;
    seller: { username: string | null } | null;
};

// This type is used by the offers client
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