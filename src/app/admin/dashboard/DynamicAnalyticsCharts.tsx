'use client';

import dynamic from 'next/dynamic';

const AnalyticsCharts = dynamic(() => import('./AnalyticsCharts'), {
  loading: () => (
    <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
      <p className="text-text-secondary">Loading charts...</p>
    </div>
  ),
  ssr: false,
});

export default AnalyticsCharts;