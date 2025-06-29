import { type Database } from "../database.types"; // This path is crucial

// Base types from the database
export type Item = Database['public']['Tables']['items']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type UserBadge = Database['public']['Tables']['user_badges']['Row'];
export type CreditPackage = Database['public']['Tables']['credit_packages']['Row'];

// Custom, more detailed types for use in components

// **This is the type that is currently causing errors**
export type ItemWithProfile = Item & {
  profiles: Profile | null;
};

// **This is the type that was causing errors previously**
export type OrderWithItemAndProfile = Order & {
  item: Item;
  seller_profile: Profile;
  buyer_profile: Profile;
};

// **This is the other missing type**
export type Perspective = 'buying' | 'selling';

export type ReviewWithReviewer = Review & {
  profiles: Profile | null;
};

export type ProfileWithBadges = Profile & {
    user_badges: UserBadge[];
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