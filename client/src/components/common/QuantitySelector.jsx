export default function QuantitySelector({
  value,
  onChange,
  max = 20,
  min = 1,
  disabled = false,
  size = "md",
}) {
  const b =
    size === "sm" ? "h-[22px] w-[24px] text-[18px]" : "h-7 w-8 text-[20px]";

  const n = size === "sm" ? "h-[22px] w-8 text-sm" : "h-7 w-10 text-base";

  return (
    <div
      className="inline-flex items-center gap-1.5"
      role="group"
      aria-label="Quantity"
    >
      {/* MINUS BUTTON */}
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
        className={`${b} flex items-center justify-center rounded-[3px] bg-[#d5cfcd] font-black text-black transition hover:enabled:bg-[#c4bdba] active:enabled:scale-95 disabled:cursor-not-allowed disabled:bg-[#e8e4e2] disabled:text-black/40`}
      >
        <span className="font-black leading-none select-none">–</span>
      </button>

      {/* VALUE DISPLAY */}
      <span
        aria-live="polite"
        className={`${n} flex items-center justify-center border-2 border-[#5c4a43] bg-white font-extrabold text-black`}
      >
        {value}
      </span>

      {/* PLUS BUTTON */}
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
        className={`${b} flex items-center justify-center rounded-[3px] bg-[#d5cfcd] font-black text-black transition hover:enabled:bg-[#c4bdba] active:enabled:scale-95 disabled:cursor-not-allowed disabled:bg-[#e8e4e2] disabled:text-black/40`}
      >
        <span className="font-black leading-none select-none">+</span>
      </button>
    </div>
  );
}
