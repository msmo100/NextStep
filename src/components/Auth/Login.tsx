import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';
import './Login.css';

type Mode = 'signin' | 'signup';

export function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase är inte konfigurerat. Se README för uppsättning.');
      return;
    }
    setError(null);
    setInfo(null);
    setSubmitting(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) {
        setError(error);
        return;
      }
      navigate('/');
    } else {
      const { error } = await signUp(email, password, name);
      setSubmitting(false);
      if (error) {
        setError(error);
        return;
      }
      // With email confirmation enabled there is no session yet.
      setInfo('Konto skapat! Kontrollera din e-post för att bekräfta kontot, logga sedan in.');
      setMode('signin');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="auth-brand">
          <h1>NextStep</h1>
          <span>by Max Moro</span>
        </Link>

        <div className="auth-card">
          <h2>{mode === 'signin' ? 'Logga in' : 'Skapa konto'}</h2>
          <p className="auth-subtitle">
            {mode === 'signin'
              ? 'Välkommen tillbaka.'
              : 'Börja planera ditt jobbsök.'}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="auth-field">
                <label htmlFor="name">Namn</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">E-post</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Lösenord</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={mode === 'signup' ? 8 : undefined}
                required
              />
            </div>

            {mode === 'signin' && (
              <a href="#" className="auth-forgot" onClick={(e) => e.preventDefault()}>
                Glömt lösenord?
              </a>
            )}

            {error && <p className="auth-error">{error}</p>}
            {info && <p className="auth-info">{info}</p>}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting
                ? 'Ett ögonblick…'
                : mode === 'signin'
                  ? 'Logga in'
                  : 'Skapa konto'}
            </button>
          </form>

          <p className="auth-toggle">
            {mode === 'signin' ? (
              <>
                Saknar du konto?{' '}
                <button
                  type="button"
                  className="auth-toggle-btn"
                  onClick={() => switchMode('signup')}
                >
                  Skapa ett
                </button>
              </>
            ) : (
              <>
                Har du redan ett konto?{' '}
                <button
                  type="button"
                  className="auth-toggle-btn"
                  onClick={() => switchMode('signin')}
                >
                  Logga in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
