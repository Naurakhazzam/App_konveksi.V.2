import ResetFactoryView from '@/features/master-data/ResetFactory/ResetFactoryView';

export const metadata = {
  title: 'Reset Factory - Stitchlyx Syncore',
  description: 'Reset sistem ke pengaturan pabrik (Transactional Data Wipe)',
};

export default function ResetFactoryPage() {
  return <ResetFactoryView />;
}
