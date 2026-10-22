import type { Metadata } from 'next';
import { Scout } from '@/components/scout';

export const metadata: Metadata = {
  title: 'Leads · Startup Scout'
};

export default function LeadsPage() {
  return <Scout />;
}
