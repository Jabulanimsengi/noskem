import { createClient } from '@/app/utils/supabase/server';
import { type Profile } from '@/types';
import Link from 'next/link';
import PayoutActions from './PayoutActions';

type Transaction = {
  id: number;
  created_at: string;
  type: string;
  status: string;
  amount: number;
  description: string | null;
  orders: { id: number, final_amount: number } | null;
  profiles: Profile | null;
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'failed': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getAmountClass = (amount: number) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
};

export default async function AdminTransactionsPage() {
  const supabase = await createClient();

  const { data: transactions, error } = await supabase
    .from('financial_transactions')
    .select('*, orders(id, final_amount), profiles(id, username)')
    .order('created_at', { ascending: false });

  if (error) {
    return <p>Error fetching transactions: {error.message}</p>;
  }

  const typedTransactions = transactions as unknown as Transaction[];

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Financial Transactions</h2>
      <div className="overflow-x-auto bg-surface rounded-lg shadow">
        <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
                <tr>
                    <th className="p-3 font-semibold">User</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">Amount</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Description</th>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {typedTransactions.map(tx => (
                    <tr key={tx.id} className="border-b last:border-b-0">
                        <td className="p-3">{tx.profiles?.username || 'N/A'}</td>
                        <td className="p-3 capitalize font-medium">{tx.type}</td>
                        <td className={`p-3 font-bold ${getAmountClass(tx.amount)}`}>
                            {tx.amount > 0 ? '+' : ''}R{tx.amount.toFixed(2)}
                        </td>
                        <td className="p-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(tx.status)}`}>
                                {tx.status}
                            </span>
                        </td>
                        <td className="p-3 text-text-secondary">{tx.description}</td>
                        <td className="p-3 text-text-secondary">{new Date(tx.created_at).toLocaleString()}</td>
                        <td className="p-3 text-right">
                            {/* The Approve button will only show for pending sales */}
                            {tx.type === 'sale' && tx.status === 'pending' && tx.orders && tx.profiles && (
                                <PayoutActions 
                                    orderId={tx.orders.id}
                                    sellerId={tx.profiles.id}
                                    finalAmount={tx.orders.final_amount}
                                />
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}