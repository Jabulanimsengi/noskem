// src/types/index.ts
import { type Database } from "../database.types";

// Base types from the database
export type Item = Database['public']['Tables']['items']['Row'] & {
  last_bumped_at?: string | null;
  new_item_price?: number | null;
};

// The Profile type is now the single source of truth for user data.
export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  email?: string;
  // verification_status is already part of the base type, which is perfect.
  verification_status?: string | null; 
  verification_documents?: object | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type Order = Database['public']['Tables']['orders']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Inspection = Database['public']['Tables']['inspections']['Row'];
export type OrderStatus = Database['public']['Enums']['order_status'] | 'funds_paid_out';
// UserBadge and BadgeType are no longer needed.

// --- FIX STARTS HERE ---
// All composite types now just use the base 'Profile' type.
export type ItemWithProfile = Item & {
  profiles: Profile | null;
};

// ItemWithSeller is now an alias for ItemWithProfile for consistency.
export type ItemWithSeller = ItemWithProfile;
// --- FIX ENDS HERE ---


// Composite types from your existing file
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

export type OrderWithDetails = Order & {
    item: Item | null;
    seller: Profile | null;
    buyer: Profile | null;
    reviews: { id: number }[] | null;
    inspection_reports?: Inspection[] | null;
};

export type InspectionWithDetails = Inspection & {
  orders: {
    id: number;
    items: {
      id: number;
      title: string;
    } | null;
    profiles: {
      id: string;
      username: string | null;
    } | null;
  } | null;
};