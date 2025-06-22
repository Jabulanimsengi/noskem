import { redirect } from 'next/navigation';

// This page component will automatically redirect users from the base
// /account/dashboard URL to the more specific /orders sub-page.
// This resolves the 404 error and provides a better user experience.
export default function DashboardRootPage() {
  redirect('/account/dashboard/orders');
}