import { InspectionRecord, ConsumerReport } from '../types';
import { syncQueueApi } from './api';

const INSPECTIONS_STORAGE_KEY = 'manak_inspections_v1';
const CONSUMER_REPORTS_KEY = 'manak_consumer_reports_v1';
const OFFLINE_QUEUE_KEY = 'manak_offline_queue_v1';

export function getStoredInspections(): InspectionRecord[] {
  try {
    const raw = localStorage.getItem(INSPECTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load stored inspections:', e);
    return [];
  }
}

export function saveInspection(inspection: InspectionRecord): void {
  const current = getStoredInspections();
  const updated = [inspection, ...current.filter(i => i.id !== inspection.id)];
  localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(updated));
}

export function saveStoredInspections(inspections: InspectionRecord[]): void {
  localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(inspections));
}

export function getStoredConsumerReports(): ConsumerReport[] {
  try {
    const raw = localStorage.getItem(CONSUMER_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load consumer reports:', e);
    return [];
  }
}

export function saveConsumerReport(report: ConsumerReport): void {
  const current = getStoredConsumerReports();
  const updated = [report, ...current.filter(r => r.id !== report.id)];
  localStorage.setItem(CONSUMER_REPORTS_KEY, JSON.stringify(updated));
}

export function saveStoredConsumerReports(reports: ConsumerReport[]): void {
  localStorage.setItem(CONSUMER_REPORTS_KEY, JSON.stringify(reports));
}

export function getOfflineQueue(): InspectionRecord[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(record: InspectionRecord): void {
  const queue = getOfflineQueue();
  queue.push(record);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('manak:queue-updated', { detail: { count: queue.length } }));
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  window.dispatchEvent(new CustomEvent('manak:queue-updated', { detail: { count: 0 } }));
}

/**
 * Sync Engine: Drains pending offline inspections to the backend API server.
 */
export async function syncOfflineQueueToServer(
  onProgress?: (syncedCount: number, total: number) => void
): Promise<{ success: boolean; syncedCount: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0 };
  }

  try {
    const result = await syncQueueApi(queue);
    if (result?.success) {
      const history = getStoredInspections();
      const syncedIds = new Set(queue.map(q => q.id));
      const updatedHistory = history.map(h =>
        syncedIds.has(h.id) ? { ...h, synced: true, status: 'verified' as const } : h
      );
      localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(updatedHistory));
      clearOfflineQueue();
      window.dispatchEvent(new CustomEvent('manak:queue-synced', { detail: { syncedCount: result.syncedCount } }));
      if (onProgress) onProgress(result.syncedCount, queue.length);
      return { success: true, syncedCount: result.syncedCount };
    }
  } catch (err) {
    console.warn('Sync failed, will retry on next connection:', err);
  }

  return { success: false, syncedCount: 0 };
}

// Auto-sync listener when browser reconnects to internet
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const queue = getOfflineQueue();
    if (queue.length > 0) {
      console.log(`[MANAK Sync] Device back online. Auto-draining ${queue.length} offline records...`);
      syncOfflineQueueToServer();
    }
  });
}
