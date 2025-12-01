import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { theme, setUser, logout } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

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
      } else {
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
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
