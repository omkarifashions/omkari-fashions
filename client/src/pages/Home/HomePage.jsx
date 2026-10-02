import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../../api/services.js";
import Seo from "../../components/common/Seo.jsx";
import { ErrorState, Skeleton } from "../../components/common/Feedback.jsx";
import {
  AboutBlock,
  BannerCarousel,
  BestSellers,
  CategoryCircles,
  FaqCarousel,
  NewArrivals,
  ProductRow,
  Testimonials,
  WalkIn,
} from "../../components/home/HomeParts.jsx";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["home"],
    queryFn: catalogApi.home,
  });
  const [best, setBest] = useState(null);
  useEffect(() => {
    catalogApi
      .cms("best-sellers")
      .then((r) => setBest(r.page))
      .catch(() => {});
  }, []);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Omkari Fashions",
    url: window.location.origin,
    logo: `${window.location.origin}/images/logo.png`,
    description: "Premium traditional Indian jewellery since 1975.",
    email: "omkarifashions1@gmail.com",
    telephone: "+91-9177447021",
  };

  return (
    <div className="pb-4">
      <Seo
        title=""
        description="Omkari Fashions - premium traditional Indian jewellery since 1975. Shop God jewellery, Bharatnatyam sets, Jadau Kundan, Varalakshmi items, necklaces, earrings, maangtika and bangles."
        path="/"
        jsonLd={ld}
      />
      <h1 className="sr-only">
        Omkari Fashions - Traditional Indian Jewellery
      </h1>
      {isLoading ? (
        <div className="container-x space-y-6 pt-10">
          <div className="flex justify-center gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-full" />
            ))}
          </div>
          <Skeleton className="aspect-[3/1] w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <ErrorState message={error?.userMessage} onRetry={refetch} />
      ) : (
        <>
          <CategoryCircles items={data.circles} />
          <BannerCarousel banners={data.banners} />
          <NewArrivals products={data.newArrivals} />
          {data.sections.map((s) => (
            <ProductRow
              key={s.category._id}
              category={s.category}
              products={s.products}
            />
          ))}
          <FaqCarousel faqs={data.faqs} />
          <WalkIn page={data.walkin} />
          <Testimonials items={data.testimonials} />
          <BestSellers page={best} />
          <AboutBlock page={data.about} />
        </>
      )}
    </div>
  );
}
