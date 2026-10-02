import { useEffect, useMemo, useRef, useState } from 'react';
import { returnApi } from '../../api/services.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../common/Modal.jsx';
import FormField from '../common/FormField.jsx';
import { LoadingSpinner } from '../common/Feedback.jsx';
import { UploadIcon } from '../common/Icons.jsx';
import { rupee } from '../../utils/format.js';

const REASONS = ['Damaged Product', 'Wrong Product', 'Product Not as Expected', 'Quality Issue', 'Other'];
const PROOF_REQUIRED = ['Damaged Product', 'Wrong Product'];
const MAX_FILES = 5;
const MAX_MB = 5;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ReturnModal({ open, onClose, order, item, onDone }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');
  const [upi, setUpi] = useState('');
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const isCod = order?.paymentMethod === 'cod';
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
  useEffect(() => { if (open) { setReason(''); setDesc(''); setUpi(''); setFiles([]); setErrors({}); } }, [open]);

  const pick = (e) => {
    const list = Array.from(e.target.files || []);
    e.target.value = '';
    const bad = list.filter((f) => !OK_TYPES.includes(f.type));
    const big = list.filter((f) => OK_TYPES.includes(f.type) && f.size > MAX_MB * 1024 * 1024);
    if (bad.length) toast.error('Only JPG, PNG or WEBP images are allowed');
    if (big.length) toast.error(`Each image must be smaller than ${MAX_MB} MB`);
    const good = list.filter((f) => OK_TYPES.includes(f.type) && f.size <= MAX_MB * 1024 * 1024);
    if (files.length + good.length > MAX_FILES) toast.warning(`You can upload up to ${MAX_FILES} photos`);
    setFiles((c) => [...c, ...good].slice(0, MAX_FILES));
    setErrors((x) => ({ ...x, files: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!reason) er.reason = 'Please select a reason';
    if (PROOF_REQUIRED.includes(reason) && files.length === 0) er.files = 'Photo proof is required for this reason';
    if (reason === 'Other' && desc.trim().length < 5) er.desc = 'Please describe the issue';
    if (isCod && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi.trim())) er.upi = 'Enter a valid UPI ID, e.g. name@bank';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('orderId', order._id);
      fd.append('productId', item.product);
      fd.append('reason', reason);
      fd.append('description', desc.trim());
      if (isCod) fd.append('upiId', upi.trim());
      files.forEach((f) => fd.append('images', f));
      await returnApi.create(fd);
      toast.success('Return request submitted successfully');
      onDone();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  if (!item) return null;
  return (
    <Modal open={open} onClose={onClose} title="Return Product" locked={busy}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="flex items-center gap-3 rounded bg-white p-3">
          {item.image && <img src={item.image.startsWith('/uploads') ? item.image : item.image} alt="" className="h-14 w-14 rounded object-cover" />}
          <div className="min-w-0 text-sm"><p className="truncate font-bold">{item.name}</p><p className="text-brand-muted">Qty {item.quantity} · Refund {rupee(item.price * item.quantity)}</p></div>
        </div>
        <FormField as="select" id="ret-reason" label="Reason for return" value={reason} onChange={(e) => { setReason(e.target.value); setErrors((x) => ({ ...x, reason: undefined })); }} error={errors.reason}>
          <option value="">Select a reason</option>
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </FormField>
        <FormField as="textarea" id="ret-desc" rows={3} label={reason === 'Other' ? 'Describe the issue' : 'Additional details (optional)'} maxLength={1000} value={desc} onChange={(e) => setDesc(e.target.value)} error={errors.desc} />

        <div>
          <p className="label">Photos {PROOF_REQUIRED.includes(reason) ? <span className="text-red-700">(required)</span> : '(optional)'}</p>
          <div className="flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <span key={src} className="relative"><img src={src} alt={`Proof ${i + 1}`} className="h-16 w-16 rounded object-cover" /><button type="button" aria-label="Remove photo" onClick={() => setFiles((c) => c.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-red-600 text-xs text-white">×</button></span>
            ))}
            {files.length < MAX_FILES && (
              <button type="button" onClick={() => input.current?.click()} className="flex h-16 w-16 flex-col items-center justify-center rounded border-2 border-dashed border-brand-orange/60 text-[10px] text-brand-orange hover:bg-white"><UploadIcon size={20} />Add</button>
            )}
          </div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={pick} />
          <p className="mt-1 text-xs text-brand-muted">JPG, PNG or WEBP · up to {MAX_FILES} photos · {MAX_MB} MB each</p>
          {errors.files && <p role="alert" className="mt-1 text-xs font-bold text-red-700">{errors.files}</p>}
        </div>

        {isCod ? (
          <div className="rounded bg-white p-3">
            <p className="mb-2 text-sm text-brand-text">This was a Cash on Delivery order. Enter the UPI ID where you would like to receive your refund.</p>
            <FormField id="ret-upi" label="UPI ID" placeholder="yourname@bank" autoComplete="off" value={upi} onChange={(e) => setUpi(e.target.value)} error={errors.upi} />
          </div>
        ) : (
          <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-900">Refund will be processed to the original payment account.</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-[4px] border border-brand-muted/50 px-5 py-2.5 font-bold text-brand-text hover:bg-beige">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? <><LoadingSpinner size="sm" className="border-white border-t-transparent" /> Submitting…</> : 'Submit Return Request'}</button>
        </div>
      </form>
    </Modal>
  );
}
