import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../../api/services.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import Seo from "../../components/common/Seo.jsx";
import { LoadingSpinner } from "../../components/common/Feedback.jsx";
import { MailIcon, PhoneIcon } from "../../components/common/Icons.jsx";

export default function ContactPage() {
  const toast = useToast();
  const s = useSettings();
  const cms = useQuery({
    queryKey: ["cms", "contact"],
    queryFn: () => catalogApi.cms("contact"),
  });
  const page = cms.data?.page;
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const paras = (page?.content || "").split("\n\n");

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 2) er.name = "Please enter your name";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim()))
      er.email = "Please enter a valid email";
    if (f.message.trim().length < 5) er.message = "Please write a message";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const r = await catalogApi.contact({
        name: f.name.trim(),
        email: f.email.trim(),
        message: f.message.trim(),
      });
      toast.success(r.message || "Message sent");
      setF({ name: "", email: "", message: "" });
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  const field = (k, ph, extra = {}) => (
    <div>
      <label htmlFor={`c-${k}`} className="sr-only">
        {ph}
      </label>
      {k === "message" ? (
        <textarea
          id={`c-${k}`}
          rows={4}
          placeholder={ph}
          value={f[k]}
          onChange={(e) => setF({ ...f, [k]: e.target.value })}
          maxLength={3000}
          aria-invalid={Boolean(errors[k])}
          className={`input ${errors[k] ? "input-error" : ""}`}
        />
      ) : (
        <input
          id={`c-${k}`}
          placeholder={ph}
          value={f[k]}
          onChange={(e) => setF({ ...f, [k]: e.target.value })}
          aria-invalid={Boolean(errors[k])}
          className={`input ${errors[k] ? "input-error" : ""}`}
          {...extra}
        />
      )}
      {errors[k] && (
        <p role="alert" className="mt-1 text-xs font-bold text-red-700">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <div className="container-x max-w-[920px] pb-8 pt-8 sm:pt-10">
      <Seo
        title="Contact Us"
        description="Contact Omkari Fashions for order queries, product questions and support. WhatsApp 9177447021 or email omkarifashions1@gmail.com."
        path="/contact"
      />
      <div className="mx-auto max-w-[800px] text-center text-[15px] leading-snug sm:text-[16px]">
        <h1 className="font-display text-[22px] font-bold text-brand-heading">
          Contact Us
        </h1>
        <p className="mt-5">
          {page?.subtitle?.replace("Omkari Fashions.", "")}
          <b>Omkari Fashions.</b>
        </p>
        <div className="mt-8 space-y-6">
          {paras.slice(0, 1).map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>
            <b>Email: {s.email}</b>
          </p>
          {paras.slice(1).map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 h-px w-full bg-rule" aria-hidden="true" />
      <div className="mt-10 grid gap-10 md:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="git">
          <h2 id="git" className="font-sans text-[22px] font-normal">
            Get In Touch
          </h2>
          <form onSubmit={submit} noValidate className="mt-4 space-y-3.5">
            {field("name", "Name", { autoComplete: "name", maxLength: 80 })}
            {field("email", "Email", { type: "email", autoComplete: "email" })}
            {field("message", "Message")}
            <button
              type="submit"
              disabled={busy}
              className="btn-maroon !h-[38px] w-[170px] text-[16px]"
            >
              {busy ? (
                <LoadingSpinner
                  size="sm"
                  className="border-white border-t-transparent"
                />
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </section>
        <section aria-labelledby="sup">
          <h2 id="sup" className="font-sans text-[22px] font-normal">
            Support
          </h2>
          <div className="mt-4 flex gap-3">
            <PhoneIcon size={20} className="mt-1 shrink-0" />
            <div>
              <p className="text-[18px]">Phone</p>
              <a
                href={`tel:${s.phone.split(" ")[0]}`}
                className="text-[18px] font-bold text-[#555]"
              >
                {s.phone}
              </a>
            </div>
          </div>
          <hr className="my-5 border-[#a99d95]" />
          <div className="flex gap-3">
            <MailIcon size={20} className="mt-1 shrink-0" />
            <div>
              <p className="text-[18px]">Email Us</p>
              <a
                href={`mailto:${s.email}`}
                className="break-all text-[18px] font-bold text-[#555]"
              >
                {s.email}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
