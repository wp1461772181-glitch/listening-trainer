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
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm animate-fade-in-up">
        <h2 className="mb-2 text-center text-2xl font-bold text-text tracking-tight">
          {isRegister ? 'Create Account' : 'Sign In'}
        </h2>
        <p className="mb-6 text-center text-sm text-text-secondary">
          {isRegister ? 'Start your listening practice journey' : 'Continue your listening practice'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-text-tertiary focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-text-tertiary focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-success/10 border border-success/20 px-4 py-3 text-sm text-success">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => { setIsRegister(!isRegister); setError(''); setMessage(''); }}
          className="mt-5 w-full text-center text-sm text-text-secondary hover:text-primary transition-colors duration-200"
        >
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}
