import { createClient } from '@/app/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

type UserTransaction = {
  id: number;
  created_at: string;
  type: string;
  status: string;
  amount: number;
  description: string | null;
  orders: { id: number } | null;
};

const getTransactionTypeClass = (type: string) => {
    switch (type) {
        case 'sale': return 'bg-blue-100 text-blue-800';
        case 'payout': return 'bg-green-100 text-green-800';
        case 'commission': return 'bg-red-100 text-red-800';
        case 'credit_purchase': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default async function UserTransactionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/?authModal=true');
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*, orders(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500">Error fetching your transactions: {error.message}</p>;
  }

  const transactions = data as unknown as UserTransaction[];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text-primary mb-4">My Transaction History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Type</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Description</th>
              <th className="p-3 font-semibold">Order</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => {
              const isDebit = tx.amount < 0;
              return (
                <tr key={tx.id} className="border-b last:border-b-0">
                  <td className="p-3 text-text-secondary">{new Date(tx.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getTransactionTypeClass(tx.type)}`}>
                        {tx.type}
                    </span>
                  </td>
                  <td className={`p-3 font-bold ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                    {isDebit ? '-' : '+'} R{Math.abs(tx.amount).toFixed(2)}
                  </td>
                  <td className="p-3 text-text-secondary">{tx.description}</td>
                  <td className="p-3">
                    {tx.orders?.id ? (
                      <Link href={`/orders/${tx.orders.id}`} className="font-mono text-xs text-brand hover:underline">
                        #{tx.orders.id}
                      </Link>
                    ) : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {transactions.length === 0 && (
            <p className="text-center p-8 text-text-secondary">You have no transactions yet.</p>
        )}
      </div>
    </div>
  );
}