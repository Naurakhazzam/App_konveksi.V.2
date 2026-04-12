import React from 'react';
import { Info } from 'lucide-react';
import styles from '../Panduan.module.css';

export default function SectionBarcode() {
  return (
    <div className={styles.barcodeExample}>
      <div className={styles.barcodeFormat}>
        PO0001-Air-blck-s-0001-BDL01-01-03-25
      </div>

      <div className={styles.barcodeTable}>
        <span className={styles.barcodeKey}>PO0001</span>
        <span className={styles.barcodeVal}>Nomor PO tanpa strip</span>

        <span className={styles.barcodeKey}>Air</span>
        <span className={styles.barcodeVal}>3 huruf pertama nama model (kapital huruf pertama)</span>

        <span className={styles.barcodeKey}>blck</span>
        <span className={styles.barcodeVal}>4 huruf pertama warna (lowercase)</span>

        <span className={styles.barcodeKey}>s</span>
        <span className={styles.barcodeVal}>Size (lowercase)</span>

        <span className={styles.barcodeKey}>0001</span>
        <span className={styles.barcodeVal}>Nomor urut global — unik dan terus naik di seluruh sistem</span>

        <span className={styles.barcodeKey}>BDL01</span>
        <span className={styles.barcodeVal}>Nomor urut bundle dalam artikel itu</span>

        <span className={styles.barcodeKey}>01-03-25</span>
        <span className={styles.barcodeVal}>Tanggal PO disimpan (DD-MM-YY)</span>
      </div>

      <div className={styles.infoBox}>
        <Info size={16} className={styles.infoBoxIcon} />
        <div className={styles.infoBoxContent}>
          <span className={styles.infoBoxTitle}>Penting</span>
          <p className={styles.infoBoxText}>
            Barcode di-generate SEKALI saat PO pertama kali disimpan dan tidak bisa diubah lagi. 
            Nomor urut global bertambah per artikel, bukan per bundle — satu artikel mendapat satu nomor urut, 
            lalu bundle-nya dibedakan oleh BDL01, BDL02, dan seterusnya.
          </p>
        </div>
      </div>
    </div>
  );
}
