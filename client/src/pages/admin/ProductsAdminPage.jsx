import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "../../api/services.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import useDebounce from "../../hooks/useDebounce.js";

import {
  EmptyState,
  ErrorState,
  PageLoader,
  Pagination,
} from "../../components/common/Feedback.jsx";

import {
  PageHeader,
  SelectBox,
  TableWrap,
  Td,
  Th,
  Toolbar,
} from "../../components/admin/AdminUI.jsx";

import { imgUrl, rupee } from "../../utils/format.js";

/* =========================================================
   ACTION ICONS
========================================================= */

function ViewIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function EditIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  );
}

function DeleteIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

/* =========================================================
   ACTION LINK
========================================================= */

function ActionLink({
  to,
  href,
  icon,
  children,
  danger = false,
  disabled = false,
  onClick,
}) {
  const className = `
    inline-flex
    items-center
    gap-1.5
    whitespace-nowrap
    text-[13px]
    font-semibold
    leading-none
    transition
    ${
      danger
        ? "text-red-700 hover:text-red-800"
        : "text-[#7B553F] hover:text-[#A84300]"
    }
    ${disabled ? "pointer-events-none opacity-40" : ""}
  `;

  const content = (
    <>
      <span className="shrink-0">{icon}</span>
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={to} className={className} onClick={onClick}>
      {content}
    </Link>
  );
}

/* =========================================================
   PRODUCTS ADMIN
========================================================= */

export default function ProductsAdminPage() {
  const [q, setQ] = useState("");
  const [stock, setStock] = useState("");
  const [page, setPage] = useState(1);
  const [delId, setDelId] = useState(null);

  const dq = useDebounce(q, 350);

  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "products", dq, stock, page],
    queryFn: () =>
      adminApi.list("products", {
        q: dq,
        stock,
        page,
        limit: 15,
      }),
    placeholderData: (previousData) => previousData,
  });

  /* =======================================================
     DELETE PRODUCT
  ======================================================= */

  const del = async (p) => {
    const confirmed = await confirm({
      title: "Are you sure you want to delete this product?",
      message: `“${p.name}” and its images will be permanently deleted.`,
      confirmText: "Delete product",
      tone: "danger",
    });

    if (!confirmed) return;

    setDelId(p._id);

    try {
      await adminApi.remove("products", p._id);

      toast.success("Product deleted");

      qc.invalidateQueries({
        queryKey: ["admin", "products"],
      });
    } catch (e) {
      toast.error(e?.userMessage || "Unable to delete product");
    } finally {
      setDelId(null);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-w-0">
      <PageHeader
        title="Products"
        subtitle={data ? `${data.total} products` : ""}
      >
        <Link to="/admin/products/new" className="btn-primary !py-2">
          + Add Product
        </Link>
      </PageHeader>

      <Toolbar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search name, SKU or tag…"
      >
        <SelectBox
          label="Stock filter"
          value={stock}
          onChange={(v) => {
            setStock(v);
            setPage(1);
          }}
          options={[
            ["", "All stock"],
            ["out", "Out of stock"],
          ]}
        />
      </Toolbar>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState message={error?.userMessage} onRetry={refetch} />
      ) : data.products.length === 0 ? (
        <EmptyState
          image={false}
          title="No products found"
          actionLabel="Add product"
          to="/admin/products/new"
        />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Image</Th>
                <Th>Name</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>

                {/* Flags */}
                <Th>Flags</Th>

                {/* Actions */}
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>

            <tbody>
              {data.products.map((p) => (
                <tr key={p._id}>
                  {/* IMAGE */}
                  <Td>
                    <img
                      src={imgUrl(p.images?.[0]?.url)}
                      alt=""
                      className="h-12 w-12 rounded object-cover"
                    />
                  </Td>

                  {/* NAME */}
                  <Td className="max-w-[240px]">
                    <div className="flex flex-col gap-1">
                      <span className="line-clamp-2 font-bold">{p.name}</span>

                      {!p.isActive && (
                        <span className="badge w-fit bg-gray-200 text-gray-700">
                          Hidden
                        </span>
                      )}
                    </div>
                  </Td>

                  {/* SKU */}
                  <Td>
                    <span className="whitespace-nowrap">{p.sku}</span>
                  </Td>

                  {/* CATEGORY */}
                  <Td>
                    <span className="max-w-[110px] leading-5">
                      {p.category?.name || "—"}
                    </span>
                  </Td>

                  {/* PRICE */}
                  <Td>
                    <div className="flex flex-col">
                      {p.salePrice > 0 && (
                        <span className="text-xs text-brand-muted line-through">
                          {rupee(p.price)}
                        </span>
                      )}

                      <b className="whitespace-nowrap">{rupee(p.finalPrice)}</b>
                    </div>
                  </Td>

                  {/* STOCK */}
                  <Td>
                    <span
                      className={`
                        badge
                        inline-flex
                        min-w-[36px]
                        justify-center
                        ${
                          p.stock === 0
                            ? "bg-red-100 text-red-800"
                            : p.stock <= 5
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                        }
                      `}
                    >
                      {p.stock}
                    </span>
                  </Td>

                  {/* FLAGS */}
                  <Td className="w-[150px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.isBestseller && (
                        <span className="badge whitespace-nowrap bg-brand-orange/15 text-brand-orange">
                          Best
                        </span>
                      )}

                      {p.isNewArrival && (
                        <span className="badge whitespace-nowrap bg-sky-100 text-sky-800">
                          New
                        </span>
                      )}

                      {!p.isReturnable && (
                        <span className="badge whitespace-nowrap bg-gray-200 text-gray-700">
                          No return
                        </span>
                      )}
                    </div>
                  </Td>

                  {/* ACTIONS */}
                  <Td className="w-[190px] text-center">
                    <div className="flex items-center justify-center gap-3">
                      {/* View */}
                      <ActionLink
                        href={`/products/${p.slug}`}
                        icon={<ViewIcon />}
                      >
                        View
                      </ActionLink>

                      {/* Edit */}
                      <ActionLink
                        to={`/admin/products/${p._id}`}
                        icon={<EditIcon />}
                      >
                        Edit
                      </ActionLink>

                      {/* Delete */}
                      <button
                        type="button"
                        disabled={delId === p._id}
                        onClick={() => del(p)}
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          whitespace-nowrap
                          text-[13px]
                          font-semibold
                          leading-none
                          text-red-700
                          transition
                          hover:text-red-800
                          disabled:pointer-events-none
                          disabled:opacity-40
                        "
                      >
                        <DeleteIcon />

                        <span>{delId === p._id ? "Deleting…" : "Delete"}</span>
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
