import { ref, uploadBytes, getDownloadURL, deleteObject, UploadResult } from 'firebase/storage';
import { storage } from './config';

/**
 * CV dosyası yükleme servisi
 */
export const cvStorageService = {
  /**
   * CV dosyasını yükle
   * @param file Yüklenecek dosya
   * @param basvuruId Başvuru ID (opsiyonel, yeni başvurularda henüz yok)
   * @returns Dosya bilgileri (URL, ad)
   */
  async uploadCV(
    file: File,
    basvuruId?: string
  ): Promise<{
    cvUrl: string;
    cvDosyaAdi: string;
  }> {
    // Dosya formatını kontrol et (PDF, DOC, DOCX)
    const dosyaAdi = file.name.toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const isValidFormat = allowedExtensions.some(ext => dosyaAdi.endsWith(ext));
    
    if (!isValidFormat) {
      throw new Error('Sadece PDF, DOC ve DOCX formatları desteklenmektedir');
    }

    // Dosya boyutu kontrolü (maksimum 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Dosya boyutu 5MB\'dan büyük olamaz');
    }

    // Storage path: basvurular/{basvuruId veya timestamp}/{dosyaAdi}
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathSegment = basvuruId || `temp_${timestamp}`;
    const storagePath = `basvurular/${pathSegment}/${timestamp}_${safeFileName}`;
    const storageRef = ref(storage, storagePath);

    // Dosyayı yükle
    const uploadResult: UploadResult = await uploadBytes(storageRef, file);
    
    // Download URL'ini al
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return {
      cvUrl: downloadURL,
      cvDosyaAdi: file.name,
    };
  },

  /**
   * CV dosyasını sil
   * @param cvUrl Silinecek dosyanın URL'i
   */
  async deleteCV(cvUrl: string): Promise<void> {
    try {
      // URL'den storage path'ini çıkar
      const urlParts = cvUrl.split('/');
      const encodedPath = urlParts.slice(urlParts.indexOf('basvurular')).join('/');
      const decodedPath = decodeURIComponent(encodedPath.split('?')[0]);
      
      const storageRef = ref(storage, decodedPath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('CV dosyası silinirken hata:', error);
      throw error;
    }
  },
};
