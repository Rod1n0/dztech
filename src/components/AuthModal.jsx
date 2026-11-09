import React, { useState } from 'react';
import api from '../services/api';

const AuthModal = ({ onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await api.register({ name, email, password });
        if (res.token) {
          onAuthSuccess({ user: res.user, token: res.token });
        } else {
          // If register doesn't return token directly, log in immediately
          const loginRes = await api.login({ email, password });
          onAuthSuccess({ user: loginRes.user, token: loginRes.token });
        }
      } else {
        const res = await api.login({ email, password });
        onAuthSuccess({ user: res.user, token: res.token });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-category">JWT Authentication</span>
            <h2 className="modal-title">
              {mode === 'login' ? 'Sign In to DzTech' : 'Create an Account'}
            </h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-alert-error">{error}</div>}

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Farouk Boudissa"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          <div className="modal-footer auth-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setError('');
                setMode(mode === 'login' ? 'register' : 'login');
              }}
            >
              {mode === 'login'
                ? 'Need an account? Register'
                : 'Already have an account? Sign In'}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? 'Processing...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
