export default function PaymentSelector({ value, onChange, codEnabled = true }) {
  const opts = [
    { id: 'razorpay', title: 'Pay Online', desc: 'UPI, cards, net banking & wallets via Razorpay', icon: '💳' },
    { id: 'cod', title: 'Cash on Delivery', desc: codEnabled ? 'Pay in cash when your order arrives' : 'Currently unavailable', icon: '💵', disabled: !codEnabled },
  ];
  return (
    <fieldset>
      <legend className="sr-only">Payment method</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {opts.map((o) => (
          <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition ${value === o.id ? 'border-brand-orange bg-white' : 'border-transparent bg-white/60 hover:bg-white'} ${o.disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <input type="radio" name="payment" value={o.id} checked={value === o.id} disabled={o.disabled} onChange={() => onChange(o.id)} className="mt-1 h-4 w-4 accent-[#A84300]" />
            <span><span className="block font-bold text-brand-heading">{o.icon} {o.title}</span><span className="text-[13px] text-brand-text">{o.desc}</span></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
