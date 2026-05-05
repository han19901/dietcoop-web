/**
 * Admin Manuel Kullanıcı Kayıt Servisi
 *
 * Web admin panelinden mobil uygulama için kullanıcı oluşturmak üzere ilgili
 * Cloud Function'ı (`adminCreateMobileUser`) çağırır. Çağrıyı yapan admin'in
 * Firebase ID token'ı Authorization header ile gönderilir; Cloud Function
 * tarafında yetki kontrolü yapılır.
 */

import { auth } from './config';

export interface AdminCreateMobileUserParams {
  email: string;
  password: string;
  name: string;
  surname: string;
  role: 'client' | 'dietitian';
  phone?: string;
}

export interface AdminCreateMobileUserResult {
  success: true;
  uid: string;
  email: string;
  message: string;
}

const CLOUD_FUNCTIONS_URL =
  import.meta.env.VITE_CLOUD_FUNCTIONS_URL ||
  'https://us-central1-webdietcoop.cloudfunctions.net';

export const adminUserService = {
  async createMobileUser(
    params: AdminCreateMobileUserParams
  ): Promise<AdminCreateMobileUserResult> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Oturum açmanız gerekiyor');
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch(`${CLOUD_FUNCTIONS_URL}/adminCreateMobileUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(params),
    });

    let data: any;
    const rawText = await response.text();
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { error: rawText || `HTTP ${response.status}` };
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Kullanıcı oluşturulamadı (HTTP ${response.status})`);
    }

    return data as AdminCreateMobileUserResult;
  },
};
