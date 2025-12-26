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

import { useStore } from '@/store/useStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/* -----------------------------
   Guards
----------------------------- */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/* -----------------------------
   Knowledge Routes
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
  const { setUser, logout } = useStore();

  /* force light theme */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  /* Firebase Auth listener */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email || 'LineBoost User',
          email: fbUser.email || '',
          tier: 'growth',
          avatar: fbUser.photoURL || undefined,
        });

        const token = await fbUser.getIdToken();
        localStorage.setItem('firebase_token', token);
      } else {
        localStorage.removeItem('firebase_token');
        logout();
      }
    });

    return () => unsub();
  }, [setUser, logout]);

  return (
    <Router>
      <Routes>
        {/* ---------- Public ---------- */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ---------- Protected ---------- */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="line-callback" element={<LineCallback />} />

          <Route path="broadcast" element={<Broadcast />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="customers" element={<Customers />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="ab-test" element={<ABTest />} />
          <Route path="website" element={<Website />} />

          <Route path="settings" element={<Settings />} />
          <Route path="settings/store" element={<StoreIntegration />} />

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
