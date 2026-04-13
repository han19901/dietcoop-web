import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import AnimatedBackground from './components/common/AnimatedBackground';
import PageLoader from './components/common/PageLoader';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import DiyetisyenSidebar from './components/common/DiyetisyenSidebar';
import './styles/globals.css';

// Public pages - eager load (hızlı erişim için)
import Home from './pages/Home';
import Login from './pages/Login';
import AplikasyonOzellikleri from './pages/AplikasyonOzellikleri';
import HesapSilme from './pages/HesapSilme';
import HukukiEvraklar from './pages/HukukiEvraklar';
import HukukiEvrakDetay from './pages/HukukiEvrakDetay';
import KartvizitGoruntule from './pages/KartvizitGoruntule';
import TesekkurKartiGoruntule from './pages/TesekkurKartiGoruntule';
import Kariyer from './pages/Kariyer';

// Admin pages - lazy load (performans için)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Diyetisyenler = lazy(() => import('./pages/Diyetisyenler'));
const DiyetisyenDetail = lazy(() => import('./pages/DiyetisyenDetail'));
const Faturalar = lazy(() => import('./pages/Faturalar'));
const EvrakOnay = lazy(() => import('./pages/EvrakOnay'));
const BildirimGonder = lazy(() => import('./pages/BildirimGonder'));
const Ayarlar = lazy(() => import('./pages/Ayarlar'));
const DenemeSuresi = lazy(() => import('./pages/DenemeSuresi'));
const Finans = lazy(() => import('./pages/Finans'));
const Giderler = lazy(() => import('./pages/Giderler'));
const FaturaTakip = lazy(() => import('./pages/FaturaTakip'));
const FaturaMerkezi = lazy(() => import('./pages/FaturaMerkezi'));
const YasalOnayLoglari = lazy(() => import('./pages/YasalOnayLoglari'));
const Kartvizitler = lazy(() => import('./pages/Kartvizitler'));
const TesekkurKartlari = lazy(() => import('./pages/TesekkurKartlari'));
const Ilanlar = lazy(() => import('./pages/Ilanlar'));
const Basvurular = lazy(() => import('./pages/Basvurular'));

