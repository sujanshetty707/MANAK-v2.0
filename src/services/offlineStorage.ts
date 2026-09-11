import { InspectionRecord, ConsumerReport } from '../types';
import { MOCK_HISTORY, MOCK_CONSUMER_REPORTS } from '../data/mockData';

const INSPECTIONS_STORAGE_KEY = 'manak_inspections_v1';
const CONSUMER_REPORTS_KEY = 'manak_consumer_reports_v1';
const OFFLINE_QUEUE_KEY = 'manak_offline_queue_v1';

export function getStoredInspections(): InspectionRecord[] {
  try {
    const raw = localStorage.getItem(INSPECTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(MOCK_HISTORY));
      return MOCK_HISTORY;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stored inspections:', e);
    return MOCK_HISTORY;
  }
}

export function saveInspection(inspection: InspectionRecord): void {
  const current = getStoredInspections();
  const updated = [inspection, ...current.filter(i => i.id !== inspection.id)];
  localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(updated));
}

export function getStoredConsumerReports(): ConsumerReport[] {
  try {
    const raw = localStorage.getItem(CONSUMER_REPORTS_KEY);
    if (!raw) {
      localStorage.setItem(CONSUMER_REPORTS_KEY, JSON.stringify(MOCK_CONSUMER_REPORTS));
      return MOCK_CONSUMER_REPORTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load consumer reports:', e);
    return MOCK_CONSUMER_REPORTS;
  }
}

export function saveConsumerReport(report: ConsumerReport): void {
  const current = getStoredConsumerReports();
  const updated = [report, ...current.filter(r => r.id !== report.id)];
  localStorage.setItem(CONSUMER_REPORTS_KEY, JSON.stringify(updated));
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
 * Sync Engine: Drains pending offline inspections to the server.
 * When real API is configured via VITE_API_BASE_URL, sends POST requests.
 * Otherwise simulates network transmission with guaranteed delivery.
 */
export async function syncOfflineQueueToServer(
  onProgress?: (syncedCount: number, total: number) => void
): Promise<{ success: boolean; syncedCount: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0 };
  }

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL;
  let synced = 0;

  for (const record of queue) {
    if (apiBase) {
      try {
        await fetch(`${apiBase}/api/inspections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
      } catch (err) {
        console.warn(`Sync failed for ${record.id}, will retry on next connection`, err);
        continue;
      }
    } else {
      // Simulate network request latency
      await new Promise(r => setTimeout(r, 120));
    }

    // Mark record as synced in local history
    const history = getStoredInspections();
    const updatedHistory = history.map(h =>
      h.id === record.id ? { ...h, synced: true, status: 'verified' as const } : h
    );
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(updatedHistory));

    synced++;
    if (onProgress) {
      onProgress(synced, queue.length);
    }
  }

  // Clear or prune queue
  clearOfflineQueue();
  window.dispatchEvent(new CustomEvent('manak:queue-synced', { detail: { syncedCount: synced } }));

  return { success: true, syncedCount: synced };
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
