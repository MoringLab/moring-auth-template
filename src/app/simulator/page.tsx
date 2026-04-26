'use client';

import dynamic from 'next/dynamic';

const Simulator = dynamic(() => import('@/components/Simulator'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  ),
});

export default function SimulatorPage() {
  return <Simulator />;
}
