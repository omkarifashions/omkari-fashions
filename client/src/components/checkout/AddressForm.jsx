import FormField from '../common/FormField.jsx';

export const EMPTY_ADDRESS = { name: '', phone: '', address: '', city: '', state: '', pincode: '' };

export function validateAddress(a) {
  const e = {};
  if (a.name.trim().length < 2) e.name = 'Enter the recipient name';
  if (!/^[6-9]\d{9}$/.test(a.phone.trim())) e.phone = 'Enter a valid 10 digit mobile number';
  if (a.address.trim().length < 5) e.address = 'Enter your full address';
  if (a.city.trim().length < 2) e.city = 'Enter your city';
  if (a.state.trim().length < 2) e.state = 'Enter your state';
  if (!/^\d{6}$/.test(a.pincode.trim())) e.pincode = 'Enter a valid 6 digit pincode';
  return e;
}

export default function AddressForm({ value, onChange, errors = {}, idPrefix = 'addr' }) {
  const set = (k) => (e) => onChange({ ...value, [k]: k === 'phone' || k === 'pincode' ? e.target.value.replace(/\D/g, '') : e.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id={`${idPrefix}-name`} label="Full name" autoComplete="name" value={value.name} onChange={set('name')} error={errors.name} />
      <FormField id={`${idPrefix}-phone`} label="Mobile number" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={value.phone} onChange={set('phone')} error={errors.phone} />
      <div className="sm:col-span-2"><FormField id={`${idPrefix}-address`} as="textarea" rows={2} label="Address" autoComplete="street-address" value={value.address} onChange={set('address')} error={errors.address} placeholder="House / flat no, street, area" /></div>
      <FormField id={`${idPrefix}-city`} label="City" autoComplete="address-level2" value={value.city} onChange={set('city')} error={errors.city} />
      <FormField id={`${idPrefix}-state`} label="State" autoComplete="address-level1" value={value.state} onChange={set('state')} error={errors.state} />
      <FormField id={`${idPrefix}-pincode`} label="Pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={value.pincode} onChange={set('pincode')} error={errors.pincode} />
    </div>
  );
}
