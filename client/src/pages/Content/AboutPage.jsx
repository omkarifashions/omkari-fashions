import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { catalogApi } from "../../api/services.js";
import Seo from "../../components/common/Seo.jsx";
import SafeImage from "../../components/common/SafeImage.jsx";
import { ErrorState, Skeleton } from "../../components/common/Feedback.jsx";
import { imgUrl } from "../../utils/format.js";

const ROMAN = ["I", "II", "III", "IV"];

export default function AboutPage() {
  const about = useQuery({
    queryKey: ["cms", "about"],
    queryFn: () => catalogApi.cms("about"),
  });
  const values = useQuery({
    queryKey: ["cms", "about-values"],
    queryFn: () => catalogApi.cms("about-values"),
  });
  if (about.isError)
    return (
      <ErrorState message={about.error?.userMessage} onRetry={about.refetch} />
    );
  const a = about.data?.page;
  const v = values.data?.page;
  return (
    <div className="container-x max-w-[980px] pb-8 pt-8 sm:pt-12">
      <Seo
        title="About Us"
        description="Omkari Fashions has been bringing together traditional Indian jewellery and modern celebrations - a legacy built on trust since 1975."
        path="/about"
      />
      {!a ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-8 md:grid-cols-[minmax(0,400px)_1fr] md:gap-10">
          <SafeImage
            src={imgUrl(a.image)}
            alt="Omkari Fashions jewellery"
            eager
            className="aspect-[4/5] w-full bg-[#d9d9d9] object-cover md:aspect-[391/416]"
          />
          <div>
            <h1 className="font-display text-[22px] font-bold text-brand-heading sm:text-[24px]">
              {a.title}
            </h1>
            <h2 className="mt-6 font-sans text-[17px] font-bold">
              {a.subtitle}
            </h2>
            <div className="mt-5 space-y-5 text-[16px] leading-[1.35] sm:text-[17px]">
              {a.content?.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <ul className="mt-6 space-y-0.5 font-bold text-brand-rust">
              {a.items?.map((it) => (
                <li key={it.title}>{it.title}</li>
              ))}
            </ul>
            <p className="mt-6 font-bold italic">
              <Link to="/products" className="hover:text-brand-orange">
                Discover The Omkari Fashions Story
              </Link>
            </p>
          </div>
        </div>
      )}
      {v && (
        <section className="mt-14 text-center" aria-label={v.title}>
          <h2 className="font-sans text-[18px] font-normal">{v.title}</h2>
          <p className="mx-auto mt-1 max-w-3xl font-sans text-[17px] font-bold text-brand-rust sm:text-[19px]">
            {v.subtitle}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {v.items?.map((it, i) => (
              <div
                key={it.title}
                className="rounded-[4px] bg-[#EFDFD5] px-5 py-4"
              >
                <p className="font-sans text-[26px] font-medium leading-none tracking-widest">
                  {ROMAN[i]}
                </p>
                <h3 className="mt-1 font-display text-[21px] font-bold text-brand-rust">
                  {it.title}
                </h3>
                <p className="mt-1 text-[14px] leading-tight">{it.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
