import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import FormField from "../../components/common/FormField.jsx";
import { LoadingSpinner } from "../../components/common/Feedback.jsx";
import AuthShell from "./AuthShell.jsx";

export default function LoginPage() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      er.email = "Enter a valid email address";
    if (!form.password) er.password = "Enter your password";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const u = await login({
        email: form.email.trim(),
        password: form.password,
      });

      toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);

      if (u.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.userMessage);
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Login" subtitle="Welcome back to Omkari Fashions">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
        />
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-bold text-brand-orange hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? (
            <LoadingSpinner
              size="sm"
              className="border-white border-t-transparent"
            />
          ) : (
            "Login"
          )}
        </button>
      </form>
      <p className="mt-5 text-center text-sm">
        New to Omkari Fashions?{" "}
        <Link
          to="/register"
          state={{ from }}
          className="font-bold text-brand-orange hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
