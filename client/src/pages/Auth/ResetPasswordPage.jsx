import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authApi } from '../../api/services.js';
import { useToast } from '../../context/ToastContext.jsx';
import FormField from '../../components/common/FormField.jsx';
import { LoadingSpinner } from '../../components/common/Feedback.jsx';
import AuthShell from './AuthShell.jsx';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) er.password = 'Use at least 8 characters with a letter and a number';
    if (f.confirm !== f.password) er.confirm = 'Passwords do not match';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await authApi.reset(token, { password: f.password });
      toast.success('Password reset successful. Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      if (err.status === 400) setExpired(true);
      toast.error(err.userMessage);
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset Password" subtitle="Choose a new password for your account">
      {expired ? (
        <div className="text-center"><p className="text-brand-text">This reset link is invalid or has expired.</p><Link to="/forgot-password" className="btn-primary mt-5">Request a new link</Link></div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField id="password" label="New password" type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={errors.password} />
          <FormField id="confirm" label="Confirm password" type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} error={errors.confirm} />
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : 'Reset Password'}</button>
        </form>
      )}
    </AuthShell>
  );
}
