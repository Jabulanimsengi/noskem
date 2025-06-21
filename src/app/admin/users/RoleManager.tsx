'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom'; // FIX: useFormStatus is imported from 'react-dom'
import { updateUserRole } from './actions';
import { useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="px-3 py-1 text-xs font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-md">
            {pending ? '...' : 'Save Role'}
        </button>
    );
}

// This client component correctly handles the state for the updateUserRole server action.
export default function RoleManager({ userId, currentRole }: { userId: string, currentRole: string }) {
    const { showToast } = useToast();
    const [state, formAction] = useActionState(updateUserRole, { error: null });

    useEffect(() => {
        if (state?.error) {
            showToast(state.error, 'error');
        }
    }, [state, showToast]);

    return (
        <form action={formAction} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={userId} />
            <select name="newRole" defaultValue={currentRole} className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs">
                <option value="user">User</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
            </select>
            <SubmitButton />
        </form>
    );
}