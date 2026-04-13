import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, User, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { diyetisyenService } from '@/services/firebase/firestore';
import { mesajService, Mesaj } from '@/services/firebase/mesajService';
import { Diyetisyen } from '@/types/diyetisyen';
import { formatDate } from '@/services/utils/dateUtils';

export default function DiyetisyenMesajlar() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [diyetisyen, setDiyetisyen] = useState<Diyetisyen | null>(null);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (diyetisyen?.id) {
      // Real-time mesaj dinleyicisi
      const unsubscribe = mesajService.subscribeToMessages(
        diyetisyen.id,
        (newMesajlar) => {
          setMesajlar(newMesajlar);
          scrollToBottom();
        }
      );

      return () => unsubscribe();
    }
  }, [diyetisyen]);

  useEffect(() => {
    scrollToBottom();
  }, [mesajlar]);

  const loadData = async () => {
    if (!user?.uid) return;
    
    try {
      const diyetisyenData = await diyetisyenService.getByUserId(user.uid);
      
      if (!diyetisyenData) {
        setLoading(false);
        return;
      }

      setDiyetisyen(diyetisyenData);

      // Mesajları yükle
      const mesajlarData = await mesajService.getByDiyetisyenId(diyetisyenData.id!);
      setMesajlar(mesajlarData);

      // Okunmamış mesajları okundu olarak işaretle
      mesajlarData
        .filter((m) => !m.okundu && m.senderRol === 'admin')
        .forEach((m) => {
          if (m.id) {
            mesajService.markAsRead(m.id);
          }
        });
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Sadece resim ve PDF dosyalarına izin ver
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const validFiles = files.filter(file => 
      allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf')
    );
    
    // Maksimum 5 dosya
    const newFiles = [...selectedFiles, ...validFiles].slice(0, 5);
    setSelectedFiles(newFiles);
    
    // Input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && selectedFiles.length === 0) || !diyetisyen || !user || sending) return;
    
    try {
      setSending(true);
      
      await mesajService.sendMessage(
        diyetisyen.id!,
        user.uid,
        'diyetisyen',
        diyetisyen.adSoyad,
        messageText || '(Dosya eklendi)',
        undefined,
        selectedFiles.length > 0 ? selectedFiles : undefined
      );
      
      setMessageText('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      showError('Mesaj gönderilirken bir hata oluştu');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  if (!diyetisyen) {
    return (
      <div className="card text-center py-12">
        <p className="text-dark-text-secondary text-lg">Diyetisyen bilgileri bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare size={32} />
          İletişim
        </h1>
      </motion.div>

      <div className="card">
        <div className="flex flex-col h-[600px]">
          {/* Mesaj Listesi */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            {mesajlar.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto text-dark-text-secondary mb-4" />
                <p className="text-dark-text-secondary text-lg">
                  Henüz mesaj yok. DietCoop Yönetim ile iletişime geçmek için mesaj gönderebilirsiniz.
                </p>
              </div>
            ) : (
              mesajlar.map((mesaj) => {
                const isDiyetisyen = mesaj.senderRol === 'diyetisyen';
                
                return (
                  <motion.div
                    key={mesaj.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isDiyetisyen ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        isDiyetisyen
                          ? 'bg-accent-green bg-opacity-20 border border-accent-green border-opacity-30'
                          : 'bg-dark-card-hover border border-dark-card'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <User size={16} className="text-dark-text-secondary" />
                        <span className="text-sm font-semibold">{mesaj.senderName}</span>
                        {mesaj.senderRol === 'admin' && (
                          <span className="text-xs bg-accent-blue bg-opacity-20 text-accent-blue px-2 py-0.5 rounded">
                            DietCoop Yönetim
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{mesaj.text}</p>
                      
                      {/* Dosyalar */}
                      {mesaj.dosyalar && mesaj.dosyalar.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {mesaj.dosyalar.map((dosya, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-dark-card rounded">
                              {dosya.dosyaTipi === 'image' ? (
                                <ImageIcon size={16} className="text-accent-green" />
                              ) : (
                                <FileText size={16} className="text-accent-blue" />
                              )}
                              <a
                                href={dosya.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-accent-green hover:underline flex-1"
                              >
                                {dosya.dosyaAdi}
                              </a>
                              {dosya.dosyaTipi === 'image' && (
                                <img
                                  src={dosya.url}
                                  alt={dosya.dosyaAdi}
                                  className="max-w-[200px] max-h-[200px] rounded cursor-pointer"
                                  onClick={() => window.open(dosya.url, '_blank')}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-dark-text-secondary mt-2">
                        {formatDate(mesaj.olusturmaTarihi)}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mesaj Gönderme */}
          <div className="border-t border-dark-card-hover p-4">
            {/* Seçili Dosyalar */}
            {selectedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-dark-card-hover px-3 py-2 rounded-lg text-sm"
                  >
                    {file.type.startsWith('image/') ? (
                      <ImageIcon size={16} className="text-accent-green" />
                    ) : (
                      <FileText size={16} className="text-accent-blue" />
                    )}
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-dark-text-secondary hover:text-accent-red"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="btn-secondary flex items-center gap-2 cursor-pointer"
                title="Resim veya PDF ekle (Maks. 5 dosya)"
              >
                <Paperclip size={18} />
              </label>
              
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Mesajınızı yazın... (Enter ile gönder, Shift+Enter ile yeni satır)"
                rows={3}
                className="input flex-1 resize-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
                className="btn-primary flex items-center gap-2 px-6"
              >
                <Send size={18} />
                {sending ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
            <p className="text-xs text-dark-text-secondary mt-2">
              Resim (JPG, PNG, GIF, WEBP) veya PDF dosyası ekleyebilirsiniz. Maksimum 5 dosya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

