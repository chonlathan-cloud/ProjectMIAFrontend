import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
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
import { useStore } from '@/store/useStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Inbox from "./pages/Inbox";
import KnowledgeView from '@/pages/KnowledgeView';
import KnowledgeEditor from '@/pages/KnowledgeEditor';
import Website from "@/pages/Website";


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

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

function App() {
  const { setUser, logout } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
  }, []);

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
        logout();
      }
    });
    return () => unsub();
  }, [setUser, logout]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
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
          <Route path="line-setup" element={<LineSetup />} />
          <Route path="line-callback" element={<LineCallback />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="customers" element={<Customers />} />
          <Route path="settings" element={<Settings />} />
          <Route path="ab-test" element={<ABTest />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="store/:storeId/knowledge" element={<KnowledgeRoute />} />
          <Route path="stores/:storeId/knowledge-editor" element={<KnowledgeEditorRoute />} />
          <Route path="website" element={<Website />} />

          
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
