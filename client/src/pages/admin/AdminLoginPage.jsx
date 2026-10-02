import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import FormField from '../../components/common/FormField.jsx';
import { LoadingSpinner } from '../../components/common/Feedback.jsx';
import Seo from '../../components/common/Seo.jsx';

export default function AdminLoginPage() {
  const { admin, adminLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';
  const [f, setF] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  if (admin && !busy) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = 'Enter a valid email';
    if (!f.password) er.password = 'Enter your password';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await adminLogin({ email: f.email.trim(), password: f.password }); toast.success('Welcome back'); navigate(from, { replace: true }); } catch (err) { toast.error(err.userMessage); setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-header p-4">
      <Seo title="Admin Login" noindex />
      <div className="w-full max-w-sm rounded-lg bg-cream p-7 shadow-2xl">
        <img src="/images/logo.png" alt="" className="mx-auto h-16 w-16" />
        <h1 className="mt-2 text-center font-display text-2xl font-bold text-brand-heading">Admin Login</h1>
        <p className="text-center text-sm text-brand-muted">Omkari Fashions control panel</p>
        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          <FormField id="a-email" label="Email" type="email" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} />
          <FormField id="a-pass" label="Password" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} error={errors.password} />
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}
