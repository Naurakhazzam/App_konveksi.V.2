# PROMPT — Sprint 1.2: Komponen Atom & Molekul

## Konteks
Baca file `Docs/STITCHLYX_V2_PROJECT_CONTEXT.md` di root proyek ini terlebih dahulu.
Sprint 1.1 sudah selesai — proyek Next.js 15 sudah di-setup, design system (CSS Variables) sudah ada, types sudah dibuat, constants sudah dibuat.

Kamu akan membangun **semua komponen terkecil (atoms) dan gabungan kecil (molecules)** yang akan dipakai berulang di seluruh aplikasi.

## Aturan Wajib

1. Setiap komponen = **1 folder** berisi: `NamaKomponen.tsx` + `NamaKomponen.module.css` + `index.ts`
2. `index.ts` isinya hanya: `export { default } from './NamaKomponen'`
3. Styling menggunakan **CSS Modules** — import sebagai `styles`, lalu pakai `className={styles.xxx}`
4. Nilai warna dan font diambil dari **CSS Variables** (sudah di globals.css), misalnya: `color: var(--color-cyan)`
5. Semua komponen harus punya **TypeScript props interface** yang jelas
6. Maks **150 baris** per file `.tsx`
7. **TIDAK** menggunakan inline styles kecuali benar-benar dinamis (misalnya width dari prop)
8. **TIDAK** menggunakan Tailwind CSS

## Atoms — `src/components/atoms/`

