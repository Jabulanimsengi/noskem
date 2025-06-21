'use server';

import { createClient } from '../../utils/supabase/server';

export async function markMessagesAsRead(roomId: string) {
    const supabase = await createClient(); // Corrected: Added await
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);
}