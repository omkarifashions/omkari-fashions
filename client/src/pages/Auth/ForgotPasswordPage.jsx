import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/services.js';
import { useToast } from '../../context/ToastContext.jsx';
import FormField from '../../components/common/FormField.jsx';
import { LoadingSpinner } from '../../components/common/Feedback.jsx';
import AuthShell from './AuthShell.jsx';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address');
    setError('');
    setBusy(true);
    try {
      await authApi.forgot({ email: email.trim() });
      setSent(true);
      toast.success('Reset link sent - please check your inbox');
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Forgot Password" subtitle="We will email you a link to reset your password">
      {sent ? (
        <div className="text-center"><p className="text-brand-text">If an account exists for <b>{email}</b>, a password reset link is on its way. It is valid for 30 minutes.</p><Link to="/login" className="btn-primary mt-5">Back to Login</Link></div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : 'Send Reset Link'}</button>
          <p className="text-center text-sm"><Link to="/login" className="font-bold text-brand-orange hover:underline">Back to Login</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
