# Stratejik Partner Dashboard - Entegrasyon Rehberi

Bu klasör, Stratejik Partner Dashboard sisteminin tüm kodlarını içerir. Başka bir projeye entegre etmek için aşağıdaki adımları izleyin.

## Klasör Yapısı

```
stratejikPartner-export/
├── src/
│   ├── types/
│   │   └── stratejikPartner.ts
│   ├── services/
│   │   └── firebase/
│   │       ├── firebaseConfig.ts      ← db'yi burada yapılandırın
│   │       └── stratejikPartnerService.ts
│   ├── pages/
│   │   └── stratejikPartner/
│   │       ├── StratejikPartnerLogin.tsx
│   │       ├── StratejikPartnerBilgilendirme.tsx
│   │       └── StratejikPartnerDashboard.tsx
│   └── components/
│       └── stratejikPartner/
│           └── StratejikPartnerLayout.tsx
├── public/
│   └── growerdisilogo.svg
├── firestore/
│   ├── rules-eklenecek.txt
│   └── index-eklenecek.json
└── auth/
    └── checkUserRole-eklenecek.txt
```

## Entegrasyon Adımları

### 1. Dosyaları Kopyalayın

`stratejikPartner-export/src/` içeriğini hedef projenizin `src/` klasörüne kopyalayın.

### 2. Firebase Config

`src/services/firebase/firebaseConfig.ts` dosyasında:

```ts
// Kendi Firebase config'inizden db'yi import edin
import { db } from './config';  // veya projenizdeki path
export { db };
```

### 3. Bağımlılıklar

- `src/components/common/AnimatedBackground` - Projenizde yoksa basit bir placeholder oluşturun veya kaldırın.
- `@/context/AuthContext` - Auth context'inizde `useAuth` hook'u `logout`, `signInWithEmail`, `user`, `loading` döndürmeli.
- `@/` path alias - tsconfig/vite config'de `@` -> `src` olmalı.

### 4. Auth Context Güncellemesi

`UserData` tipine `'stratejikPartner'` rolünü ekleyin:

```ts
rol: 'superAdmin' | 'admin' | 'diyetisyen' | 'stratejikPartner';
```

### 5. Auth Service - checkUserRole

`auth/checkUserRole-eklenecek.txt` dosyasındaki kodu `checkUserRole` fonksiyonunun **en başına** ekleyin (admin kontrolünden önce).

### 6. Routing

App.tsx veya router dosyanıza:

```tsx
<Route path="/stratejikpartner" element={<StratejikPartnerLogin />} />
<Route path="/stratejikpartner/bilgilendirme" element={<StratejikPartnerProtectedRoute><StratejikPartnerBilgilendirme /></StratejikPartnerProtectedRoute>} />
<Route path="/stratejikpartner/dashboard" element={<StratejikPartnerProtectedRoute><StratejikPartnerDashboard /></StratejikPartnerProtectedRoute>} />
```

### 7. StratejikPartnerProtectedRoute

```tsx
function StratejikPartnerProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/stratejikpartner" replace />;
  if (user.rol !== 'stratejikPartner') return <Navigate to="/" replace />;
  return (
    <StratejikPartnerLayout>
      {children}
    </StratejikPartnerLayout>
  );
}
```

### 8. AuthContext Redirect

`signInWithEmail`, `signInWithGoogle` ve `onAuthStateChanged` içinde stratejik partner için (admin/diyetisyen bloklarından sonra):

```ts
} else if (userData.rol === 'stratejikPartner') {
  setTimeout(() => {
    window.location.href = '/stratejikpartner/bilgilendirme';
  }, 100);
}
```

`onAuthStateChanged` path kontrolüne ekleyin:
```ts
if (window.location.pathname === '/login' || window.location.pathname === '/admin/login' || window.location.pathname === '/stratejikpartner') {
```

### 9. Firestore

- `firestore/rules-eklenecek.txt` içeriğini firestore.rules dosyanıza ekleyin
- `firestore/index-eklenecek.json` içeriğini firestore.indexes.json dosyanıza ekleyin

### 10. Giriş Bilgileri

- Firebase Console'da kullanıcı: withgrower@bagertek.com / 1123456
- Firestore'da `stratejikPartnerGiris` koleksiyonuna doküman ekleyin (KURULUM.md'ye bakın)

## Logo

`growerdisilogo.svg` dosyasını `public/` klasörüne kopyalayın. Kendi logonuzu `growerdisilogo.png` veya `growerdisilogo.svg` olarak ekleyebilirsiniz.
