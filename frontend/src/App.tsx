import { useTranslation } from 'react-i18next';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import { StatusMessage } from './components/common/StatusMessage';
import { CatalogPage } from './pages/CatalogPage';
import { LoginPage } from './pages/LoginPage';

function AuthGate() {
  const { t } = useTranslation();
  const { status } = useAuth();

  if (status === 'checking') {
    return (
      <main className="shell">
        <StatusMessage message={t('auth.checking')} />
      </main>
    );
  }
  return status === 'authenticated' ? <CatalogPage /> : <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
