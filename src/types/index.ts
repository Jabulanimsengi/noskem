// src/types/index.ts

export type Category = {
  id: number;
  name: string;
  slug: string;
};

// Add this new Conversation type
export type Conversation = {
    room_id: string;
    last_message: string;
    last_message_at: string;
    is_last_message_read: boolean;
    other_user: {
        id: string; // The user's ID
        username: string;
        avatar_url: string | null; 
    };
    item: { 
        title: string; 
    };
};