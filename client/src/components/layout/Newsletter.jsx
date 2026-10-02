import { useState } from "react";
import { catalogApi } from "../../api/services.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { LoadingSpinner } from "../common/Feedback.jsx";

export default function Newsletter() {
  const toast = useToast();
  const settings = useSettings();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    const value = email.trim();

    if (!/^\S+@\S+\.\S+$/.test(value)) {
      return toast.error("Please enter a valid email address");
    }

    setBusy(true);

    try {
      const r = await catalogApi.subscribe({ email: value });

      toast.success(r.message || "Thanks for subscribing!");
      setEmail("");
    } catch (err) {
      if (err.status === 409) {
        toast.info(err.userMessage);
      } else {
        toast.error(err.userMessage);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="Newsletter"
      className="relative mt-10 overflow-hidden text-white"
      style={{
        backgroundImage:
          "linear-gradient(90deg, #461C03 0%, #9F3D00 35%, #532000 65%)",
      }}
    >
      {/* Subtle luxury overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18), transparent 45%)",
        }}
      />

      <div className="relative mx-auto max-w-xl px-5 py-8 text-center sm:py-10">
        <p className="text-[13px] font-medium leading-relaxed tracking-wide text-[#FDF8F3] sm:text-[15px]">
          {settings.newsletterText ||
            "Be the first to know about new designs, special events and much more!"}
        </p>

        <form
          onSubmit={submit}
          className="mt-4 flex flex-col items-center justify-center gap-2.5 sm:flex-row"
          noValidate
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Your email
          </label>

          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            autoComplete="email"
            className="
              h-[42px]
              w-full
              rounded-[2px]
              border
              border-white/30
              bg-black/30
              px-3.5
              text-[13px]
              text-white
              placeholder:text-white/60
              backdrop-blur-sm
              focus:border-white/70
              focus:outline-none
              sm:max-w-[280px]
            "
          />

          <button
            type="submit"
            disabled={busy}
            aria-label="Subscribe to newsletter"
            className="
              flex
              h-[42px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-[2px]
              bg-white
              px-7
              text-[14px]
              font-bold
              text-[#532000]
              transition
              hover:bg-[#FDF8F3]
              active:scale-[0.99]
              disabled:opacity-70
              sm:w-auto
            "
          >
            {busy ? (
              <LoadingSpinner
                size="sm"
                className="border-[#532000] border-t-transparent"
              />
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
      </div>

      {/* Decorative Paisley Bottom Band */}
      <div
        className="paisley-band pointer-events-none absolute inset-x-0 bottom-0 h-8 opacity-25 sm:h-12"
        aria-hidden="true"
        style={{
          filter: "sepia(1) saturate(2) hue-rotate(-10deg) brightness(1.5)",
        }}
      />
    </section>
  );
}
