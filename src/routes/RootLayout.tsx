import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import MobileNav from '../components/MobileNav';

export default function RootLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => navigate('/')}
            className="text-lg font-bold text-text hover:text-primary transition-colors"
          >
            Listening Trainer
          </button>

          {user && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/history')}
                className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
              >
                History
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
              >
                Settings
              </button>
              <span className="hidden text-sm text-text-secondary sm:inline">{user.email}</span>
              <button
                onClick={signOut}
                className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="relative mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <MobileNav />
    </div>
  );
}
