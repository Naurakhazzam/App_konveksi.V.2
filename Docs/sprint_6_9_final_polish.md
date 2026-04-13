# Implementation Plan - Sprint 6.9: Final Frontend Polish & QA

This sprint focuses on "polishing" the system to ensure it's 100% ready for the database migration. We will pre-populate master data, refine the approval workflow, and perform a sanity check on all core production logic.

## User Review Required

> [!NOTE]
> - I will be adding a default list of common production "Alasan Reject" (e.g., Cacat Kain, Salah Potong, Jahitan Loncat) to make the system "ready-to-use" for your team.

## Proposed Changes

### 1. Master Data & Initialization

#### [MODIFY] [dummy-master.ts](file:///d:/Project%20Konveksi.V.2/src/data/dummy-master.ts)
- Add a set of realistic `alasanReject` data so the user doesn't have to input them one by one for initial testing.
    - **Cacat Kain**: (Dampak: HPP PO, Bisa diperbaiki: Tidak)
    - **Salah Potong**: (Dampak: HPP PO, Bisa diperbaiki: Tidak)
    - **Jahitan Loncat**: (Dampak: Upah Tahap, Bisa diperbaiki: Ya)
    - **Noda/Kotor**: (Dampak: Upah Tahap, Bisa diperbaiki: Ya)
    - **Lubang**: (Dampak: HPP PO, Bisa diperbaiki: Tidak)

### 2. UI/UX Refinement

#### [MODIFY] [ApprovalQTYView.tsx](file:///d:/Project%20Konveksi.V.2/src/features/produksi/ApprovalQTY/ApprovalQTYView.tsx)
- Ensure total counts in KPI cards update instantly upon approval.
- Add success/error toast notifications (using the existing system if available, or simple state-based feedback).

#### [MODIFY] [ScanResult.tsx](file:///d:/Project%20Konveksi.V.2/src/features/produksi/ScanStation/ScanResult.tsx)
- Add a clear indicator if a bundle is currently "Waiting for Approval" (pending Surplus) so the operator knows why they can't proceed to the next stage yet.

### 3. Verification & E2E Sanity Check

- **Logic Audit**: Verify the `getExpectedQTY` cascading logic across all 7 stages.
- **Financial Audit**: Verify that `nominalPotongan` in `useKoreksiStore` correctly reflects the logic:
    - If `hpp_po` -> use `hpp_po` from `usePOStore`.
    - If `upah_tahap` -> use `upah_tahap` from the relevant stage.

## Verification Plan

### Manual Simulation (QA)
1. **Scenario 1 (Reject & Repair)**: Reject 2 pcs in QC -> Verify deduction in Report -> Re-scan repaired bundle -> Verify deduction is "Cancelled" in Report.
2. **Scenario 2 (Surplus)**: Scan 5 pcs more than target in Cutting -> Verify bundle is blocked -> Owner Approve in Approval page -> Verify QTY updated in Monitoring.
3. **Scenario 3 (Surplus Rejected)**: Scan surplus -> Owner Reject -> Verify QTY reverts to target.
4. **Scenario 4 (Shipping)**: Create SJ -> Confirm QTY < Packing -> Verify "QTY BERKURANG" warning appears.
