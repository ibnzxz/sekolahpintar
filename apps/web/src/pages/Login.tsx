import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, AlertTriangle } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<any>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Clear old tokens on mount to prevent stale token issues
  React.useEffect(() => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await onLogin(email, password);
      const role = result.teacher?.role || result.role;
      if (role === 'ADMIN' || role === 'KEPALA_SEKOLAH' || role === 'SUPER_ADMIN') {
        navigate('/dashboard');
      } else {
        setError('Akses ditolak. Halaman ini hanya untuk Administrator atau Kepala Sekolah.');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal, periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '36px', marginBottom: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 24px rgba(0, 210, 196, 0.2)'
          }}>
            <Shield size={32} color="#04060d" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-display)' }}>SekolahPintar</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Dashboard Admin & Tata Usaha</p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            backgroundColor: 'var(--danger-glow)',
            border: '1px solid var(--danger)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            color: '#fca5a5',
            fontSize: '0.8rem',
            marginBottom: '20px'
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="admin@sekolahpintar.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ paddingLeft: '40px' }}
            />
            <Mail size={16} style={{ position: 'absolute', left: '14px', bottom: '13px', color: 'var(--text-secondary)' }} />
          </div>

          <div className="form-group" style={{ position: 'relative', marginBottom: '28px' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingLeft: '40px' }}
            />
            <Key size={16} style={{ position: 'absolute', left: '14px', bottom: '13px', color: 'var(--text-secondary)' }} />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px' }}
          >
            {loading ? 'Masuk...' : 'Masuk ke Dashboard'}
          </button>
        </form>

        <div style={{
          marginTop: '28px',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px dashed var(--glass-border)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          <strong>Demo Credential:</strong><br />
          Email: admin@sekolahpintar.id<br />
          Password: admin123
        </div>
      </div>
    </div>
  );
};
