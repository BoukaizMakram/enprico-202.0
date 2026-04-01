'use client';

import dynamic from 'next/dynamic';

const TutorClient = dynamic(() => import('./TutorClient'), { ssr: false });

export default function TutorPage() {
  return <TutorClient />;
}
