import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import FormField from '../../components/common/FormField.jsx';
import { LoadingSpinner } from '../../components/common/Feedback.jsx';
import AuthShell from './AuthShell.jsx';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  if (user && !busy) return <Navigate to={from} replace />;
  const set = (k) => (e) => setF({ ...f, [k]: k === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 2) er.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = 'Enter a valid email address';
    if (!/^[6-9]\d{9}$/.test(f.phone)) er.phone = 'Enter a valid 10 digit mobile number';
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) er.password = 'Use at least 8 characters with a letter and a number';
    if (f.confirm !== f.password) er.confirm = 'Passwords do not match';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await register({ name: f.name.trim(), email: f.email.trim(), phone: f.phone, password: f.password });
      toast.success('Account created. Welcome to Omkari Fashions!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.userMessage);
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create Account" subtitle="Join Omkari Fashions for a seamless shopping experience">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField id="name" label="Full name" autoComplete="name" value={f.name} onChange={set('name')} error={errors.name} />
        <FormField id="email" label="Email" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={errors.email} />
        <FormField id="phone" label="Phone" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={f.phone} onChange={set('phone')} error={errors.phone} />
        <FormField id="password" label="Password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} error={errors.password} hint="At least 8 characters, with a letter and a number" />
        <FormField id="confirm" label="Confirm password" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} error={errors.confirm} />
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : 'Register'}</button>
      </form>
      <p className="mt-5 text-center text-sm">Already have an account? <Link to="/login" state={{ from }} className="font-bold text-brand-orange hover:underline">Login</Link></p>
    </AuthShell>
  );
}
