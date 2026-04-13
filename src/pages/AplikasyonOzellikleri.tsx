import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  FileText,
  CheckCircle,
  ArrowRight,
  Home as HomeIcon,
  HelpCircle,
  Package,
  MessageCircle,
  Menu,
  X,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Activity,
  Award,
  BookOpen,
  MessageSquare,
  User,
  ClipboardList
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/seo/SEO';

export default function AplikasyonOzellikleri() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});

  // Sayfa yüklendiğinde en üste scroll yap
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Her başlık ayrı kategori olarak düzenlenmiş
  const features = [
    {
      id: 1,
      images: [
        '/Kullan/istatistik1.jpeg',
        '/Kullan/kontrol1.jpeg',
        '/Kullan/kontol 2.jpeg',
        '/Kullan/plan merkezi 1.jpeg'
      ],
      title: 'İstatistik Kartları',
      description: 'İstatistik kartları, diyetisyenlerin danışanlarını ve diyet planlarını takip etmeleri için gerekli tüm bilgileri tek bir ekranda sunar.',
      detailedDescription: 'İstatistik kartları sayesinde aktif danışan sayınızı, diyet planı durumlarınızı ve genel performans metriklerinizi anında görüntüleyebilirsiniz. Bu kartlar, günlük işlemlerinizi hızlandırmak ve karar verme süreçlerinizi desteklemek için tasarlanmıştır.',
      highlights: [
        'Anlık istatistik görüntüleme',
        'Kolay erişilebilir bilgi panelleri',
        'Görsel metrik gösterimi'
      ],
      icon: BarChart3
    },
    {
      id: 2,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.33.jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.33 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.33 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.33 (3).jpeg'
      ],
      title: 'Aktif Danışan Sayınızı Gösterir',
      description: 'Aktif danışan sayınızı anında görüntüleyin. Bu istatistik, şu anda aktif diyet planına sahip danışanlarınızın sayısını gösterir.',
      detailedDescription: 'Aktif danışan sayısı, planladığınız diyet planınızın belirlediğiniz tarih itibariyle hayata geçmiş veya hala devam etmekte olduğu danışanları ifade eder. Bu kartı tıkladığınızda, Aktif, Gelecek, Geçmiş ve Taslak diyet planlarınızı ve sayılarınızı detaylı olarak görebilirsiniz.',
      highlights: [
        'Anlık aktif danışan sayısı görüntüleme',
        'Plan durumlarına göre filtreleme',
        'Detaylı plan listesi erişimi'
      ],
      icon: Users
    },
    {
      id: 3,
      images: [
        '/Kullan/kontrol1.jpeg',
        '/Kullan/kontol 2.jpeg',
        '/Kullan/plan merkezi 1.jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.34.jpeg'
      ],
      title: 'Kontrol Merkezi',
      description: 'Tüm diyet planlarınızı tek bir merkezden yönetin. Kontrol Merkezi, aktif, gelecek, geçmiş ve taslak planlarınızı organize bir şekilde sunar.',
      detailedDescription: 'Kontrol Merkezi, diyet planı aktif danışan sayınızı ve tüm plan durumlarınızı görüntülemenizi sağlar. Bu merkezden planlarınızı filtreleyebilir, arayabilir ve yönetebilirsiniz. Her plan durumu için ayrı kartlar ve sayılar gösterilir.',
      highlights: [
        'Merkezi plan yönetimi',
        'Tüm plan durumlarını görüntüleme',
        'Hızlı filtreleme ve arama',
        'Plan durumlarına göre organizasyon'
      ],
      icon: Target
    },
    {
      id: 4,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.33 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.33 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.33 (3).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.34.jpeg'
      ],
      title: 'Diyet Planı Aktif Danışan Sayınızı Gösterir',
      description: 'Diyet planı aktif olan danışanlarınızın sayısını görüntüleyin. Bu istatistik, şu anda aktif bir diyet planına sahip danışanlarınızı gösterir.',
      detailedDescription: 'Diyet planı aktif danışan sayısı, belirlediğiniz tarih aralığında aktif olan ve devam eden diyet planlarına sahip danışanlarınızı ifade eder. Bu sayı, günlük işlemlerinizi planlamanız için önemli bir metrik sağlar.',
      highlights: [
        'Aktif plan sayısı takibi',
        'Güncel danışan durumu',
        'Plan bazlı istatistikler'
      ],
      icon: ClipboardList
    },
    {
      id: 5,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.34 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.34 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.34 (3).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.35.jpeg'
      ],
      title: 'Uyarı Eşiği',
      description: 'Sistemde belirlediğiniz eşikler üzerinden, hangi danışanın belirlediğiniz eşiğin altında olduğunu görüntüleyin.',
      detailedDescription: 'Uyarı Eşiği istatistiği, Diyet Uyum, Su İçme Uyumu, Egzersiz Uyumu, Kilo Hedef İlerlemesi gibi diyet aktivitelerinde, hangi danışanın sizin istediğiniz eşiğin altında olduğunu, her sabah saat 8\'de bir önceki günün verileriyle sağlamaktadır. Bu sayede kiminle hangi konuda iletişim kurabileceğinizi anında görebilirsiniz.',
      highlights: [
        'Eşik altındaki danışanları belirleme',
        'Her sabah saat 8\'de otomatik güncelleme',
        'İletişim gerektiren durumları görme',
        'Diyet uyum, su, egzersiz ve kilo takibi'
      ],
      icon: AlertCircle
    },
    {
      id: 6,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.35 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.35 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.35 (3).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.36.jpeg'
      ],
      title: 'Hareket Eşiği',
      description: 'Planlama gerektiren konuları belirleyin. Hareket Eşiği, hangi danışanlar için yeni planlama yapmanız gerektiğini gösterir.',
      detailedDescription: 'Hareket Eşiği istatistiği, Plan ilerleme Oranı, Su İçme Uyumu, Egzersiz Uyumu, Kilo Hedef İlerlemesi gibi diyet aktivitelerinde, hangi danışanın sizin istediğiniz eşiğin altında olduğunu, her sabah saat 8\'de bir önceki günün verileriyle sağlamaktadır. Bu sayede hangi konularda planlama yapmanız gerektiğini görebilirsiniz.',
      highlights: [
        'Planlama gerektiren durumları görme',
        'Her sabah saat 8\'de otomatik güncelleme',
        'Plan ilerleme oranı takibi',
        'Aksiyon gerektiren danışanları belirleme'
      ],
      icon: Activity
    },
    {
      id: 7,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.36 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.36 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.36 (3).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.37.jpeg'
      ],
      title: 'Başarı Eşiği',
      description: 'Tebrik ve motivasyon gerektiren danışanları görüntüleyin. Başarı Eşiği, hedeflerini aşan danışanlarınızı gösterir.',
      detailedDescription: 'Başarı Eşiği istatistiği, Diyet Uyum Oranı, Su İçme Uyumu, Egzersiz Uyumu, Kilo Hedef İlerlemesi gibi diyet aktivitelerinde, hangi danışanın sizin istediğiniz eşiğin üstünde olduğunu, her sabah saat 8\'de bir önceki günün verileriyle sağlamaktadır. Bu sayede hangi konularda danışanı tebrik ve motive etmeniz gerektiğini hatırlatır.',
      highlights: [
        'Başarılı danışanları belirleme',
        'Her sabah saat 8\'de otomatik güncelleme',
        'Tebrik ve motivasyon fırsatları',
        'Pozitif geri bildirim zamanlaması'
      ],
      icon: Award
    },
    {
      id: 8,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.37 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.37 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.38.jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.38 (1).jpeg'
      ],
      title: 'Diyet Planı Merkezi',
      description: 'Tüm diyet planlarınızı merkezi bir yerden yönetin. Aktif, Gelecek, Geçmiş ve Taslak planlarınızı görüntüleyin.',
      detailedDescription: 'Bu kartınızda Aktif Diyet Planlarınızı, Sonlanmış Diyet Planlarınızı (Diyetisyen tarafından manuel, danışan tarafından manuel, ve diyet planı için planlanan tarih sürelerinin dolmasıyla), Gelecek Diyet Planlarınızı (İleri tarih için oluşturduğunuz daha plan tarihinin ilk günü bugün olmayan planlar) ve Taslak Diyet Planlarınızı (Diyet planı yaptığınız ancak henüz planı tamamla tuşuna basmadığınız diyet planları) görüntüleyebilirsiniz.',
      highlights: [
        'Aktif diyet planlarını görüntüleme',
        'Sonlanmış planları görüntüleme',
        'Gelecek planları görüntüleme',
        'Taslak planları görüntüleme',
        'Merkezi plan yönetimi'
      ],
      icon: FileText
    },
    {
      id: 9,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.38 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.38 (3).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.38 (4).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.39.jpeg'
      ],
      title: 'Diyet Planı İzleme',
      description: 'Aktif diyet planı olan danışanlarınızın genel istatistiklerini görüntüleyin. Plan ilerlemesi, uyum oranları ve performans metriklerini takip edin.',
      detailedDescription: 'Bu kartta aktif diyet planı olan danışanlarınızın genel istatistiklerini görürsünüz: Plan ilerlemesi yüzdelikleri, Diyet Uyum Oran istatistikleri, Su İçme Ortalamaları, Egzersiz Uyum İstatistikleri. Eğer danışana tıklarsanız danışan özelinde gösterilen tüm detaylara erişebilirsiniz. Dilerseniz planı sonlandırabilirsiniz, veyahut plan istatistiklerini bildirim olarak danışana gönderebilirsiniz.\n\nBu kısmı belli tarih sıklıklarında rapor indirmenizi öneririz, ayrıca online veya yüzyüze yapacağınız randevularda kullanabileceğiniz verilere sahip olan ve dilediğiniz zaman rapor indirebileceğiniz bir kısımdır.',
      highlights: [
        'Plan ilerlemesi yüzdelikleri',
        'Diyet uyum oranı istatistikleri',
        'Su içme ortalamaları',
        'Egzersiz uyum istatistikleri',
        'Danışan özelinde detaylı bilgiler',
        'Rapor indirme özelliği'
      ],
      icon: TrendingUp
    },
    {
      id: 10,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.39 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.39 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.39 (3).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.40.jpeg'
      ],
      title: 'Danışan Aktiviteleri İzleme',
      description: 'Diyet planı aktif olan danışanlarınızın günlük öğün aktivitelerini dilediğiniz zaman görüntüleyin.',
      detailedDescription: 'Bu kartta diyet planı aktif olan danışanlarınızın günlük öğün aktivitelerini dilediğiniz zaman görüntüleyebilmeniz için oluşturulmuştur. Danışan özelinde dün ve bugün şeklinde verileri görebilirsiniz. Bu sayede danışanlarınızın plana uyumunu anlık olarak takip edebilirsiniz.',
      highlights: [
        'Günlük öğün aktivitelerini izleme',
        'Danışan özelinde dün ve bugün verilerini görüntüleme',
        'Anlık aktivite takibi',
        'Detaylı aktivite logları'
      ],
      icon: Activity
    },
    {
      id: 11,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.40 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.40 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.40 (3).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.40 (4).jpeg'
      ],
      title: 'Eşleşmeler',
      description: 'Danışanlarınızla eşleşme isteği gönderin ve eşleşmelerinizi yönetin. Yeni danışanlar için eşleşme sürecini kolaylaştırın.',
      detailedDescription: 'Bu kartta danışanı takip edebilmeniz için eşleşme isteği gönderebileceğiniz, sonlanan eşleşmeleri görüntüleyebileceğiniz, Aktif eşleşmelerinizi ve bekleyen eşleşmelerinizi görüntüleyebileceğiniz bölümdür. Bir danışana ilk defa hizmet verecekseniz, programı indirmesini ve size sisteme kayıt olduğu mail adresini belirtmesini istemeniz gerekmektedir. Danışanın mail adresini "Yeni Eşleşme İsteği Gönder" butonuna tıklayarak eşleşme isteği gönderebilirsiniz, danışanın bunu kabul etmesi halinde karşılıklı eşleşme sağlanmış olur ve artık diyet planı hazırlayabilirsiniz.',
      highlights: [
        'Eşleşme isteği gönderme',
        'Aktif eşleşmeleri görüntüleme',
        'Bekleyen eşleşmeleri görüntüleme',
        'Sonlanmış eşleşmeleri görüntüleme',
        'Yeni danışanlar için eşleşme süreci'
      ],
      icon: Users
    },
    {
      id: 12,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.41.jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.41 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.41 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.41 (3).jpeg'
      ],
      title: 'Diyet Planı Yap',
      description: 'Danışan seçimi yaparak tarih aralığını belirleyin ve diyet planınızı oluşturun. Manuel, şablon veya parse yöntemi ile plan hazırlayın.',
      detailedDescription: 'Bu kartınızda danışan seçimi yaparsınız daha sonrasında tarih aralığınız aktif olur. Diyet planınızın başlangıç ve bitiş günlerini seçersiniz. Burada önemli nokta aynı gün için diyet planı başlangıç süresi veremezsiniz. Ayrıca ilgili danışan için başka tarihlerde gelecek diyet planı hazırlamışsanız sistem o tarih için başka geçerli diyet olanı olduğu hakkında uyarı verir ve işlemi devam ettiremezsiniz.\n\nBu bölümde sizden günlük uygulamak istediğiniz "Günlük Öğün Sayısı" nı istemektedir. 1-15 arası bir değer girebilirsiniz. ve daha sonrasında "Diyet Planı Oluştur" düğmesine bastığınızda sizi "Öğün Saatlerini Belirleyin" bölümüne aktararak, Her gün için hangi saatlerde yemek yemesini istediğinizi belirten bölüme geçirir. Her gün için saat değiştirebilirsiniz. 1 Öğünün saatini değiştirdikten sonra kaydet diyerek yanında bulunan "Tümüne" işaretine bastığınızda, tüm günlerde öğünler değişir.\n\nMevcut sayfada bulunan + iconuna tıkladığınızda karşınıza "Plan Düzenleme Yönetimini Seçin" sayfası çıkmaktadır. Burada planı nasıl oluşturmak istediğinizi seçebilirsiniz: Manuel Hazırlama, Şablon Kullan, Parse Kullan olarak hazırlama sağlayabilirsiniz.\n\nManuel hazırlamak isterseniz, her gün için sizden tek tek öğün ve ögelerini yazmanızı isteyecektir. Öğün tipi seçimi sizin için oluşturulmuştur danışanlar öğünleri, sizin belirlediğiniz sıraya göre 1.Öğün, 2.Öğün tarzında görmektedir. Öğün Ögeleri ise ayrı ayrı girilecek şekilde tasarlanmıştır veyahut tek bir öğüne tüm ögeleri yazabilirsiniz. Gram, ml, adet, dilim, kase, bardak ölçülerini kullanabilirsiniz. Opsiyonel olarak kendinizin görmesi için Kalori girebilirsiniz veya girmeyebilirsiniz, kalori miktarını sadece siz görmektesiniz danışanlara bu bölüm gösterilmemektedir.\n\nŞablon Kullan seçeneğini seçmeniz halinde size daha öncesinde oluşturduğunuz Şablonlarınız getirilir ve bunlardan birisini seçmeniz istenir. Seçtiğiniz şablonda "Şablonu Kullan" butonuna tıklayarak ekleme yapabilirsiniz veyahut hem şablonu kullan hem manuel özellikleri ile de Diyet Planı oluşturabilirsiniz.\n\nParse Kullanımı ise mevcutta bir diyet olanınızı kopyala yapıştır yöntemi ile yapıştırdığınızda günlere, öğünlere ve öğelere ayırarak sizin için işlem kolaylığı yaratır.\n\nModülleri Yönet tuşuna bastığınızda: Kilo Takibi, Su Tüketimi, Egzersiz ve Vücut Ölçümleri modüllerini belirlersiniz. Kapalı\'dan açığa çevirdiğiniz modüllerde ilgili alanları doldurduğunuzda seçim yaptığınız ilgili günlerde modüllerin iconlarını görebileceksiniz.',
      highlights: [
        'Danışan seçimi ve tarih aralığı belirleme',
        '1-15 arası günlük öğün sayısı belirleme',
        'Öğün saatlerini günlere göre özelleştirme',
        'Manuel, Şablon veya Parse yöntemi ile plan oluşturma',
        'Öğünleri günler arası çoğaltma ve düzenleme',
        'Kilo takibi, su, egzersiz ve ölçüm modülleri ekleme',
        'Plan istatistikleri ile eksik öğün takibi'
      ],
      icon: FileText
    },
    {
      id: 13,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.42.jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.42 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.42 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.42 (3).jpeg'
      ],
      title: 'Diyet Plan Sonuç Kartları',
      description: 'Sonlanmış veya sonlandırılmış diyet planlarınızla ilgili son raporları alın. Detaylı analiz ve performans metriklerini görüntüleyin.',
      detailedDescription: 'Bu bölümde sonlanmış veya sonlandırılmış diyet planlarınızla ilgili olarak son raporu alabileceğiniz bölümdür. İlgili danışanın kartına tıklayarak dilediğiniz zaman bu raporu indirebilirsiniz. Bu raporda: Diyet Takvim Süresi, Kullanılan Diyet Planı ve Listesi, Hedeflere varma oranları, modül eklemişseniz onlarla alakalı olarak süreç bilgilerinin hepsi yer almaktadır.',
      highlights: [
        'Sonlanmış diyet planlarının son raporlarını indirme',
        'Diyet takvim süresi ve kullanılan plan listesi',
        'Hedeflere varma oranları',
        'Modül bilgileri ve süreç analizi',
        'Detaylı performans metrikleri'
      ],
      icon: ClipboardList
    },
    {
      id: 14,
      images: [
        '/Kullan/şablon1.jpeg',
        '/Kullan/şablon2.jpeg',
        '/Kullan/şablon3.jpeg',
        '/Kullan/şablon4.jpeg'
      ],
      title: 'Kütüphane (Şablonlar Kütüphanesi)',
      description: 'Diyet planlarınızı şablon olarak kaydedin ve tekrar kullanın. Kategorilere ayırarak organize edin ve hızlıca erişin.',
      detailedDescription: 'Bu bölümde yeni şablon oluşturabilir, buna kategoriler ekleyebilirsiniz. Şablonlarınızın sayısını, filtrelemelerini görebileceğiniz gibi, diyet planı oluşturmak için kullanacağınız tüm şablonlarınızı yine buradan Yapıştırma Yöntemi veya Manuel olarak ekleyebilirsiniz, düzenleyebilirsiniz, silebilirsiniz.',
      highlights: [
        'Yeni şablon oluşturma',
        'Kategorilere ayırma',
        'Şablon filtreleme ve arama',
        'Yapıştırma yöntemi ile hızlı ekleme',
        'Manuel düzenleme ve silme',
        'Tekrar kullanım için optimizasyon'
      ],
      icon: BookOpen
    },
    {
      id: 15,
      images: [
        '/Kullan/Mesaj1.jpeg',
        '/Kullan/mesaj2.jpeg',
        '/Kullan/mesaj3.jpeg',
        '/Kullan/mesaj4.jpeg'
      ],
      title: 'Mesajlar',
      description: 'Danışanlarınızla güvenli ve özel mesajlaşma sistemi. Sadece eşleşmiş danışanlarınızla iletişim kurabilirsiniz.',
      detailedDescription: 'Diyetisyenlerin sadece kendi danışanları ile konuşabildikleri özel sistemimizdir. Danışanınız sizden başka kimseye bu sistemde mesaj atamaz, sizde aktif eşleşmeniz bulunmayan bir danışana (eşleşme sonlanmış olması durumlarında mesajlaşma inaktif olur.) mesaj atamazsınız.\n\nÖzellikler:\n- Gönderdiğiniz ve size gelen mesajlar tıpkı whatsapp, telegram gibi push notification olarak sizlere ve danışanlara gelir.\n- Eğer danışanınıza her öğünün resmini göndermesini isterseniz, Diyetime Uydum diyen danışanlar için Diyetisyene Gönder tuşu ile resim çekerek size mesaj gönderebilir.\n- En önemli özelliklerinden birisi bu sistemde görseller için 30 saniye kuralı vardır, gönderilen resimler alıcının açmasının ardından 30 saniye içerisinde imha edilir. Sizin için önemli bir görsel ise ScreenShot almanızda fayda olabilir veyahut tekrar göndermesini isteyebilirsiniz.',
      highlights: [
        'Özel mesajlaşma sistemi (sadece eşleşmiş danışanlar)',
        'Push notification ile anlık bildirimler',
        '30 saniye kuralı ile güvenli görsel paylaşımı',
        'Öğün fotoğrafları gönderme',
        'WhatsApp benzeri kullanıcı deneyimi'
      ],
      icon: MessageSquare
    },
    {
      id: 16,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.45.jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.45 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.45 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.45 (3).jpeg'
      ],
      title: 'Danışanlarım',
      description: 'Aktif ve sonlanmış danışanlarınızı görüntüleyin. Danışan bilgilerine, diyet planlarına ve eşleşmelere hızlıca erişin.',
      detailedDescription: 'Bu sekmede Aktif Danışanlarınızı ve Sonlanmış danışanlarınızı görüntüleyebilirsiniz. Sistem aktif danışanı eşleşme sayısına göre değil, aktif diyet planı olup olmamasına göre ayırmaktadır. Danışana tıklayarak: Bilgilerini görebileceğiniz gibi Diyet Planlarını Taslak Gelecek-Aktif-Geçmiş olarak görüntüleyebilirsiniz. Ayrıca bu sayfadan yine eşleşmeler bölümüne de geçiş yapabilirsiniz.',
      highlights: [
        'Aktif danışanları görüntüleme',
        'Sonlanmış danışanları görüntüleme',
        'Danışan bilgilerine erişim',
        'Diyet planlarını görüntüleme (Taslak, Gelecek, Aktif, Geçmiş)',
        'Eşleşmeler bölümüne geçiş'
      ],
      icon: Users
    },
    {
      id: 17,
      images: [
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.45.jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.46 (1).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.46 (2).jpeg',
        '/Kullan/WhatsApp Image 2026-01-02 at 00.20.45 (3).jpeg'
      ],
      title: 'Profil',
      description: 'Kişisel bilgilerinizi, resminizi ve mesleki bilgilerinizi güncelleyin. Danışanlarınızın göreceği profil kartınızı oluşturun.',
      detailedDescription: 'Kişisel bilgilerinizi girebileceğiniz, resminizi ve mesleki bilgilerinizi girebileceğiniz sayfanızdır. Eğer danışan sizin üstünüze tıklarsa, profil kartı olarak bazı bilgileriniz gösterilir.',
      highlights: [
        'Kişisel bilgileri güncelleme',
        'Profil fotoğrafı ekleme',
        'Mesleki bilgileri düzenleme',
        'Danışanlar için görünür profil kartı',
        'Profesyonel kimlik oluşturma'
      ],
      icon: User
    }
  ];

  const nextImage = (featureId: number) => {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;
    setCurrentImageIndex(prev => ({
      ...prev,
      [featureId]: ((prev[featureId] || 0) + 1) % feature.images.length
    }));
  };

  const prevImage = (featureId: number) => {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;
    setCurrentImageIndex(prev => ({
      ...prev,
      [featureId]: ((prev[featureId] || 0) - 1 + feature.images.length) % feature.images.length
    }));
  };

  // SEO için structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DietCoop - Aplikasyon Özellikleri',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web, iOS, Android',
    description: 'Diyetisyenler için tasarlanmış kapsamlı dijital diyet yönetim platformu. İstatistik kartları, danışan takibi, diyet planı oluşturma, mesajlaşma ve daha fazlası.',
    url: 'https://www.dietcoop.com/aplikasyon-ozellikleri',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY'
    },
    featureList: [
      'İstatistik Kartları',
      'Aktif Danışan Takibi',
      'Kontrol Merkezi',
      'Diyet Planı Yönetimi',
      'Uyarı Eşiği Sistemi',
      'Hareket Eşiği Takibi',
      'Başarı Eşiği İstatistikleri',
      'Diyet Planı Merkezi',
      'Diyet Planı İzleme',
      'Danışan Aktiviteleri İzleme',
      'Eşleşme Yönetimi',
      'Diyet Planı Oluşturma',
      'Diyet Plan Sonuç Kartları',
      'Şablonlar Kütüphanesi',
      'Mesajlaşma Sistemi',
      'Danışan Yönetimi',
      'Profil Yönetimi'
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150'
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title="Aplikasyon Özellikleri - DietCoop | Profesyonel Diyet Yönetim Platformu"
        description="DietCoop'un tüm özelliklerini keşfedin: İstatistik kartları, danışan takibi, diyet planı oluşturma, mesajlaşma sistemi, şablon kütüphanesi ve daha fazlası. Diyetisyenler için tasarlanmış kapsamlı dijital platform."
        keywords="diyetisyen uygulaması, diyet planı yazılımı, danışan takip sistemi, diyetisyen platformu, dijital diyet yönetimi, diyet uygulaması özellikleri, diyetisyen yazılımı, beslenme takip sistemi, diyet planı oluşturma, danışan yönetim sistemi, diyetisyen mesajlaşma, şablon kütüphanesi, diyet istatistikleri"
        image="/DietCoop Logo.png"
        url="/aplikasyon-ozellikleri"
        type="website"
        structuredData={structuredData}
        canonical="https://www.dietcoop.com/aplikasyon-ozellikleri"
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 mx-auto">
              <Link to="/" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                <HomeIcon size={18} />
                Başlangıç
              </Link>
              <Link to="/#nasil-calisir" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                <HelpCircle size={18} />
                Nasıl Çalışır
              </Link>
              <Link to="/aplikasyon-ozellikleri" className="text-[#00ff88] hover:text-[#00ff88]/90 transition text-base font-medium flex items-center gap-2 border-b-2 border-[#00ff88] pb-1">
                <Sparkles size={18} />
                Aplikasyon Özellikleri
              </Link>
              <Link to="/#paketlerimiz" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                <Package size={18} />
                Paketlerimiz
              </Link>
              <Link to="/#sss" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                <MessageCircle size={18} />
                SSS
              </Link>
              <Link to="/login" className="bg-[#00ff88] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[#00ff88]/90 transition text-base">
                Giriş Yap
              </Link>
            </div>

            {/* Mobile Navigation Buttons */}
            <div className="md:hidden flex items-center gap-2">
              <Link 
                to="/login" 
                className="bg-[#00ff88] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#00ff88]/90 transition text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Giriş
              </Link>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-white/10 py-4"
              >
                <div className="flex flex-col space-y-3">
                  <Link 
                    to="/" 
                    className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HomeIcon size={18} />
                    Başlangıç
                  </Link>
                  <Link 
                    to="/#nasil-calisir" 
                    className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HelpCircle size={18} />
                    Nasıl Çalışır
                  </Link>
                  <Link 
                    to="/aplikasyon-ozellikleri" 
                    className="text-[#00ff88] hover:text-[#00ff88]/90 transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Sparkles size={18} />
                    Aplikasyon Özellikleri
                  </Link>
                  <Link 
                    to="/#paketlerimiz" 
                    className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package size={18} />
                    Paketlerimiz
                  </Link>
                  <Link 
                    to="/#sss" 
                    className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle size={18} />
                    SSS
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section - Modernized */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/5 via-transparent to-[#00ff88]/5 animate-pulse" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ff88]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00ff88]/10 rounded-full blur-3xl animate-pulse delay-2000" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00ff88]/20 to-[#00ff88]/10 backdrop-blur-xl px-6 py-3 rounded-full mb-8 border border-[#00ff88]/30 shadow-lg shadow-[#00ff88]/20"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="text-[#00ff88]" size={20} />
              </motion.div>
              <span className="text-[#00ff88] font-semibold text-sm md:text-base">Aplikasyon Özellikleri</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight bg-gradient-to-r from-white via-white to-[#00ff88] bg-clip-text text-transparent"
            >
              DietCoop ile
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="block text-[#00ff88] mt-4 drop-shadow-[0_0_30px_rgba(0,255,136,0.5)]"
              >
                Profesyonel Diyet Yönetimi
              </motion.span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl lg:text-3xl text-white/70 font-light max-w-4xl mx-auto leading-relaxed"
            >
              Diyetisyenler için tasarlanmış{' '}
              <span className="text-[#00ff88] font-medium">kapsamlı özellikler</span>. 
              Danışan takibinden planlamaya, istatistiklerden iletişime kadar{' '}
              <span className="text-[#00ff88] font-medium">her şey tek platformda</span>.
            </motion.p>
          </motion.div>

          {/* Quick Stats - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16 max-w-5xl mx-auto"
          >
            {[
              { icon: Users, label: 'Sınırsız Danışan', value: '∞', color: 'from-blue-500 to-cyan-500' },
              { icon: Target, label: 'Otomatik Takip', value: '7/24', color: 'from-purple-500 to-pink-500' },
              { icon: TrendingUp, label: 'Detaylı Raporlar', value: '100%', color: 'from-green-500 to-emerald-500' },
              { icon: Shield, label: 'Güvenli Platform', value: 'SSL', color: 'from-orange-500 to-red-500' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 hover:border-[#00ff88]/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#00ff88]/20">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="text-[#00ff88] mx-auto mb-4" size={36} />
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
                      className="text-4xl md:text-5xl font-bold text-[#00ff88] mb-2"
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-white/70 text-sm md:text-base font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section - Completely Modernized */}
      <section className="py-20 px-4 relative">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-72 h-72 bg-[#00ff88]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#00ff88]/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isEven = index % 2 === 0;
            
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-150px" }}
                transition={{ duration: 0.8, delay: index * 0.1, type: "spring", stiffness: 100 }}
                className={`mb-40 ${index === features.length - 1 ? 'mb-0' : ''}`}
              >
                <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}>
                  {/* Mobile Screenshots Slider Section - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, scale: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex-1 w-full max-w-md mx-auto lg:max-w-xl"
                  >
                    <div className="relative group">
                      {/* Glow Effect */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff88]/20 via-[#00ff88]/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black/80 via-black/60 to-black/80 backdrop-blur-xl border border-white/20 shadow-2xl max-h-[550px] md:max-h-[650px] group-hover:border-[#00ff88]/50 transition-all duration-500">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentImageIndex[feature.id] || 0}
                            initial={{ opacity: 0, scale: 0.95, rotateY: isEven ? -10 : 10 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            exit={{ opacity: 0, scale: 0.95, rotateY: isEven ? 10 : -10 }}
                            transition={{ duration: 0.5 }}
                            className="w-full h-full flex items-center justify-center p-4"
                          >
                            <img
                              src={feature.images[currentImageIndex[feature.id] || 0]}
                              alt={`${feature.title} - Ekran Görüntüsü ${(currentImageIndex[feature.id] || 0) + 1}`}
                              className="w-full h-auto max-h-[500px] md:max-h-[600px] object-contain mx-auto rounded-xl shadow-2xl"
                              style={{
                                filter: 'contrast(1.1) brightness(1.05) saturate(1.1)'
                              }}
                            />
                          </motion.div>
                        </AnimatePresence>
                        
                        {/* Navigation Buttons - Enhanced */}
                        {feature.images.length > 1 && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1, x: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => prevImage(feature.id)}
                              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-xl rounded-full flex items-center justify-center text-white border-2 border-white/30 hover:border-[#00ff88] transition-all duration-300 z-10 group/btn shadow-xl hover:shadow-[#00ff88]/30"
                              aria-label="Önceki resim"
                            >
                              <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 group-hover/btn:text-[#00ff88] transition-colors" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1, x: 2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => nextImage(feature.id)}
                              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-xl rounded-full flex items-center justify-center text-white border-2 border-white/30 hover:border-[#00ff88] transition-all duration-300 z-10 group/btn shadow-xl hover:shadow-[#00ff88]/30"
                              aria-label="Sonraki resim"
                            >
                              <ChevronRight className="w-6 h-6 md:w-7 md:h-7 group-hover/btn:text-[#00ff88] transition-colors" />
                            </motion.button>
                          </>
                        )}
                        
                        {/* Image Counter - Enhanced */}
                        {feature.images.length > 1 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-black/90 to-black/70 backdrop-blur-xl px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/30 text-xs md:text-sm text-white/90 font-medium shadow-xl"
                          >
                            {(currentImageIndex[feature.id] || 0) + 1} / {feature.images.length}
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Thumbnail Navigation - Enhanced */}
                      {feature.images.length > 1 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 }}
                          className="flex gap-3 mt-4 md:mt-6 overflow-x-auto pb-2 scrollbar-hide justify-center"
                        >
                          {feature.images.map((img, imgIdx) => (
                            <motion.button
                              key={imgIdx}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentImageIndex(prev => ({ ...prev, [feature.id]: imgIdx }))}
                              className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 shadow-lg ${
                                (currentImageIndex[feature.id] || 0) === imgIdx
                                  ? 'border-[#00ff88] scale-110 shadow-[#00ff88]/50 ring-2 ring-[#00ff88]/30'
                                  : 'border-white/20 hover:border-white/50 hover:shadow-xl'
                              }`}
                            >
                              <img
                                src={img}
                                alt={`Thumbnail ${imgIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Content Section - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex-1"
                  >
                    <div className="space-y-6">
                      {/* Badge and Icon */}
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-4 mb-6"
                      >
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                          className="w-16 h-16 bg-gradient-to-br from-[#00ff88]/30 to-[#00ff88]/10 rounded-2xl flex items-center justify-center border border-[#00ff88]/30 shadow-lg shadow-[#00ff88]/20"
                        >
                          <Icon className="text-[#00ff88]" size={28} />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="text-sm font-bold text-[#00ff88] bg-gradient-to-r from-[#00ff88]/20 to-[#00ff88]/10 backdrop-blur-xl px-5 py-2 rounded-full border border-[#00ff88]/30 shadow-lg"
                        >
                          Özellik {feature.id}
                        </motion.div>
                      </motion.div>
                      
                      {/* Title */}
                      <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight bg-gradient-to-r from-white via-white to-[#00ff88] bg-clip-text text-transparent"
                      >
                        {feature.title}
                      </motion.h2>
                      
                      {/* Description */}
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl text-white/80 font-light leading-relaxed mb-8"
                      >
                        {feature.description}
                      </motion.p>

                      {/* Detailed Description - Enhanced */}
                      {feature.detailedDescription && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 }}
                          className="mb-10 p-8 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl hover:border-[#00ff88]/30 transition-all duration-300"
                        >
                          <p className="text-base md:text-lg text-white/90 font-light leading-relaxed whitespace-pre-line">
                            {feature.detailedDescription}
                          </p>
                        </motion.div>
                      )}

                      {/* Highlights - Enhanced */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                      >
                        {feature.highlights.map((highlight, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 + idx * 0.1, type: "spring" }}
                            whileHover={{ x: 5 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00ff88]/30 transition-all duration-300 group"
                          >
                            <motion.div
                              whileHover={{ rotate: 360, scale: 1.2 }}
                              transition={{ duration: 0.5 }}
                            >
                              <CheckCircle className="text-[#00ff88] flex-shrink-0 mt-1 group-hover:drop-shadow-[0_0_10px_rgba(0,255,136,0.8)] transition-all" size={24} />
                            </motion.div>
                            <span className="text-white/90 font-medium text-base md:text-lg pt-1">{highlight}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/10 via-transparent to-[#00ff88]/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#00ff88]/5 rounded-full blur-3xl animate-pulse" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="inline-block mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[#00ff88]/30 rounded-full blur-2xl animate-pulse" />
                <Zap className="text-[#00ff88] mx-auto relative z-10" size={64} />
              </div>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 bg-gradient-to-r from-white via-white to-[#00ff88] bg-clip-text text-transparent"
            >
              Hemen Başlayın
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-white/70 font-light mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              DietCoop ile danışan yönetiminizi{' '}
              <span className="text-[#00ff88] font-medium">dijitalleştirin</span> ve{' '}
              <span className="text-[#00ff88] font-medium">zaman kazanın</span>. 
              Profesyonel diyetisyenler için tasarlanmış bu platform ile{' '}
              <span className="text-[#00ff88] font-medium">işinizi büyütün</span>.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  to="/login" 
                  className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-[#00ff88]/40 hover:shadow-[#00ff88]/60 transition-all duration-300 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#00ff88] to-[#00ff88] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center gap-2">
                    Giriş Yap
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight size={22} />
                    </motion.div>
                  </span>
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a 
                  href="/#paketlerimiz" 
                  className="group inline-flex items-center gap-3 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:border-[#00ff88]/50 hover:bg-white/15 transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                  Paketleri İncele
                  <Package size={22} className="group-hover:text-[#00ff88] transition-colors" />
                </a>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a 
                  href="/#sss" 
                  className="group inline-flex items-center gap-3 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:border-[#00ff88]/50 hover:bg-white/15 transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                  Sık Sorulan Sorular
                  <HelpCircle size={22} className="group-hover:text-[#00ff88] transition-colors" />
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <img src="/DietCoop Logo.png" alt="DietCoop" className="h-10 mb-6" />
              <p className="text-white/60 font-light text-sm leading-relaxed">
                Diyetisyen ve danışan arasındaki süreci dijitalleştirerek, takip ve yönetimi otomatikleştiriyoruz.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hemen Başla</h4>
              <Link to="/login" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Giriş Yap
              </Link>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Bağlantılar</h4>
              <a href="https://www.diyetdeposu.com" target="_blank" rel="noopener noreferrer" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Tedarikçiler için
              </a>
              <a href="https://www.kampuscoop.com" target="_blank" rel="noopener noreferrer" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Stajyerlerimiz için
              </a>
              <Link to="/hukuki-evraklar" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Yasal Sorumluluk Metinleri
              </Link>
            </div>
            <div>
              <h4 className="font-semibold mb-4">İletişim</h4>
              <div className="space-y-3 text-sm font-light">
                <div>
                  <p className="text-white/50 mb-2 text-xs">Diyetisyen WhatsApp Destek Hattı</p>
                  <a href="https://wa.me/905321005285" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 hover:underline flex items-center gap-2">
                    <span>📱</span> 0532 100 52 85
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-white/40 pt-8 border-t border-white/10 text-sm font-light">
            <p>&copy; 2025 DietCoop. Tüm hakları saklıdır.</p>
            <p className="mt-2">
              DietCoop bir{' '}
              <a 
                href="https://www.bagertek.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/60 hover:text-[#00ff88] transition-colors underline"
              >
                Bağer Teknoloji
              </a>
              {' '}iştirakidir.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

