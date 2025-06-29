// This file is safe to run on both server and client, but will only have an effect on the client.

const GUEST_LIKES_KEY = 'guest_liked_items';

const isBrowser = typeof window !== 'undefined';

// Gets the list of liked item IDs from localStorage
export const getGuestLikes = (): number[] => {
    if (!isBrowser) return [];
    try {
        const likes = localStorage.getItem(GUEST_LIKES_KEY);
        return likes ? JSON.parse(likes) : [];
    } catch (error) {
        console.error("Failed to parse guest likes from localStorage", error);
        return [];
    }
};

// Saves the entire list of liked item IDs to localStorage
const saveGuestLikes = (itemIds: number[]) => {
    if (!isBrowser) return;
    try {
        localStorage.setItem(GUEST_LIKES_KEY, JSON.stringify(itemIds));
        // Dispatch a custom event so other components (like the header) can update
        window.dispatchEvent(new Event('storage'));
    } catch (error) {
        console.error("Failed to save guest likes to localStorage", error);
    }
};

// Adds a single item ID to the liked list
export const addGuestLike = (itemId: number) => {
    const currentLikes = getGuestLikes();
    if (!currentLikes.includes(itemId)) {
        saveGuestLikes([...currentLikes, itemId]);
    }
};

// Removes a single item ID from the liked list
export const removeGuestLike = (itemId: number) => {
    const currentLikes = getGuestLikes();
    saveGuestLikes(currentLikes.filter(id => id !== itemId));
};

// Clears all liked items for the guest
export const clearGuestLikes = () => {
    if (!isBrowser) return;
    localStorage.removeItem(GUEST_LIKES_KEY);
    window.dispatchEvent(new Event('storage'));
};