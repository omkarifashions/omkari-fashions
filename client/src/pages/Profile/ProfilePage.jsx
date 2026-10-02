import { useState } from 'react';
import { authApi } from '../../api/services.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import FormField from '../../components/common/FormField.jsx';
import AddressForm, { EMPTY_ADDRESS, validateAddress } from '../../components/checkout/AddressForm.jsx';
import { LoadingSpinner } from '../../components/common/Feedback.jsx';
import Modal from '../../components/common/Modal.jsx';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [p, setP] = useState({ name: user.name, phone: user.phone || '' });
  const [pe, setPe] = useState({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwe, setPwe] = useState({});
  const [pwBusy, setPwBusy] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const [addr, setAddr] = useState(EMPTY_ADDRESS);
  const [ae, setAe] = useState({});
  const [addrBusy, setAddrBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    const er = {};
    if (p.name.trim().length < 2) er.name = 'Enter your name';
    if (!/^[6-9]\d{9}$/.test(p.phone)) er.phone = 'Enter a valid 10 digit mobile number';
    setPe(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const r = await authApi.updateProfile({ name: p.name.trim(), phone: p.phone });
      setUser(r.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.userMessage); } finally { setSaving(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    const er = {};
    if (!pw.currentPassword) er.currentPassword = 'Enter your current password';
    if (pw.newPassword.length < 8 || !/[A-Za-z]/.test(pw.newPassword) || !/\d/.test(pw.newPassword)) er.newPassword = 'Use at least 8 characters with a letter and a number';
    if (pw.confirm !== pw.newPassword) er.confirm = 'Passwords do not match';
    setPwe(er);
    if (Object.keys(er).length) return;
    setPwBusy(true);
    try {
      await authApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password updated');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.userMessage); } finally { setPwBusy(false); }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    const er = validateAddress(addr);
    setAe(er);
    if (Object.keys(er).length) return;
    setAddrBusy(true);
    try {
      const r = await authApi.addAddress(addr);
      setUser(r.user);
      setAddrOpen(false);
      setAddr(EMPTY_ADDRESS);
      toast.success('Address saved');
    } catch (err) { toast.error(err.userMessage); } finally { setAddrBusy(false); }
  };

  const delAddress = async (a) => {
    if (!(await confirm({ title: 'Delete this address?', message: `${a.address}, ${a.city}`, confirmText: 'Delete', tone: 'danger' }))) return;
    try { const r = await authApi.deleteAddress(a._id); setUser(r.user); toast.success('Address deleted'); } catch (err) { toast.error(err.userMessage); }
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-4 font-display text-xl font-bold text-brand-heading">Personal Details</h2>
        <form onSubmit={saveProfile} noValidate className="grid gap-4 sm:grid-cols-2">
          <FormField id="pn" label="Full name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} error={pe.name} />
          <FormField id="pp" label="Phone" inputMode="numeric" maxLength={10} value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value.replace(/\D/g, '') })} error={pe.phone} />
          <FormField id="pe" label="Email" value={user.email} disabled readOnly hint="Email cannot be changed" />
          <div className="flex items-end"><button type="submit" disabled={saving} className="btn-primary">{saving ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : 'Save Changes'}</button></div>
        </form>
      </section>

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold text-brand-heading">Saved Addresses</h2><button type="button" onClick={() => setAddrOpen(true)} className="btn-outline !py-1.5 text-sm">+ Add address</button></div>
        {user.addresses?.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {user.addresses.map((a) => (
              <li key={a._id} className="rounded border border-beige-dark p-3 text-[14px]">
                <b>{a.name}</b>{a.isDefault && <span className="badge ml-2 bg-brand-orange/15 text-brand-orange">Default</span>}
                <p className="text-brand-text">{a.address}, {a.city}, {a.state} - {a.pincode}</p><p className="text-brand-muted">{a.phone}</p>
                <button type="button" onClick={() => delAddress(a)} className="mt-1 text-xs font-bold text-red-700 hover:underline">Delete</button>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-brand-muted">No saved addresses yet. They are saved automatically when you place an order.</p>}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-display text-xl font-bold text-brand-heading">Change Password</h2>
        <form onSubmit={changePw} noValidate className="grid gap-4 sm:grid-cols-3">
          <FormField id="cp" type="password" label="Current password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwe.currentPassword} />
          <FormField id="np" type="password" label="New password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwe.newPassword} />
          <FormField id="cf" type="password" label="Confirm new password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwe.confirm} />
          <div className="sm:col-span-3"><button type="submit" disabled={pwBusy} className="btn-primary">{pwBusy ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : 'Update Password'}</button></div>
        </form>
      </section>

      <button type="button" onClick={async () => { await logout(); toast.info('You have been logged out'); }} className="btn-outline !border-red-700 !text-red-700 hover:!bg-red-700 hover:!text-white">Logout</button>

      <Modal open={addrOpen} onClose={() => setAddrOpen(false)} title="Add Address" locked={addrBusy}>
        <form onSubmit={addAddress} noValidate className="space-y-4">
          <AddressForm value={addr} onChange={setAddr} errors={ae} idPrefix="new" />
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setAddrOpen(false)} className="rounded-[4px] border border-brand-muted/50 px-5 py-2.5 font-bold">Cancel</button><button type="submit" disabled={addrBusy} className="btn-primary">{addrBusy ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : 'Save Address'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