### 1. MacDots (`src/components/atoms/MacDots/`)
- 3 bulatan kecil: merah (#ff5f57), kuning (#ffbd2e), hijau (#28ca41)
- Diameter: 10px, gap: 6px, display flex, align center
- Tidak ada props — komponen statis

### 2. Button (`src/components/atoms/Button/`)
```ts
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;       // Icon di sebelah kiri text
  iconOnly?: boolean;            // Button hanya berisi icon
  onClick?: () => void;
  type?: 'button' | 'submit';
}
```
- Variant `primary`: background cyan (#22d3ee), text dark
- Variant `secondary`: background transparent, border cyan, text cyan
- Variant `ghost`: background transparent, text text-sub, hover text-cyan
- Variant `danger`: background red (#f87171), text white
- Hover state: sedikit lebih terang (opacity atau lighten)
- Disabled: opacity 0.5, cursor not-allowed
- Loading: tampilkan spinner kecil, disable click
- Font: `var(--font-body)`, weight 600, size 11px (sm), 12px (md), 13px (lg)
- Border radius: 8px
- Transition: semua perubahan warna 0.15s ease

### 3. Badge (`src/components/atoms/Badge/`)
```ts
interface BadgeProps {
  children: React.ReactNode;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;                 // Tampilkan dot kecil di depan text
}
```
- `success`: bg #1a2600, text #4ade80
- `warning`: bg #2a1f00, text #facc15
- `danger`: bg #2a0000, text #f87171
- `info`: bg #001a20, text #22d3ee
- `neutral`: bg #1a1a2e, text #64748b
- `purple`: bg #1a1040, text #a78bfa
- Font: `var(--font-mono)`, weight 500, size 9px (sm), 10px (md)
- Padding: 3px 8px (sm), 4px 10px (md)
- Border radius: 6px
- Letter spacing: 0.04em
- Text transform: uppercase

### 4. Input (`src/components/atoms/Input/`)

Buat 3 file komponen dalam 1 folder:

**TextInput.tsx:**
```ts
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  maxLength?: number;
}
```

**NumberInput.tsx:**
```ts
interface NumberInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  error?: boolean;
  format?: 'rupiah' | 'decimal' | 'integer';  // Untuk display format
}
```

**SearchInput.tsx:**
```ts
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}
```
- Tampilkan icon search (dari lucide-react: `Search`) di kiri
- Tampilkan tombol X untuk clear jika ada value

**Styling semua input:**
- Background: var(--color-card)
- Border: 1px solid var(--color-border)
- Border focus: var(--color-cyan)
- Color: var(--color-text)
- Placeholder: var(--color-text-sub)
- Font: var(--font-body), size 12px
- Padding: 9px 14px
- Border radius: 8px
- Transition: border-color 0.15s ease

**`index.ts`:** export semua 3 komponen

### 5. Select (`src/components/atoms/Select/`)

**Select.tsx:**
```ts
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}
```

**MultiSelect.tsx:**
```ts
interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}
```
- MultiSelect: tampilkan selected items sebagai Badge, dropdown untuk pilih/hapus
- Styling sama dengan Input (background, border, dll)

### 6. Typography (`src/components/atoms/Typography/`)

**Heading.tsx:**
```ts
interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  color?: string;                // CSS variable name, contoh: 'cyan'
}
```
- Render `<h1>` sampai `<h6>` sesuai level
- Font: `var(--font-heading)`, weight 700 (h3-h6) atau 800 (h1-h2)
- Size: h1=28px, h2=22px, h3=17px, h4=14px, h5=12px, h6=11px

**Label.tsx:**
```ts
interface LabelProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  color?: 'text' | 'sub' | 'mid' | 'cyan' | 'green' | 'yellow' | 'red';
  weight?: 400 | 500 | 600 | 700;
  uppercase?: boolean;
}
```
- Font: `var(--font-body)`
- Size: xs=9px, sm=11px, md=13px
- Default: size sm, color text, weight 500

**MonoText.tsx:**
```ts
interface MonoTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'text' | 'sub' | 'cyan' | 'green' | 'yellow' | 'red';
  weight?: 400 | 500 | 600;
}
```
- Font: `var(--font-mono)`
- Untuk menampilkan: angka Rupiah, SKU, barcode, timestamp, persentase
- Size: xs=9px, sm=11px, md=13px, lg=18px

### 7. StatusDot (`src/components/atoms/StatusDot/`)
```ts
interface StatusDotProps {
  color: 'cyan' | 'green' | 'yellow' | 'red' | 'purple' | 'blue' | 'orange';
  size?: 'sm' | 'md';
  pulse?: boolean;              // Animasi pulse ringan
}
```
- Bulatan kecil berwarna: sm=6px, md=8px
- `pulse`: animasi glow halus (CSS animation)

### 8. ProgressBar (`src/components/atoms/ProgressBar/`)
```ts
interface ProgressBarProps {
  value: number;                // 0-100
  color?: 'cyan' | 'green' | 'yellow' | 'red';
  height?: number;              // default 6px
  showLabel?: boolean;          // Tampilkan "XX%" di ujung
}
```
- Background track: var(--color-border)
- Fill: warna sesuai prop
- Transition: width 0.3s ease
- Border radius: pill (height/2)

### 9. Spinner (`src/components/atoms/Spinner/`)
```ts
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}
```
- CSS animation rotate 360deg
- Simple circle dengan border (border-top berwarna, sisanya transparan)
- sm=16px, md=24px, lg=36px

---

## Molecules — `src/components/molecules/`

### 10. Panel (`src/components/molecules/Panel/`)
```ts
interface PanelProps {
  title: string;
  children: React.ReactNode;
  action?: string;              // Text link di kanan header (misal "Lihat Semua")
  onAction?: () => void;
  accent?: string;              // Warna aksen opsional
}
```
- **WAJIB** pakai MacDots di header
- Header: bg var(--color-card2), padding 11px 18px, border-bottom
- MacDots di kiri, title di sampingnya, action di kanan
- Title: font body, size 11px, weight 700, letter-spacing 0.04em, uppercase
- Action: font mono, size 10px, warna cyan, cursor pointer
- Body: bg var(--color-card), padding sesuai children
- Border: 1px solid var(--color-border), border-radius 14px
- Margin bottom: 16px
- Overflow: hidden

### 11. KpiCard (`src/components/molecules/KpiCard/`)
```ts
interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isUp: boolean };  // "+12%" arrow up/down
  accent?: 'cyan' | 'green' | 'yellow' | 'red' | 'purple' | 'blue';
  format?: 'number' | 'rupiah' | 'percent';
}
```
- Background: var(--color-card)
- Border: 1px solid var(--color-border)
- Label: font body, size 9px, uppercase, letter-spacing, color text-sub
- Value: font heading (Syne), size 22px, weight 700, color sesuai accent
- Trend: small text, green untuk up, red untuk down
- Padding: 16px 20px
- Border radius: 12px

### 12. FormField (`src/components/molecules/FormField/`)
```ts
interface FormFieldProps {
  label: string;
  children: React.ReactNode;    // Input/Select/dll
  error?: string;
  required?: boolean;
  hint?: string;
}
```
- Label di atas, child (input) di bawah, error message di bawah input
- Label: font body, size 10px, weight 600, uppercase, letter-spacing 0.05em, color text-sub
- Error: font body, size 10px, color red
- Required: tampilkan * merah setelah label
- Gap label-to-input: 6px

### 13. SearchBar (`src/components/molecules/SearchBar/`)
```ts
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  children?: React.ReactNode;   // Slot untuk filter buttons di samping
}
```
- SearchInput di kiri, children (filter buttons) di kanan
- Flex row, gap 8px, align center

### 14. ConfirmDialog (`src/components/molecules/ConfirmDialog/`)
```ts
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;        // default "Konfirmasi"
  cancelLabel?: string;         // default "Batal"
  variant?: 'danger' | 'info';  // Warna tombol confirm
  onConfirm: () => void;
  onCancel: () => void;
}
```
- Backdrop gelap semi-transparan
- Card di tengah: bg card, border, border-radius 14px
- Title: font heading, size 15px
- Message: font body, size 12px, color text-sub
- 2 tombol: Cancel (ghost) + Confirm (primary/danger)
- Animasi: fade in + scale dari 0.95 ke 1

### 15. EmptyState (`src/components/molecules/EmptyState/`)
```ts
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}
```
- Centered, icon besar di atas, title di bawah, message, optional action button
- Color text-sub, subtle

### 16. BarcodeLabel (`src/components/molecules/BarcodeLabel/`)
```ts
interface BarcodeLabelProps {
  barcode: string;              // Full barcode string
  po: string;
  model: string;
  warna: string;
  size: string;
  qtyBundle: number;
}
```
- Sementara render text saja (placeholder untuk react-barcode nanti)
- Display barcode string + info artikel di bawahnya
- Font mono untuk barcode text
- Border dashed untuk preview area cetak

### 17. Autocomplete (`src/components/molecules/Autocomplete/`)
```ts
interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: string) => void;
  suggestions: string[];
  placeholder?: string;
  minChars?: number;            // default 2
}
```
- Input field + dropdown suggestion
- Dropdown muncul setelah ketik >= minChars karakter
- Navigasi keyboard: ↑↓ untuk pindah, Enter untuk pilih, Esc untuk tutup
- Highlight item yang aktif
- Dropdown: bg card, border, shadow, max-height 200px, overflow-y auto

---

## Verifikasi

Setelah selesai, pastikan:
1. `npm run dev` — berjalan tanpa error
2. Semua file TypeScript compile tanpa error
3. Buat halaman test sementara di `src/app/page.tsx` yang menampilkan SEMUA komponen:
   - Semua variant Button
   - Semua variant Badge
   - Input, Select, SearchInput
   - Panel dengan konten dummy
   - KpiCard
   - FormField
   - ConfirmDialog (dengan tombol untuk toggle open)
   - EmptyState
   - ProgressBar
   - MacDots, StatusDot, Spinner
   - Typography (Heading, Label, MonoText)
4. Tidak ada file yang lebih dari 150 baris
5. Setiap folder komponen punya 3 file: `.tsx`, `.module.css`, `index.ts`

## JANGAN Lakukan

- ❌ Jangan buat organisms (DataTable, Modal, Sidebar — itu Sprint 1.3)
- ❌ Jangan buat routing halaman
- ❌ Jangan buat Zustand stores
- ❌ Jangan ubah design system (warna, font)
- ❌ Jangan pakai Tailwind CSS
- ❌ Jangan pakai inline styles (kecuali nilai dinamis dari props)
