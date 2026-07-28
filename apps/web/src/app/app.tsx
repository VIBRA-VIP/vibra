import { BrowserRouter } from 'react-router-dom';
import { AuthBootstrap } from './auth-bootstrap';
import { AppProviders } from './providers';
import { AppRoutes } from '@/routes';

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AuthBootstrap>
          <AppRoutes />
        </AuthBootstrap>
      </BrowserRouter>
    </AppProviders>
  );
}
