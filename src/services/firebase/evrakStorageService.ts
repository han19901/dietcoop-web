import { ref, uploadBytes, getDownloadURL, deleteObject, UploadResult } from 'firebase/storage';
import { storage } from './config';
import { Evrak, EvrakFormat } from '@/types/evrak';

/**
 * Evrak dosyası yükleme servisi
 */
export const evrakStorageService = {
  /**
   * Evrak dosyasını yükle
   * @param file Yüklenecek dosya
   * @param diyetisyenId Diyetisyen ID
   * @param evrakTipi Evrak tipi
   * @returns Dosya bilgileri (URL, ad, format, boyut)
   */
  async uploadEvrak(
    file: File,
    diyetisyenId: string,
    evrakTipi: Evrak['evrakTipi']
  ): Promise<{
    dosyaUrl: string;
    dosyaAdi: string;
    dosyaFormat: EvrakFormat;
    dosyaBoyutu: number;
  }> {
    // Dosya formatını kontrol et
    const dosyaAdi = file.name.toLowerCase();
    let dosyaFormat: EvrakFormat;
    
    if (dosyaAdi.endsWith('.pdf')) {
      dosyaFormat = 'pdf';
    } else if (dosyaAdi.endsWith('.jpg') || dosyaAdi.endsWith('.jpeg')) {
      dosyaFormat = dosyaAdi.endsWith('.jpeg') ? 'jpeg' : 'jpg';
    } else {
      throw new Error('Sadece JPEG, JPG ve PDF formatları desteklenmektedir');
    }

    // Dosya boyutu kontrolü (maksimum 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Dosya boyutu 10MB\'dan büyük olamaz');
    }

    // Dosya tipi kontrolü
    if (dosyaFormat === 'pdf' && file.type !== 'application/pdf') {
      throw new Error('PDF dosyası geçersiz format');
    }
    if ((dosyaFormat === 'jpg' || dosyaFormat === 'jpeg') && !file.type.startsWith('image/')) {
      throw new Error('Resim dosyası geçersiz format');
    }

    // Storage path: evraklar/{diyetisyenId}/{evrakTipi}/{timestamp}_{dosyaAdi}
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `evraklar/${diyetisyenId}/${evrakTipi}/${timestamp}_${safeFileName}`;
    const storageRef = ref(storage, storagePath);

    // Dosyayı yükle
    const uploadResult: UploadResult = await uploadBytes(storageRef, file);
    
    // Download URL'ini al
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return {
      dosyaUrl: downloadURL,
      dosyaAdi: file.name,
      dosyaFormat,
      dosyaBoyutu: file.size,
    };
  },

  /**
   * Evrak dosyasını sil
   * @param dosyaUrl Silinecek dosyanın URL'i
   */
  async deleteEvrak(dosyaUrl: string): Promise<void> {
    try {
      // URL'den storage path'ini çıkar
      // Firebase Storage URL formatı: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
      const url = new URL(dosyaUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)/);
      if (!pathMatch) {
        throw new Error('Geçersiz dosya URL\'i');
      }
      
      // URL decode
      const storagePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, storagePath);
      
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Evrak dosyası silinirken hata:', error);
      throw error;
    }
  },
};
