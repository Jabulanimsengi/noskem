import { type Database } from './supabase';

// Re-exporting generated types for easy access
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Category = Database['public']['Tables']['categories']['Row']; // FIX: Added export for Category type

// Defines the shape of an item when it includes the seller's profile
export type ItemWithProfile = Item & {
  // FIX: Supabase returns 'profiles', which can be an object or null
  profiles: Profile | null; 
};

// A more detailed type for orders, matching a detailed query
export type OrderWithDetails = Order & {
    item: Item;
    seller: Profile;
    buyer: Profile;
};

// Defines the shape of an offer with all its related data
export type OfferWithDetails = Database['public']['Tables']['offers']['Row'] & {
    item: Item | null;
    buyer: Profile | null;
    seller: Profile | null;
};

// Defines a conversation with its related data
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