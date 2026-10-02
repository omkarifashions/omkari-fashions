import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { reviewApi } from "../../api/services.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

import { LoadingSpinner, RatingStars } from "../common/Feedback.jsx";
import SafeImage from "../common/SafeImage.jsx";
import { StarIcon } from "../common/Icons.jsx";
import { fmtDate, imgUrl } from "../../utils/format.js";

/* =========================================================
   REVIEW CARD
========================================================= */

export function ReviewCard({ r }) {
  return (
    <article className="rounded-lg bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white">
            {r.user?.name?.[0] || "C"}
          </span>

          <b className="text-sm">{r.user?.name || "Customer"}</b>
        </div>

        <span className="text-xs text-brand-muted">{fmtDate(r.createdAt)}</span>
      </div>

      <div className="mt-2">
        <RatingStars value={r.rating} />
      </div>

      {r.comment && (
        <p className="mt-1.5 text-[14px] text-brand-text">{r.comment}</p>
      )}

      {r.images?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {r.images.map((im) => (
            <SafeImage
              key={im.url}
              src={imgUrl(im.url)}
              alt="Customer review photo"
              className="h-16 w-16 rounded object-cover"
            />
          ))}
        </div>
      )}
    </article>
  );
}

/* =========================================================
   REVIEW FORM
========================================================= */

function ReviewForm({ productId, onDone }) {
  const toast = useToast();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const input = useRef(null);

  const pick = (e) => {
    const list = Array.from(e.target.files || []);

    e.target.value = "";

    const valid = list.filter(
      (file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
        file.size <= 5 * 1024 * 1024,
    );

    if (valid.length !== list.length) {
      toast.warning("Only JPG, PNG or WEBP images up to 5 MB are allowed");
    }

    setFiles((current) => [...current, ...valid].slice(0, 3));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }

    if (comment.trim().length < 5) {
      toast.error("Please write a short review");
      return;
    }

    setBusy(true);

    try {
      const fd = new FormData();

      fd.append("productId", productId);
      fd.append("rating", rating);
      fd.append("comment", comment.trim());

      files.forEach((file) => {
        fd.append("images", file);
      });

      await reviewApi.create(fd);

      toast.success("Thank you! Your review will appear after approval.");

      setRating(0);
      setComment("");
      setFiles([]);

      onDone();
    } catch (err) {
      toast.error(err?.userMessage || "Unable to submit your review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-lg bg-white p-4 shadow-card"
      noValidate
    >
      <h3 className="font-display text-lg font-bold">Write a review</h3>

      {/* Rating */}
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className={n <= rating ? "text-[#F2B01E]" : "text-[#d8c9be]"}
          >
            <StarIcon size={28} />
          </button>
        ))}
      </div>

      {/* Comment */}
      <label htmlFor="review-text" className="label mt-3">
        Your review
      </label>

      <textarea
        id="review-text"
        rows={3}
        maxLength={1500}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="input"
        placeholder="Tell others about the quality, finish and fit"
      />

      {/* Images */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {files.map((file, index) => (
          <span key={`${file.name}-${index}`} className="relative">
            <img
              src={URL.createObjectURL(file)}
              alt="Selected"
              className="h-14 w-14 rounded object-cover"
            />

            <button
              type="button"
              aria-label="Remove photo"
              onClick={() =>
                setFiles((current) => current.filter((_, i) => i !== index))
              }
              className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-red-600 text-xs text-white"
            >
              ×
            </button>
          </span>
        ))}

        {files.length < 3 && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="btn-outline !px-3 !py-1.5 text-xs"
          >
            Add photos (optional)
          </button>
        )}

        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={pick}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={busy}
        className="btn-primary mt-4 !py-2.5"
      >
        {busy ? (
          <>
            <LoadingSpinner size="sm" />
            <span className="ml-2">Submitting...</span>
          </>
        ) : (
          "Submit review"
        )}
      </button>
    </form>
  );
}

/* =========================================================
   REVIEW SECTION
========================================================= */

