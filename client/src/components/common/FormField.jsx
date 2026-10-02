import { forwardRef, useState } from 'react';
import { EyeIcon } from './Icons.jsx';

const FormField = forwardRef(function FormField({ label, id, error, hint, as = 'input', type = 'text', className = '', children, ...rest }, ref) {
  const [show, setShow] = useState(false);
  const Tag = as;
  const isPw = type === 'password';
  const cls = `input ${error ? 'input-error' : ''} ${isPw ? 'pr-11' : ''} ${className}`;
  return (
    <div>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <div className="relative">
        <Tag ref={ref} id={id} type={isPw ? (show ? 'text' : 'password') : type} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} className={cls} {...rest}>{children}</Tag>
        {isPw && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-orange">
            <EyeIcon off={show} size={20} />
          </button>
        )}
      </div>
      {hint && !error && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-bold text-red-700">{error}</p>}
    </div>
  );
});
export default FormField;
