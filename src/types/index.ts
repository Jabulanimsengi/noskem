// src/types/index.ts
import { type Database } from "../database.types";

// Base types from the database
// FIX: Added 'new_item_price' to the Item type
export type Item = Database['public']['Tables']['items']['Row'] & {
  last_bumped_at?: string | null;
  new_item_price?: number | null; // Add this line
};

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  email?: string;
  verification_status?: string | null;
  verification_documents?: object | null;
  latitude?: number | null;
  longitude?: number | null;
};

// ... the rest of your file remains the same
export type Order = Database['public']['Tables']['orders']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type UserBadge = Database['public']['Tables']['user_badges']['Row'];
export type Inspection = Database['public']['Tables']['inspections']['Row'];
export type OrderStatus = Database['public']['Enums']['order_status'] | 'funds_paid_out';
export type BadgeType = Database['public']['Enums']['badge_type'];

// Composite types
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
export type OrderWithDetails = Order & {
    item: Item | null;
    seller: Profile | null;
    buyer: Profile | null;
    reviews: { id: number }[] | null;
    inspection_reports?: Inspection[] | null;
};
export type ItemWithSeller = Item & {
  profiles: Profile | null;
};
export type InspectionWithDetails = Inspection & {
  orders: {
    id: number;
    items: {
      id: number;
      title: string;
    } | null;
    profiles: { // This is the agent's profile
      id: string;
      username: string | null;
    } | null;
  } | null;
};