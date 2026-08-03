import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

/** Redirect models (and any user with username) to their public profile URL. */
export function MyProfilePage() {
  const username = useAuthStore((s) => s.user?.profile?.username);
  if (!username) {
    return <Navigate to="/settings" replace />;
  }
  return <Navigate to={`/profile/${username}`} replace />;
}
