import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiChangePassword } from '../lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [defaultSpeed, setDefaultSpeed] = useState(localStorage.getItem('settings-speed') || '1');
  const [voice, setVoice] = useState<'male' | 'female'>((localStorage.getItem('settings-voice') as 'male' | 'female') || 'female');
  const [saved, setSaved] = useState(false);

  // Change password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const handleSave = () => {
    localStorage.setItem('settings-speed', defaultSpeed);
    localStorage.setItem('settings-voice', voice);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPwSubmitting(true);
    try {
      await apiChangePassword(currentPw, newPw);
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (e: any) {
      setPwMsg({ type: 'error', text: e.message || 'Failed to change password.' });
    }
    setPwSubmitting(false);
  };

  const handleExport = () => {
    const data = localStorage.getItem('listeningTrainer-progress');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'listening-trainer-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <h1 className="text-2xl font-bold text-text">Settings</h1>

      {/* Profile */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-surface text-lg font-bold text-primary">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div className="font-medium text-text">{user?.email?.split('@')[0] ?? 'User'}</div>
            <div className="text-sm text-text-secondary">{user?.email}</div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <button
          onClick={() => setPwOpen(!pwOpen)}
          className="flex w-full items-center justify-between"
        >
          <h2 className="text-lg font-semibold text-text">Change Password</h2>
          <svg className={`h-5 w-5 text-text-secondary transition-transform ${pwOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {pwOpen && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text">Current Password</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text">New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                minLength={6}
                className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text">Confirm New Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                minLength={6}
                className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            {pwMsg && (
              <div className={`rounded-lg px-4 py-3 text-sm ${pwMsg.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                {pwMsg.text}
              </div>
            )}
            <Button onClick={handleChangePassword} disabled={pwSubmitting} variant="primary">
              {pwSubmitting ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        )}
      </Card>

      {/* Preferences */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">Default TTS Speed</label>
            <div className="flex gap-2">
              {['0.75', '1', '1.25', '1.5'].map((s) => (
                <button
                  key={s}
                  onClick={() => setDefaultSpeed(s)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    defaultSpeed === s
                      ? 'bg-primary text-white'
                      : 'bg-bg-alt text-text-secondary hover:bg-border'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">TTS Voice</label>
            <div className="flex gap-2">
              {(['female', 'male'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                    voice === v
                      ? 'bg-primary text-white'
                      : 'bg-bg-alt text-text-secondary hover:bg-border'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} variant="primary">
            {saved ? 'Saved!' : 'Save Preferences'}
          </Button>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Data</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleExport} variant="secondary">
            Export Data (JSON)
          </Button>
          <Button onClick={() => { signOut(); navigate('/auth'); }} variant="danger">
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
