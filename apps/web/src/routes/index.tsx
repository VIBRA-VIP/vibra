import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, MarketingLayout } from '@/layouts';
import {
  AdminPage,
  ChatsPage,
  ExplorePage,
  LandingPage,
  LoginPage,
  OnboardingPage,
  ProfilePage,
  RegisterPage,
  RequestsPage,
  SettingsPage,
} from '@/pages';
import { ProtectedRoute } from './protected-route';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppShell />}>
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