export default function ReviewSection({ product }) {
  const { user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  /* -------------------------------------------------------
     GET PRODUCT REVIEWS
  ------------------------------------------------------- */

  const reviews = useQuery({
    queryKey: ["reviews", product._id],
    queryFn: () => reviewApi.forProduct(product._id),
    staleTime: 30 * 1000,
  });

  /* -------------------------------------------------------
     CHECK WHETHER CUSTOMER CAN REVIEW

     Backend MUST decide this based on:
     - logged-in user
     - product ID
     - order history
     - delivered/received order
     - whether already reviewed
  ------------------------------------------------------- */

  const eligibility = useQuery({
    queryKey: ["review-elig", product._id, user?._id],
    queryFn: () => reviewApi.eligibility(product._id),
    enabled: Boolean(user),
  });

  const list = reviews.data?.reviews || [];

  /* -------------------------------------------------------
     REVIEWS ARE STILL LOADING
  ------------------------------------------------------- */

  if (reviews.isLoading) {
    return null;
  }

  /* -------------------------------------------------------
     NO REVIEWS

     Completely hide the Customer Reviews section.
  ------------------------------------------------------- */

  if (list.length === 0) {
    return null;
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <section
      className="container-x pt-12"
      aria-label="Customer reviews"
      id="reviews"
    >
      {/* Heading */}
      <h2 className="mb-4 text-center font-display text-[24px] font-bold text-brand-heading">
        Customer Reviews
      </h2>

      {/* Rating Summary */}
      <div className="mb-4 flex items-center justify-center gap-2 text-sm">
        <RatingStars value={product.ratingAvg} size={18} />

        <b>
          {product.ratingAvg ? product.ratingAvg.toFixed(1) : "No ratings yet"}
        </b>

        {product.ratingCount > 0 && (
          <span className="text-brand-muted">
            ({product.ratingCount} review
            {product.ratingCount > 1 ? "s" : ""})
          </span>
        )}
      </div>

      {/* Reviews */}
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((review) => (
          <ReviewCard key={review._id} r={review} />
        ))}
      </div>

      {/* =====================================================
          CUSTOMER REVIEW ACTION
      ===================================================== */}

      <div className="mx-auto mt-6 max-w-xl">
        {/* ---------------------------------------------------
            NOT LOGGED IN
        --------------------------------------------------- */}

        {!user && (
          <p className="text-center text-sm text-brand-text">
            <button
              type="button"
              className="font-bold text-brand-orange underline"
              onClick={() =>
                navigate("/login", {
                  state: {
                    from: location.pathname,
                  },
                })
              }
            >
              Log in
            </button>{" "}
            to review products you have purchased.
          </p>
        )}

        {/* ---------------------------------------------------
            ELIGIBILITY IS LOADING
        --------------------------------------------------- */}

        {user && eligibility.isLoading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {/* ---------------------------------------------------
            CUSTOMER CAN REVIEW

            This should ONLY be true when the customer
            purchased/received this product.
        --------------------------------------------------- */}

        {user && !eligibility.isLoading && eligibility.data?.canReview && (
          <ReviewForm
            productId={product._id}
            onDone={() => {
              queryClient.invalidateQueries({
                queryKey: ["reviews", product._id],
              });

              queryClient.invalidateQueries({
                queryKey: ["review-elig", product._id, user._id],
              });
            }}
          />
        )}

        {/* ---------------------------------------------------
            ALREADY REVIEWED
        --------------------------------------------------- */}

        {user && !eligibility.isLoading && eligibility.data?.reviewed && (
          <p className="text-center text-sm text-brand-text">
            Thanks for reviewing this product
            {eligibility.data.status === "pending"
              ? " - your review is awaiting approval."
              : "."}
          </p>
        )}

        {/* ---------------------------------------------------
            LOGGED IN BUT DID NOT PURCHASE

            IMPORTANT:
            Don't show a review form.
            Don't show an error.
            Simply don't show anything.
        --------------------------------------------------- */}

        {user &&
          !eligibility.isLoading &&
          !eligibility.data?.canReview &&
          !eligibility.data?.reviewed &&
          eligibility.data && (
            <div className="hidden" aria-hidden="true">
              {/* Customer has not purchased/received this product */}
            </div>
          )}
      </div>
    </section>
  );
}
