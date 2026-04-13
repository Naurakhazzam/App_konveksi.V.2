import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/organisms/Modal';
import Button from '@/components/atoms/Button';
import OwnerCodeModal from '@/components/molecules/OwnerCodeModal';
import { KoreksiQTY } from '@/types';
import { TAHAP_LABEL, TahapKey } from '@/lib/utils/production-helpers';
import styles from './ModalApproveReject.module.css';

interface ModalApproveRejectProps {
  open: boolean;
  onClose: () => void;
  item: KoreksiQTY | null;
  mode: 'approve' | 'reject' | null;
  onConfirm: (id: string, mode: 'approve' | 'reject') => void;
}

export default function ModalApproveReject({ open, onClose, item, mode, onConfirm }: ModalApproveRejectProps) {
  const [showAuth, setShowAuth] = useState(false);

  if (!item || !mode) return null;

  const handleInitialConfirm = () => {
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    onConfirm(item.id, mode);
    onClose();
  };

  const isApprove = mode === 'approve';
  const tahapLabel = TAHAP_LABEL[item.tahapDitemukan as TahapKey] || item.tahapDitemukan;

  return (
    <>
      <Modal open={open && !showAuth} onClose={onClose} size="sm">
        <ModalHeader title={`Konfirmasi ${isApprove ? 'Persetujuan' : 'Penolakan'}`} onClose={onClose} />
        <ModalBody>
          <div className={styles.content}>
            <p>
              Anda akan <strong>{isApprove ? 'menyetujui' : 'menolak'}</strong> koreksi QTY berikut:
            </p>

            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <span>Barcode:</span> <code>{item.barcode}</code>
              </div>
              <div className={styles.infoRow}>
                <span>Tahap:</span> {tahapLabel}
              </div>
              <div className={styles.infoRow}>
                <span>Jenis:</span> {item.jenisKoreksi.toUpperCase()}
              </div>
              <div className={styles.infoRow}>
                <span>QTY Koreksi:</span>{' '}
                <strong>+{item.qtyKoreksi} pcs</strong>
              </div>
            </div>

            <div className={styles.alert} data-type={mode}>
              {isApprove ? (
                <p>
                  ✅ <strong>APPROVE</strong>: QTY akan bertambah {item.qtyKoreksi} pcs dan cascading ke
                  tahap selanjutnya.
                </p>
              ) : (
                <p>
                  ❌ <strong>TOLAK</strong>: QTY tetap sesuai PO. Kelebihan {item.qtyKoreksi} pcs tidak
                  diakui.
                </p>
              )}
            </div>

            <p className={styles.note}>Dibutuhkan otorisasi Owner untuk melanjutkan.</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant={isApprove ? 'primary' : 'danger'} onClick={handleInitialConfirm}>
            {isApprove ? 'Setuju' : 'Tolak'} & Otorisasi
          </Button>
        </ModalFooter>
      </Modal>

      <OwnerCodeModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
        title="Otorisasi Owner"
        description={`Konfirmasi ${isApprove ? 'Persetujuan' : 'Penolakan'} koreksi QTY untuk bundle ${item.barcode}`}
      />
    </>
  );
}
