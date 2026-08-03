import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, MarketingLayout } from '@/layouts';
import {
  AdminPage,
  ChatsPage,
  DiscoverPage,
  ExplorePage,
  LandingPage,
  LoginPage,
  OnboardingPage,
  PendingVerificationPage,
  MyProfilePage,
  ProfilePage,
  PublishPage,
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
      <Route path="/admin" element={<AdminPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/pending-verification" element={<PendingVerificationPage />} />
        <Route element={<AppShell />}>
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/conocer" element={<DiscoverPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/publish" element={<PublishPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/me" element={<MyProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
