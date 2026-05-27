import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [defaultSpeed, setDefaultSpeed] = useState('1');
  const [voice, setVoice] = useState<'male' | 'female'>('female');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('settings-speed', defaultSpeed);
    localStorage.setItem('settings-voice', voice);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
