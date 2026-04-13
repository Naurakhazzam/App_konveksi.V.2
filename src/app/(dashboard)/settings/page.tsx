import React from 'react';
import PageWrapper from '@/components/templates/PageWrapper';
import SettingsView from '@/features/settings/SettingsView';

export default function SettingsPage() {
  return (
    <PageWrapper 
      title="Pengaturan Sistem" 
      subtitle="Kustomisasi tampilan, efek visual, dan preferensi antarmuka"
    >
      <SettingsView />
    </PageWrapper>
  );
}
