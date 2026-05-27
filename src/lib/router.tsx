import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RootLayout from '../routes/RootLayout';
import AuthPage from '../routes/AuthPage';
import HomePage from '../routes/HomePage';
import LessonsPage from '../routes/LessonsPage';
import PlayerPage from '../routes/PlayerPage';
import CustomLessonPage from '../routes/CustomLessonPage';
import HistoryPage from '../routes/HistoryPage';
import LessonHistoryPage from '../routes/LessonHistoryPage';
import HistoryDetailPage from '../routes/HistoryDetailPage';
import SettingsPage from '../routes/SettingsPage';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
          <div className="text-sm text-text-secondary">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <HomePage /> },
        {
          path: 'lessons/:difficulty',
          element: (
            <AuthGuard>
              <LessonsPage />
            </AuthGuard>
          ),
        },
        {
          path: 'player/:lessonId',
          element: (
            <AuthGuard>
              <PlayerPage />
            </AuthGuard>
          ),
        },
        {
          path: 'custom',
          element: (
            <AuthGuard>
              <CustomLessonPage />
            </AuthGuard>
          ),
        },
        {
          path: 'history',
          element: (
            <AuthGuard>
              <HistoryPage />
            </AuthGuard>
          ),
        },
        {
          path: 'history/:lessonId',
          element: (
            <AuthGuard>
              <LessonHistoryPage />
            </AuthGuard>
          ),
        },
        {
          path: 'history/detail/:id',
          element: (
            <AuthGuard>
              <HistoryDetailPage />
            </AuthGuard>
          ),
        },
        {
          path: 'settings',
          element: (
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          ),
        },
      ],
    },
    {
      path: '/auth',
      element: <AuthPage />,
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ]);
}
