// src/types/index.ts

export type Category = {
  id: number;
  name: string;
  slug: string;
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

// --- NEW TYPE ADDED HERE ---

// Defines the shape of an item when it includes the seller's profile
export type ItemWithProfile = {
  id: number;
  title: string;
  buy_now_price: number | null;
  images: string[] | string | null;
  seller_id: string;
  // The nested profile information from the database query
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};