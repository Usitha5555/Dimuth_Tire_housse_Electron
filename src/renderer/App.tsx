import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Setup from './pages/Setup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Billing from './pages/Billing';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Integration from './pages/Integration';

function App() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSetup = async (skipLoading = false) => {
    if (!skipLoading) {
      setIsLoading(true);
    }
    try {
      if (window.electronAPI?.auth) {
        const setupComplete = await window.electronAPI.auth.checkSetup();
        setIsSetupComplete(setupComplete);
      } else {
        setIsSetupComplete(false);
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
      setIsSetupComplete(false);
    } finally {
      if (!skipLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    checkSetup();
  }, []);

  // Listen for setup completion events
  useEffect(() => {
    const handleSetupComplete = () => {
      // Refresh setup status without showing loading spinner
      checkSetup(true);
    };

    window.addEventListener('setup-complete', handleSetupComplete);
    return () => {
      window.removeEventListener('setup-complete', handleSetupComplete);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Setup route */}
          <Route 
            path="/setup" 
            element={isSetupComplete ? <Navigate to="/login" replace /> : <Setup />} 
          />
          
          {/* Login route */}
          <Route 
            path="/login" 
            element={!isSetupComplete ? <Navigate to="/setup" replace /> : <Login />} 
          />
          
          {/* Protected routes */}
          <Route
            path="/*"
            element={
              !isSetupComplete ? (
                <Navigate to="/setup" replace />
              ) : (
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/billing" element={<Billing />} />
                      <Route path="/invoices" element={<Invoices />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/integration" element={<Integration />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              )
            }
          />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;