// Diyetisyen pages - lazy load
const DiyetisyenDashboard = lazy(() => import('./pages/diyetisyen/DiyetisyenDashboard'));
const DiyetisyenProfil = lazy(() => import('./pages/diyetisyen/DiyetisyenProfil'));
const DiyetisyenOdeme = lazy(() => import('./pages/diyetisyen/DiyetisyenOdeme'));
const DiyetisyenFaturalar = lazy(() => import('./pages/diyetisyen/DiyetisyenFaturalar'));
const DiyetisyenEvraklar = lazy(() => import('./pages/diyetisyen/DiyetisyenEvraklar'));
const DiyetisyenMesajlar = lazy(() => import('./pages/diyetisyen/DiyetisyenMesajlar'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin kontrolü
  if (user.rol !== 'superAdmin' && user.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      <div className="flex flex-1 pt-16 lg:pt-0">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6">
          <div className="w-full max-w-full">
            <Suspense fallback={<LoadingSpinner />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

function DiyetisyenProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Diyetisyen kontrolü
  if (user.rol !== 'diyetisyen') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      <div className="flex flex-1 pt-16 lg:pt-0">
        <DiyetisyenSidebar />
        <main className="flex-1 p-4 lg:p-6">
          <div className="w-full max-w-full">
            <Suspense fallback={<LoadingSpinner />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/aplikasyon-ozellikleri" element={<AplikasyonOzellikleri />} />
      <Route path="/hesap-silme" element={<HesapSilme />} />
      <Route path="/hukuki-evraklar" element={<HukukiEvraklar />} />
      <Route path="/hukuki-evraklar/:id" element={<HukukiEvrakDetay />} />
      <Route path="/kartvizit/:id" element={<KartvizitGoruntule />} />
      <Route path="/tesekkur-karti/:id" element={<TesekkurKartiGoruntule />} />
      <Route path="/kariyer" element={<Kariyer />} />
      {/* Hukuki Evrak Sayfaları - iOS ve Android için direkt HTML sayfaları */}
      <Route path="/PrivacyPolicy_Client_EN.html" element={<HukukiEvrakDetay evrakId="privacy-policy-client-en" />} />
      <Route path="/PrivacyPolicy_Client_TR.html" element={<HukukiEvrakDetay evrakId="privacy-policy-client-tr" />} />
      <Route path="/PrivacyPolicy_Dietitian_EN.html" element={<HukukiEvrakDetay evrakId="privacy-policy-dietitian-en" />} />
      <Route path="/PrivacyPolicy_Dietitian_TR.html" element={<HukukiEvrakDetay evrakId="privacy-policy-dietitian-tr" />} />
      <Route path="/DiyetisyenUyelikSozlesmesi.html" element={<HukukiEvrakDetay evrakId="diyetisyen-uyelik-sozlesmesi" />} />
      <Route path="/KVKKAydinlatmaDiyetisyen.html" element={<HukukiEvrakDetay evrakId="kvkk-aydinlatma-diyetisyen" />} />
      <Route path="/AcikRizaDiyetisyen.html" element={<HukukiEvrakDetay evrakId="acik-riza-diyetisyen" />} />
      <Route path="/KVKKAydinlatmaDanisan.html" element={<HukukiEvrakDetay evrakId="kvkk-aydinlatma-danisan" />} />
      <Route path="/AcikRizaDanisan.html" element={<HukukiEvrakDetay evrakId="acik-riza-danisan" />} />
      <Route path="/MesafeliSatisSozlesmesi.html" element={<HukukiEvrakDetay evrakId="mesafeli-satis-sozlesmesi" />} />
      <Route path="/ElektronikTicaretBilgilendirme.html" element={<HukukiEvrakDetay evrakId="elektronik-ticaret-bilgilendirme" />} />
      <Route path="/OnBilgilendirmeFormu.html" element={<HukukiEvrakDetay evrakId="on-bilgilendirme-formu" />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/diyetisyenler"
        element={
          <ProtectedRoute>
            <Diyetisyenler />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/diyetisyenler/:id"
        element={
          <ProtectedRoute>
            <DiyetisyenDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/faturalar"
        element={
          <ProtectedRoute>
            <Faturalar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/evrak-onay"
        element={
          <ProtectedRoute>
            <EvrakOnay />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bildirim-gonder"
        element={
          <ProtectedRoute>
            <BildirimGonder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ayarlar"
        element={
          <ProtectedRoute>
            <Ayarlar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/deneme-suresi"
        element={
          <ProtectedRoute>
            <DenemeSuresi />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/finans"
        element={
          <ProtectedRoute>
            <Finans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/giderler"
        element={
          <ProtectedRoute>
            <Giderler />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fatura-takip"
        element={
          <ProtectedRoute>
            <FaturaTakip />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fatura-merkezi"
        element={
          <ProtectedRoute>
            <FaturaMerkezi />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/yasal-onay-loglari"
        element={
          <ProtectedRoute>
            <YasalOnayLoglari />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/kartvizitler"
        element={
          <ProtectedRoute>
            <Kartvizitler />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tesekkur-kartlari"
        element={
          <ProtectedRoute>
            <TesekkurKartlari />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ilanlar"
        element={
          <ProtectedRoute>
            <Ilanlar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/basvurular"
        element={
          <ProtectedRoute>
            <Basvurular />
          </ProtectedRoute>
        }
      />
      {/* Diyetisyen Routes */}
      <Route
        path="/diyetisyen/dashboard"
        element={
          <DiyetisyenProtectedRoute>
            <DiyetisyenDashboard />
          </DiyetisyenProtectedRoute>
        }
      />
      <Route
        path="/diyetisyen/profil"
        element={
          <DiyetisyenProtectedRoute>
            <DiyetisyenProfil />
          </DiyetisyenProtectedRoute>
        }
      />
      <Route
        path="/diyetisyen/odeme"
        element={
          <DiyetisyenProtectedRoute>
            <DiyetisyenOdeme />
          </DiyetisyenProtectedRoute>
        }
      />
      <Route
        path="/diyetisyen/faturalar"
        element={
          <DiyetisyenProtectedRoute>
            <DiyetisyenFaturalar />
          </DiyetisyenProtectedRoute>
        }
      />
      <Route
        path="/diyetisyen/evraklar"
        element={
          <DiyetisyenProtectedRoute>
            <DiyetisyenEvraklar />
          </DiyetisyenProtectedRoute>
        }
      />
      <Route
        path="/diyetisyen/mesajlar"
        element={
          <DiyetisyenProtectedRoute>
            <DiyetisyenMesajlar />
          </DiyetisyenProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <PageLoader />}
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </>
  );
}

export default App;
