// src/types/index.ts
import { type Database } from "../database.types";

// Base types from the database
export type Item = Database['public']['Tables']['items']['Row'] & {
  last_bumped_at?: string | null;
};

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  email?: string;
  verification_status?: string | null;
  verification_documents?: object | null;
  latitude?: number | null;
  longitude?: number | null;
};
export type Order = Database['public']['Tables']['orders']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type UserBadge = Database['public']['Tables']['user_badges']['Row'];
export type OrderStatus = Database['public']['Enums']['order_status'] | 'funds_paid_out';
// FIX: Export BadgeType from database enums
export type BadgeType = Database['public']['Enums']['badge_type'];

// A composite type representing an Item with its seller's Profile joined.
export type ItemWithProfile = Item & {
  profiles: Profile | null;
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

export type OfferWithDetails = Database['public']['Tables']['offers']['Row'] & {
    item: Item | null;
    buyer: Profile | null;
    seller: Profile | null;
    order_id?: number | null;
};

// A composite type representing an Order with all its related details joined.
export type OrderWithDetails = Order & {
    item: Item | null;
    seller: Profile | null;
    buyer: Profile | null;
    reviews: { id: number }[] | null;
    inspection_reports?: Database['public']['Tables']['inspection_reports']['Row'][] | null;
};

// Corrected ItemWithSeller to be compatible with ItemWithProfile by using the full Profile type
export type ItemWithSeller = Item & {
  profiles: Profile | null;
};