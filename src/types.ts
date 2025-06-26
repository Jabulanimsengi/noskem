import { type Database } from './database.types';

// This file centralizes the most commonly used types from our database.

// Re-exporting the generated Profile and Item types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Offer = Database['public']['Tables']['offers']['Row'];

// Now we define our custom OrderStatus type based on the ENUM from the database.
// This should now match the regenerated types perfectly.
export type OrderStatus = Database['public']['Enums']['order_status'];

// We define our Order type by taking the base type from the database
// and overriding the 'status' property to use our specific OrderStatus type.
export type Order = Omit<Database['public']['Tables']['orders']['Row'], 'status'> & {
  status: OrderStatus;
};

// This is a custom type used for displaying items along with their seller's profile.
export type ItemWithProfile = Item & {
  profiles: {
    username: string | null;
    avatar_url: string | null;
    id: string;
  } | null;
};