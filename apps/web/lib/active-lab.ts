export const ACTIVE_LAB_KEY = 'dnpxia.activeLabId';

export function getActiveLabId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_LAB_KEY);
}

export function setActiveLabId(labId: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVE_LAB_KEY, labId);
}

export function clearActiveLabId() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACTIVE_LAB_KEY);
}
