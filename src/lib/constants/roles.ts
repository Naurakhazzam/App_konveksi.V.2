// src/lib/constants/roles.ts

export const ROLES = {
  OWNER: 'owner',
  ADMIN_PRODUKSI: 'admin_produksi',
  ADMIN_KEUANGAN: 'admin_keuangan',
  SUPERVISOR: 'supervisor',
  MANDOR: 'mandor',
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: {
    label: "Owner",
    canViewMarginHPP: true,
    canEditMasterData: true,
    canApproveKoreksi: true,
    canManageKasbon: true,
    pages: ["all"],
  },
  [ROLES.ADMIN_PRODUKSI]: {
    label: "Admin Produksi",
    canViewMarginHPP: false,
    canEditMasterData: false,
    canApproveKoreksi: false,
    canManageKasbon: false,
    pages: ["/dashboard/produksi", "/produksi", "/koreksi-data"],
  },
  [ROLES.ADMIN_KEUANGAN]: {
    label: "Admin Keuangan",
    canViewMarginHPP: true,
    canEditMasterData: false,
    canApproveKoreksi: false,
    canManageKasbon: false,
    pages: ["/keuangan", "/dashboard/keuangan"],
  },
  [ROLES.SUPERVISOR]: {
    label: "Supervisor",
    canViewMarginHPP: true,
    canEditMasterData: false,
    canApproveKoreksi: false,
    canManageKasbon: false,
    pages: ["/dashboard", "/penggajian", "/keuangan"],
  },
  [ROLES.MANDOR]: {
    label: "Mandor",
    canViewMarginHPP: false,
    canEditMasterData: false,
    canApproveKoreksi: false,
    canManageKasbon: false,
    pages: ["/produksi/scan"],
  },
};
