'use client';
import { useParams } from 'next/navigation';
import ScanStationView from '@/features/produksi/ScanStation';

export default function ScanPage() {
  const { tahap } = useParams<{ tahap: string }>();
  return <ScanStationView tahapSlug={tahap} />;
}
