/**
 * Hesap Silme İstekleri Service (Admin Onaylı Akış)
 *
 * - listRequests: bekleyen / işlenmiş silme isteklerini getirir
 * - approve: bir isteği onaylar → server-side silme yürütülür
 * - reject: bir isteği reddeder → kullanıcı silinmez
 *
 * Tüm endpoint'ler webdietcoop projesindeki Cloud Functions'ta tanımlıdır;
 * çağrılar admin'in Firebase ID token'ı ile yapılır.
 */

import { auth } from './config';

const CLOUD_FUNCTIONS_URL =
  import.meta.env.VITE_CLOUD_FUNCTIONS_URL ||
  'https://us-central1-webdietcoop.cloudfunctions.net';

export type DeletionRequestStatus =
  | 'awaiting_admin_approval'
  | 'approved'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'pending'; // legacy

export interface DeletionRequestItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userSurname: string;
  userPhone: string;
  userRole: 'client' | 'dietitian' | 'admin';
  status: DeletionRequestStatus;
  requestedAt: string | null;
  reviewedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  reviewedByAdminId?: string | null;
}

async function authedFetch(path: string, body?: any): Promise<any> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Oturum açmanız gerekiyor');
  }
  const idToken = await currentUser.getIdToken();

  const response = await fetch(`${CLOUD_FUNCTIONS_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: body ? JSON.stringify(body) : '{}',
  });

  const rawText = await response.text();
  let data: any;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { error: rawText || `HTTP ${response.status}` };
  }
  if (!response.ok) {
    throw new Error(data.error || `İstek başarısız (HTTP ${response.status})`);
  }
  return data;
}

export const hesapSilmeService = {
  async listRequests(
    status: DeletionRequestStatus | 'all' = 'awaiting_admin_approval',
    limit = 50
  ): Promise<DeletionRequestItem[]> {
    const data = await authedFetch('/listAccountDeletionRequests', { status, limit });
    return (data.items || []) as DeletionRequestItem[];
  },

  async approve(requestId: string): Promise<{ success: true; userId: string }> {
    const data = await authedFetch('/processAccountDeletion', { requestId });
    return data as { success: true; userId: string };
  },

  async reject(requestId: string, reason?: string): Promise<{ success: true }> {
    const data = await authedFetch('/rejectAccountDeletion', { requestId, reason });
    return data as { success: true };
  },
};
