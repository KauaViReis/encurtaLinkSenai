import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes';
import './i18n';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen dark flex flex-col">
        <AppRoutes />
        <Toaster 
          theme="dark" 
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1), 0 0 20px rgba(139, 92, 246, 0.2)',
            },
            className: 'rounded-2xl',
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
