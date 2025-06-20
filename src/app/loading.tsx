import HeaderSkeleton from './components/skeletons/HeaderSkeleton';

export default function Loading() {
  // This loading UI will be displayed during page transitions
  // and on initial load for any server-rendered page.
  return (
    <div>
      <HeaderSkeleton />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* You can add more detailed page skeletons here if needed */}
        <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
}