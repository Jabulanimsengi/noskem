import { type Database } from "../database.types"; // Corrected import path

// Re-exporting generated types for easy access
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];

// Explicitly define BadgeType and a helper type for the badge object
export type BadgeType = Database['public']['Enums']['badge_type'];
export type UserBadge = { badge_type: BadgeType };

export type OrderStatus = Database['public']['Enums']['order_status'] | 'funds_paid_out';

export type ItemWithProfile = Item & {
  profiles: Profile | null;
};

export type OrderWithDetails = Omit<Order, 'status'> & {
    status: OrderStatus;
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