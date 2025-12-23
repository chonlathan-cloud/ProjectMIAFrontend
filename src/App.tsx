import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { MainLayout } from '@/components/layout/MainLayout';

import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { LineSetup } from '@/pages/LineSetup';
import { LineCallback } from '@/pages/LineCallback';
import { Broadcast } from '@/pages/Broadcast';
import { Analytics } from '@/pages/Analytics';
import { Customers } from '@/pages/Customers';
import { Settings } from '@/pages/Settings';
import { ABTest } from '@/pages/ABTest';
import Inbox from '@/pages/Inbox';
import KnowledgeView from '@/pages/KnowledgeView';
import KnowledgeEditor from '@/pages/KnowledgeEditor';
import Website from '@/pages/Website';
import StoreIntegration from '@/pages/settings/StoreIntegration';

import { SignUp } from '@/pages/SignUp';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';

import TenantBootstrap from '@/components/TenantBootstrap';

import { useStore } from '@/store/useStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/* -----------------------------
   Guards
----------------------------- */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/* -----------------------------
   Knowledge Routes (ยังใช้ storeId จาก URL ได้)
----------------------------- */

function KnowledgeRoute() {
  const { storeId } = useParams();
  if (!storeId) return <Navigate to="/dashboard" replace />;
  return <KnowledgeView storeId={storeId} />;
}

function KnowledgeEditorRoute() {
  const { storeId } = useParams();
  if (!storeId) return <Navigate to="/dashboard" replace />;
  return <KnowledgeEditor storeId={storeId} />;
}

/* -----------------------------
   App
----------------------------- */

function App() {
  // ✅ เพิ่ม setAuthReady เพื่อแก้ race condition ระหว่าง TenantBootstrap กับ Firebase auth
  const { setUser, logout, setAuthReady } = useStore();

  /* force light theme (ตามของเดิม) */
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
  }, []);

  /* Firebase Auth listener */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email || 'LineBoost User',
          email: fbUser.email || '',
          tier: 'growth',
          avatar: fbUser.photoURL || undefined,
        });

        // ✅ สำคัญ: บอกระบบว่า auth พร้อมแล้ว (ให้ TenantBootstrap เริ่มยิง /stores ได้)
        setAuthReady(true);

        fbUser
          .getIdToken()
          .then((token) => {
            if (token && typeof window !== 'undefined') {
              localStorage.setItem('firebase_token', token);
            }
          })
          .catch((err) => {
            console.error('Failed to refresh Firebase token', err);
          });
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('firebase_token');
        }

        // ✅ สำคัญ: logout แล้ว auth ต้องกลับไปไม่พร้อม
        setAuthReady(false);
        logout();
      }
    });

    return () => unsub();
  }, [setUser, logout, setAuthReady]);

  return (
    <Router>
      <Routes>
        {/* ---------- Public ---------- */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ---------- Protected App ---------- */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TenantBootstrap>
                <MainLayout />
              </TenantBootstrap>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* core dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* LINE OA */}
          <Route path="line-setup" element={<LineSetup />} />
          <Route path="line-callback" element={<LineCallback />} />

          {/* features */}
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="customers" element={<Customers />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="ab-test" element={<ABTest />} />
          <Route path="website" element={<Website />} />

          {/* settings */}
          <Route path="settings" element={<Settings />} />
          <Route path="settings/store" element={<StoreIntegration />} />

          {/* knowledge (ยังรองรับหลายร้านผ่าน URL) */}
          <Route path="store/:storeId/knowledge" element={<KnowledgeRoute />} />
          <Route
            path="stores/:storeId/knowledge-editor"
            element={<KnowledgeEditorRoute />}
          />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster />
    </Router>
  );
}

export default App;
