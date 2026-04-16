
/**
 * Utility to generate visual aliases for Master Data entities.
 * This ensures long system IDs are displayed as clean, sequential codes.
 */

interface MasterItem {
  id: string;
  nama: string;
}

/**
 * Generic helper to get a sequential alias (e.g., MDL-001)
 */
export function getVerticalAlias<T extends MasterItem>(
  id: string,
  list: T[],
  prefix: string,
  padding: number = 3
): string {
  if (!id) return '-';
  
  // Sort by original ID for absolute stability (or date if available)
  const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id));
  const index = sorted.findIndex(item => item.id === id);
  
  if (index === -1) return id; // Fallback to original ID
  
  const seq = (index + 1).toString().padStart(padding, '0');
  return `${prefix}-${seq}`;
}

export const getKatAlias = (id: string, list: any[]) => getVerticalAlias(id, list, 'KAT', 3);
export const getModAlias = (id: string, list: any[]) => getVerticalAlias(id, list, 'MDL', 3);
export const getWrnAlias = (id: string, list: any[]) => getVerticalAlias(id, list, 'WRN', 3);
export const getSzAlias = (id: string, list: any[]) => getVerticalAlias(id, list, 'SZ', 2);
