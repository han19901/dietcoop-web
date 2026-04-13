/**
 * Firebase Firestore db referansı.
 * ENTEGRASYON: Kendi Firebase config'inizden db'yi import edin.
 * Örnek: import { db } from './config';
 */
// @ts-expect-error - Entegrasyon sırasında gerçek import ile değiştirilecek
export const db: import('firebase/firestore').Firestore = undefined;
