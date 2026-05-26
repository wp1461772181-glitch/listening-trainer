import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
  onHome: () => void;
  showBack: boolean;
  onBack?: () => void;
}

export default function Layout({ children, onHome, showBack, onBack }: LayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-aurora grain-overlay">
      <header className="sticky top-0 z-20 glass-strong border-b border-aurora-border/40">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onHome}
              className="flex items-center gap-2 text-lg font-semibold text-white hover:text-aurora-violet transition-colors duration-200 group"
            >
              <svg className="h-6 w-6 text-aurora-violet/70 group-hover:text-aurora-violet transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.674M12 3v1m0 16v1m-7.071-2.929l.707.707M17.657 5.636l.707-.707M4.929 12H3m18 0h-2m-1.071 5.657l-.707-.707M5.636 17.657l-.707.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline text-gradient-brand">Academic Listening</span>
              <span className="sm:hidden text-white">AL</span>
            </button>
            {showBack && onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-aurora-muted hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-aurora-muted hidden sm:inline">{user.email}</span>
              <button
                onClick={signOut}
                className="rounded-lg px-3 py-1.5 text-sm text-aurora-muted hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
