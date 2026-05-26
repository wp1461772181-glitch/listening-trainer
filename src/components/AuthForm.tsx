import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    const { error: err } = isRegister
      ? await signUp(email, password)
      : await signIn(email, password);

    setSubmitting(false);

    if (err) {
      setError(err.message);
    } else if (isRegister) {
      setMessage('Check your email for the confirmation link.');
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl glass p-8 animate-fade-in-up">
        <h2 className="mb-2 text-center text-2xl font-bold text-white tracking-tight">
          {isRegister ? 'Create Account' : 'Sign In'}
        </h2>
        <p className="mb-6 text-center text-sm text-aurora-muted">
          {isRegister ? 'Start your listening practice journey' : 'Continue your listening practice'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-aurora-text">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-aurora-border bg-aurora-surface/60 px-4 py-3 text-sm text-aurora-text placeholder:text-aurora-muted/50 focus:border-aurora-violet/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/10 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-aurora-text">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full rounded-xl border border-aurora-border bg-aurora-surface/60 px-4 py-3 text-sm text-aurora-text placeholder:text-aurora-muted/50 focus:border-aurora-violet/50 focus:outline-none focus:ring-2 focus:ring-aurora-violet/10 transition-all"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-aurora-emerald/10 border border-aurora-emerald/20 px-4 py-3 text-sm text-aurora-emerald">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-aurora-violet to-violet-600 py-3 text-sm font-semibold text-white transition-all duration-300 hover:glow-violet active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => { setIsRegister(!isRegister); setError(''); setMessage(''); }}
          className="mt-5 w-full text-center text-sm text-aurora-muted hover:text-aurora-violet transition-colors duration-200"
        >
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}
