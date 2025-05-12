'use client';

import dynamic from 'next/dynamic';

// Dynamically import the CreateContentButton to avoid hydration issues
const CreateContentButton = dynamic(
  () => import('@/components/ui/CreateContentButton'),
  { ssr: false }
);

export default function DynamicCreateButton() {
  return <CreateContentButton />;
}
