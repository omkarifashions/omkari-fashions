import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, authApi } from "../../api/services.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import FormField from "../../components/common/FormField.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
  PageLoader,
  RatingStars,
} from "../../components/common/Feedback.jsx";
import {
  ImageUploader,
  PageHeader,
  TableWrap,
  Td,
  Th,
  Toggle,
  Toolbar,
} from "../../components/admin/AdminUI.jsx";
import ResourceManager from "../../components/admin/ResourceManager.jsx";
import { StatusBadge } from "../../components/orders/Timelines.jsx";
import { fmtDate, fmtDateTime, imgUrl, rupee } from "../../utils/format.js";

/* ---------------- Customers ---------------- */

export function CustomersPage() {
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 350);
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "customers", dq],
    queryFn: () => adminApi.list("customers", { q: dq }),
  });

  const toggle = async (c) => {
    if (
      c.isActive &&
      !(await confirm({
        title: "Disable this account?",
        message: `${c.name} will no longer be able to log in.`,
        confirmText: "Disable",
        tone: "danger",
      }))
    ) {
      return;
    }

    try {
      await adminApi.setCustomerStatus(c._id, !c.isActive);

      toast.success(c.isActive ? "Account disabled" : "Account enabled");

      qc.invalidateQueries({
        queryKey: ["admin", "customers"],
      });
    } catch (e) {
      toast.error(e.userMessage);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={data ? `${data.customers.length} customers` : ""}
      />

      <Toolbar
        value={q}
        onChange={setQ}
        placeholder="Search name, email, phone…"
      />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState message={error?.userMessage} onRetry={refetch} />
      ) : data.customers.length === 0 ? (
        <EmptyState image={false} title="No customers yet" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Registered</Th>
              <Th>Orders</Th>
              <Th>Total spent</Th>
              <Th>Status</Th>
            </tr>
          </thead>

          <tbody>
            {data.customers.map((c) => (
              <tr key={c._id}>
                <Td>
                  <b>{c.name}</b>
                </Td>

                <Td>{c.email}</Td>

                <Td>{c.phone}</Td>

                <Td>{fmtDate(c.createdAt)}</Td>

                <Td>{c.orders}</Td>

                <Td>{rupee(c.totalSpent)}</Td>

                <Td>
                  <Toggle
                    checked={c.isActive}
                    onChange={() => toggle(c)}
                    label={c.isActive ? "Active" : "Disabled"}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

/* ---------------- Reviews ---------------- */

export function ReviewsPage() {
  const [status, setStatus] = useState("pending");
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "reviews", status],
    queryFn: () => adminApi.list("reviews", { status }),
  });

  const act = async (id, fn, msg) => {
    setBusy(id);

    try {
      await fn();

      toast.success(msg);

      qc.invalidateQueries({
        queryKey: ["admin", "reviews"],
      });

      qc.invalidateQueries({
        queryKey: ["admin", "dashboard"],
      });
    } catch (e) {
      toast.error(e.userMessage);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Reviews" />

      <div className="mb-4 flex gap-2">
        {["pending", "approved", "rejected", ""].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              status === s ? "bg-btn text-white" : "bg-white text-brand-text"
            }`}
          >
            {s ? s[0].toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState message={error?.userMessage} onRetry={refetch} />
      ) : data.reviews.length === 0 ? (
        <EmptyState image={false} title="No reviews here" />
      ) : (
        <ul className="space-y-3">
          {data.reviews.map((r) => (
            <li key={r._id} className="rounded-lg bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b>{r.user?.name}</b>{" "}
                  <span className="text-xs text-brand-muted">
                    {r.user?.email} · {fmtDate(r.createdAt)}
                  </span>
                  <p className="text-xs">
                    on{" "}
                    <a
                      href={`/products/${r.product?.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-brand-orange"
                    >
                      {r.product?.name}
                    </a>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <RatingStars value={r.rating} />
                  <StatusBadge status={r.status} />
                </div>
              </div>

              <p className="mt-2 text-sm">{r.comment}</p>

              {r.images?.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {r.images.map((im) => (
                    <a
                      key={im.url}
                      href={imgUrl(im.url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={imgUrl(im.url)}
                        alt="Review"
                        className="h-14 w-14 rounded object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {r.status !== "approved" && (
                  <button
                    type="button"
                    disabled={busy === r._id}
                    onClick={() =>
                      act(
                        r._id,
                        () => adminApi.reviewStatus(r._id, "approved"),
                        "Review approved",
                      )
                    }
                    className="btn-primary !px-4 !py-1.5 text-sm"
                  >
                    Approve
                  </button>
                )}

                {r.status !== "rejected" && (
                  <button
                    type="button"
                    disabled={busy === r._id}
                    onClick={() =>
                      act(
                        r._id,
                        () => adminApi.reviewStatus(r._id, "rejected"),
                        "Review rejected",
                      )
                    }
                    className="btn-outline !px-4 !py-1.5 text-sm"
                  >
                    Reject
                  </button>
                )}

                {r.status === "approved" && (
                  <button
                    type="button"
                    disabled={busy === r._id}
                    onClick={() =>
                      act(
                        r._id,
                        () => adminApi.featureReview(r._id),
                        "Added to homepage testimonials",
                      )
                    }
                    className="btn-outline !px-4 !py-1.5 text-sm"
                  >
                    Feature on homepage
                  </button>
                )}

                <button
                  type="button"
                  disabled={busy === r._id}
                  onClick={async () => {
                    if (
                      await confirm({
                        title: "Delete this review?",
                        message: "This cannot be undone.",
                        confirmText: "Delete",
                        tone: "danger",
                      })
                    ) {
                      act(
                        r._id,
                        () => adminApi.remove("reviews", r._id),
                        "Review deleted",
                      );
                    }
                  }}
                  className="px-3 py-1.5 text-sm font-bold text-red-700 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Messages ---------------- */

export function MessagesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [open, setOpen] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: () => adminApi.list("messages"),
  });

  const refresh = () => {
    qc.invalidateQueries({
      queryKey: ["admin", "messages"],
    });

    qc.invalidateQueries({
      queryKey: ["admin", "dashboard"],
    });
  };

  const read = async (m, isRead) => {
    try {
      await adminApi.messageRead(m._id, isRead);
      refresh();
    } catch (e) {
      toast.error(e.userMessage);
    }
  };

  const toggleOpen = (m) => {
    setOpen(open === m._id ? null : m._id);

    if (!m.isRead) {
      read(m, true);
    }
  };

  const del = async (m) => {
    if (
      !(await confirm({
        title: "Delete this message?",
        confirmText: "Delete",
        tone: "danger",
      }))
    ) {
      return;
    }

    try {
      await adminApi.remove("messages", m._id);

      toast.success("Message deleted");

      refresh();
    } catch (e) {
      toast.error(e.userMessage);
    }
  };

  return (
    <div>
      <PageHeader title="Messages" subtitle="Contact form submissions" />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState message={error?.userMessage} onRetry={refetch} />
      ) : data.messages.length === 0 ? (
        <EmptyState image={false} title="No messages yet" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Status</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Message</Th>
              <Th>Date</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>

          <tbody>
            {data.messages.map((m) => (
              <tr key={m._id} className={m.isRead ? "" : "bg-amber-50/60"}>
                <Td>
                  <span
                    className={`badge ${
                      m.isRead
                        ? "bg-gray-200 text-gray-700"
                        : "bg-brand-orange text-white"
                    }`}
                  >
                    {m.isRead ? "Read" : "Unread"}
                  </span>
                </Td>

                <Td>
                  <b>{m.name}</b>
                </Td>

                <Td>
                  <a href={`mailto:${m.email}`} className="text-brand-orange">
                    {m.email}
                  </a>
                </Td>

                <Td className="max-w-[340px]">
                  <button
                    type="button"
                    onClick={() => toggleOpen(m)}
                    className="text-left"
                  >
                    {open === m._id ? (
                      <span className="whitespace-pre-wrap">{m.message}</span>
                    ) : (
                      <span className="line-clamp-2">{m.message}</span>
                    )}
                  </button>
                </Td>

                <Td>{fmtDateTime(m.createdAt)}</Td>

                <Td className="whitespace-nowrap text-right">
                  <button
                    type="button"
                    onClick={() => read(m, !m.isRead)}
                    className="mr-3 font-bold text-brand-orange hover:underline"
                  >
                    Mark {m.isRead ? "unread" : "read"}
                  </button>

                  <button
                    type="button"
                    onClick={() => del(m)}
                    className="font-bold text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

/* ---------------- Newsletter ---------------- */

export function NewsletterPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "newsletter"],
    queryFn: () => adminApi.list("newsletter"),
  });

  const del = async (s) => {
    if (
      !(await confirm({
        title: "Remove subscriber?",
        message: s.email,
        confirmText: "Remove",
        tone: "danger",
      }))
    ) {
      return;
    }

    try {
      await adminApi.remove("newsletter", s._id);

      toast.success("Subscriber removed");

      qc.invalidateQueries({
        queryKey: ["admin", "newsletter"],
      });
    } catch (e) {
      toast.error(e.userMessage);
    }
  };

  const exportCsv = () => {
    const rows = [
      "email,subscribed_on",
      ...data.subscribers.map(
        (s) => `${s.email},${new Date(s.createdAt).toISOString()}`,
      ),
    ];

    const url = URL.createObjectURL(
      new Blob([rows.join("\n")], {
        type: "text/csv",
      }),
    );

    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-subscribers.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Newsletter"
        subtitle={data ? `${data.subscribers.length} subscribers` : ""}
      >
        {data?.subscribers?.length > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="btn-outline !py-2"
          >
            Export CSV
          </button>
        )}
      </PageHeader>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState message={error?.userMessage} onRetry={refetch} />
      ) : data.subscribers.length === 0 ? (
        <EmptyState image={false} title="No subscribers yet" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Subscribed</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>

          <tbody>
            {data.subscribers.map((s) => (
              <tr key={s._id}>
                <Td>{s.email}</Td>

                <Td>{fmtDateTime(s.createdAt)}</Td>

                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => del(s)}
                    className="font-bold text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

/* ---------------- Resource screens ---------------- */

export const CategoriesPage = () => (
  <ResourceManager
    resource="categories"
    title="Categories"
    itemName="category"
    columns={[
      {
        key: "image",
        label: "Image",
        type: "image",
      },
      {
        key: "name",
        label: "Name",
      },
      {
        key: "slug",
        label: "Slug",
      },
      {
        key: "displayOrder",
        label: "Order",
      },
      {
        key: "isActive",
        label: "Active",
        type: "bool",
      },
    ]}
    fields={[
      {
        key: "name",
        label: "Category name",
        required: true,
      },
      {
        key: "slug",
        label: "Slug",
        hint: "Leave empty to generate from the name",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
      },
      {
        key: "image",
        label: "Category image",
        type: "image",
        folder: "categories",
      },
      {
        key: "subcategories",
        label: "Styles / subcategories",
        type: "tags",
        hint: "Comma separated - shown in the navigation dropdown and used as tabs",
        full: true,
      },
      {
        key: "displayOrder",
        label: "Display order",
        type: "number",
      },
      {
        key: "isActive",
        label: "Enabled",
        type: "bool",
        default: true,
      },
      {
        key: "showInCircles",
        label: "Show in homepage category circles",
        type: "bool",
        default: false,
      },
      {
        key: "showOnHome",
        label: "Show product row on homepage",
        type: "bool",
        default: false,
      },
      {
        key: "homeTitle",
        label: "Homepage section title",
      },
      {
        key: "homeSubtitle",
        label: "Homepage section subtitle",
      },
    ]}
  />
);

export const CollectionsPage = () => (
  <ResourceManager
    resource="collections"
    title="Collections"
    itemName="collection"
    columns={[
      {
        key: "image",
        label: "Image",
        type: "image",
      },
      {
        key: "title",
        label: "Title",
      },
      {
        key: "products",
        label: "Products",
        type: "count",
      },
      {
        key: "displayOrder",
        label: "Order",
      },
      {
        key: "isActive",
        label: "Active",
        type: "bool",
      },
    ]}
    fields={[
      {
        key: "title",
        label: "Collection title",
        required: true,
      },
      {
        key: "displayOrder",
        label: "Display order",
        type: "number",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
      },
      {
        key: "image",
        label: "Image",
        type: "image",
        folder: "collections",
      },
      {
        key: "products",
        label: "Products",
        type: "products",
      },
      {
        key: "isActive",
        label: "Active",
        type: "bool",
        default: true,
      },
    ]}
  />
);

export const BannersPage = () => (
  <ResourceManager
    resource="banners"
    title="Banners"
    subtitle="Homepage hero banners"
    itemName="banner"
    defaults={{
      buttonText: "Shop Now",
      buttonUrl: "/products",
      showText: true,
    }}
    columns={[
      {
        key: "image",
        label: "Image",
        type: "image",
      },
      {
        key: "title",
        label: "Title",
      },
      {
        key: "buttonUrl",
        label: "Link",
      },
      {
        key: "displayOrder",
        label: "Order",
      },
      {
        key: "isActive",
        label: "Active",
        type: "bool",
      },
    ]}
    fields={[
      {
        key: "title",
        label: "Title",
        required: true,
      },
      {
        key: "subtitle",
        label: "Subtitle",
      },
      {
        key: "buttonText",
        label: "Button text",
      },
      {
        key: "buttonUrl",
        label: "Button URL",
        placeholder: "/category/necklaces",
      },
      {
        key: "displayOrder",
        label: "Display order",
        type: "number",
      },
      {
        key: "isActive",
        label: "Active",
        type: "bool",
        default: true,
      },
      {
        key: "showText",
        label:
          "Overlay title & button on the image (turn off if the image already contains text)",
        type: "bool",
        default: true,
      },
      {
        key: "image",
        label: "Desktop image (wide, about 3:1)",
        type: "image",
        folder: "banners",
      },
      {
        key: "mobileImage",
        label: "Mobile image (optional)",
        type: "image",
        folder: "banners",
      },
    ]}
  />
);

export const CouponsPage = () => (
  <ResourceManager
    resource="coupons"
    title="Coupons"
    itemName="coupon"
    defaults={{
      type: "percent",
      isActive: true,
    }}
    columns={[
      {
        key: "code",
        label: "Code",
      },
      {
        key: "type",
        label: "Type",
      },
      {
        key: "value",
        label: "Value",
      },
      {
        key: "minOrderValue",
        label: "Min order",
      },
      {
        key: "usedCount",
        label: "Used",
      },
      {
        key: "expiresAt",
        label: "Expires",
        type: "date",
      },
      {
        key: "isActive",
        label: "Active",
        type: "bool",
      },
    ]}
    fields={[
      {
        key: "code",
        label: "Code",
        required: true,
      },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          ["percent", "Percent %"],
          ["flat", "Flat ₹"],
        ],
      },
      {
        key: "value",
        label: "Value",
        type: "number",
        required: true,
      },
      {
        key: "maxDiscount",
        label: "Max discount ₹ (0 = none)",
        type: "number",
      },
      {
        key: "minOrderValue",
        label: "Minimum order ₹",
        type: "number",
      },
      {
        key: "usageLimit",
        label: "Usage limit (0 = unlimited)",
        type: "number",
      },
      {
        key: "expiresAt",
        label: "Expiry date",
        type: "date",
      },
      {
        key: "description",
        label: "Description",
      },
      {
        key: "isActive",
        label: "Active",
        type: "bool",
        default: true,
      },
    ]}
  />
);

/* ---------------- CMS ---------------- */

const CMS_KEYS = [
  ["about", "About Us - story"],
  ["about-values", "About Us - values"],
  ["contact", "Contact Us - text"],
  ["home-about", "Homepage - About section"],
  ["best-sellers", "Homepage - Best Sellers images"],
  ["walkin", "Homepage - Walk-in experience"],
  ["store-locator", "Store Locator"],
  ["privacy-policy", "Privacy Policy"],
  ["terms-of-use", "Terms of Use"],
  ["shipping-policy", "Shipping Policy"],
  ["return-and-refund-policy", "Return and Refund Policy"],
];

function CmsEditor({ pageKey, title }) {
  const toast = useToast();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin", "cms"],
    queryFn: () => adminApi.list("cms"),
  });

  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = (q.data?.pages || []).find((x) => x.key === pageKey);

    setF({
      title: p?.title || title,
      subtitle: p?.subtitle || "",
      content: p?.content || "",
      image: p?.image || "",
      items: p?.items || [],
      seoTitle: p?.seoTitle || "",
      seoDescription: p?.seoDescription || "",
      isActive: p?.isActive ?? true,
    });
  }, [q.data, pageKey, title]);

  if (!f) return <PageLoader />;

  const setItem = (i, k, v) =>
    setF((x) => ({
      ...x,
      items: x.items.map((it, j) =>
        j === i
          ? {
              ...it,
              [k]: v,
            }
          : it,
      ),
    }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      await adminApi.saveCms(pageKey, f);

      toast.success("Content saved");

      qc.invalidateQueries({
        queryKey: ["admin", "cms"],
      });

      qc.invalidateQueries({
        queryKey: ["cms"],
      });

      qc.invalidateQueries({
        queryKey: ["home"],
      });
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="space-y-4 rounded-lg bg-white p-5 shadow-card"
    >
      <FormField
        id="c-title"
        label="Title"
        value={f.title}
        onChange={(e) =>
          setF({
            ...f,
            title: e.target.value,
          })
        }
      />

      <FormField
        id="c-sub"
        label="Subtitle"
        value={f.subtitle}
        onChange={(e) =>
          setF({
            ...f,
            subtitle: e.target.value,
          })
        }
      />

      <FormField
        as="textarea"
        rows={8}
        id="c-content"
        label="Content (blank line = new paragraph)"
        value={f.content}
        onChange={(e) =>
          setF({
            ...f,
            content: e.target.value,
          })
        }
      />

      <ImageUploader
        label="Main image"
        folder="cms"
        value={f.image}
        onChange={(v) =>
          setF({
            ...f,
            image: v,
          })
        }
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="label !mb-0">List items ({f.items.length})</p>

          <button
            type="button"
            onClick={() =>
              setF({
                ...f,
                items: [
                  ...f.items,
                  {
                    title: "",
                    text: "",
                    image: "",
                  },
                ],
              })
            }
            className="btn-outline !px-3 !py-1 text-xs"
          >
            + Add item
          </button>
        </div>

        <div className="space-y-3">
          {f.items.map((it, i) => (
            <div
              key={i}
              className="grid gap-3 rounded border border-beige-dark p-3 sm:grid-cols-2"
            >
              <FormField
                id={`it-t-${i}`}
                label="Title"
                value={it.title || ""}
                onChange={(e) => setItem(i, "title", e.target.value)}
              />

              <FormField
                id={`it-x-${i}`}
                label="Text"
                value={it.text || ""}
                onChange={(e) => setItem(i, "text", e.target.value)}
              />

              <div className="sm:col-span-2">
                <ImageUploader
                  label="Image (optional)"
                  folder="cms"
                  value={it.image}
                  onChange={(v) => setItem(i, "image", v)}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setF({
                    ...f,
                    items: f.items.filter((_, j) => j !== i),
                  })
                }
                className="w-fit text-xs font-bold text-red-700 hover:underline"
              >
                Remove item
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="c-seot"
          label="SEO title"
          value={f.seoTitle}
          onChange={(e) =>
            setF({
              ...f,
              seoTitle: e.target.value,
            })
          }
        />

        <FormField
          id="c-seod"
          label="SEO description"
          value={f.seoDescription}
          onChange={(e) =>
            setF({
              ...f,
              seoDescription: e.target.value,
            })
          }
        />
      </div>

      <Toggle
        checked={f.isActive}
        onChange={(v) =>
          setF({
            ...f,
            isActive: v,
          })
        }
        label="Published"
      />

      <div>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? (
            <LoadingSpinner
              size="sm"
              className="border-white border-t-transparent"
            />
          ) : (
            "Save Content"
          )}
        </button>
      </div>
    </form>
  );
}

export function CmsPage() {
  const [tab, setTab] = useState("content");
  const [key, setKey] = useState(CMS_KEYS[0][0]);

  return (
    <div>
      <PageHeader
        title="Homepage CMS"
        subtitle="Edit page content, FAQs and testimonials"
      />

      <div className="mb-4 flex gap-2">
        {[
          ["content", "Page content"],
          ["faqs", "FAQs"],
          ["testimonials", "Testimonials"],
        ].map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${
              tab === k ? "bg-btn text-white" : "bg-white text-brand-text"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "content" && (
        <>
          <div className="mb-4 max-w-sm">
            <FormField
              as="select"
              id="cms-key"
              label="Section"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            >
              {CMS_KEYS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </FormField>
          </div>

          <CmsEditor
            key={key}
            pageKey={key}
            title={CMS_KEYS.find((c) => c[0] === key)[1]}
          />
        </>
      )}

      {tab === "faqs" && (
        <ResourceManager
          resource="faqs"
          title="FAQs"
          itemName="FAQ"
          columns={[
            {
              key: "question",
              label: "Question",
            },
            {
              key: "displayOrder",
              label: "Order",
            },
            {
              key: "isActive",
              label: "Active",
              type: "bool",
            },
          ]}
          fields={[
            {
              key: "question",
              label: "Question",
              required: true,
            },
            {
              key: "answer",
              label: "Answer",
              type: "textarea",
              required: true,
            },
            {
              key: "displayOrder",
              label: "Display order",
              type: "number",
            },
            {
              key: "isActive",
              label: "Active",
              type: "bool",
              default: true,
            },
          ]}
        />
      )}

      {tab === "testimonials" && (
        <ResourceManager
          resource="testimonials"
          title="Testimonials"
          itemName="testimonial"
          columns={[
            {
              key: "image",
              label: "Photo",
              type: "image",
            },
            {
              key: "name",
              label: "Customer",
            },
            {
              key: "message",
              label: "Message",
            },
            {
              key: "rating",
              label: "Rating",
            },
            {
              key: "isActive",
              label: "Active",
              type: "bool",
            },
          ]}
          fields={[
            {
              key: "name",
              label: "Customer name",
              required: true,
            },
            {
              key: "heading",
              label: "Heading",
            },
            {
              key: "message",
              label: "Testimonial",
              type: "textarea",
              required: true,
            },
            {
              key: "rating",
              label: "Rating (1-5)",
              type: "number",
            },
            {
              key: "displayOrder",
              label: "Display order",
              type: "number",
            },
            {
              key: "image",
              label: "Photo",
              type: "image",
              folder: "testimonials",
            },
            {
              key: "isActive",
              label: "Active",
              type: "bool",
              default: true,
            },
          ]}
        />
      )}
    </div>
  );
}

/* ---------------- Settings ---------------- */

function useSettingsForm() {
  const toast = useToast();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminApi.settings,
  });

  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.data?.settings) {
      setF(q.data.settings);
    }
  }, [q.data]);

  const save = async (e) => {
    e.preventDefault();

    if (!f) return;

    setBusy(true);

    try {
      await adminApi.saveSettings(f);

      toast.success("Settings saved");

      qc.invalidateQueries({
        queryKey: ["settings"],
      });

      qc.invalidateQueries({
        queryKey: ["admin", "settings"],
      });
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  return {
    q,
    f,
    setF,
    busy,
    save,
  };
}

/*
 * Reusable settings section.
 *
 * Important:
 * This is outside SettingsPage so React does not recreate
 * the component while you type. This helps prevent inputs
 * from losing focus / cursor position.
 */
const Sec = ({ t, children }) => {
  return (
    <section className="rounded-lg bg-white p-5 shadow-card">
      <h2 className="mb-4 font-display text-lg font-bold">{t}</h2>

      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
};

/*
 * Alias kept for the existing JSX.
 *
 * Your previous code used <SettingsSection>
 * for the Returns section while only <Sec> existed.
 */
const SettingsSection = Sec;

export function SettingsPage() {
  const { q, f, setF, busy, save } = useSettingsForm();

  if (q.isError) {
    return <ErrorState message={q.error?.userMessage} onRetry={q.refetch} />;
  }

  if (!f) {
    return <PageLoader />;
  }

  /*
   * IMPORTANT:
   * Use functional state updates.
   *
   * Instead of:
   *
   * setF({
   *   ...f,
   *   field: value
   * })
   *
   * we use:
   *
   * setF(prev => ({
   *   ...prev,
   *   field: value
   * }))
   *
   * This prevents stale state from causing input updates
   * to overwrite each other while typing.
   */
  const set = (k) => (e) => {
    const value = e?.target?.value ?? e;

    setF((prev) => ({
      ...prev,
      [k]: value,
    }));
  };

  const setBool = (k) => (value) => {
    setF((prev) => ({
      ...prev,
      [k]: value,
    }));
  };

  const soc = (k) => (e) => {
    const value = e?.target?.value ?? e;

    setF((prev) => ({
      ...prev,
      social: {
        ...(prev?.social || {}),
        [k]: value,
      },
    }));
  };

  return (
    <form onSubmit={save} className="mx-auto max-w-4xl space-y-5 pb-10">
      <PageHeader
        title="Settings"
        subtitle="Store information, returns, shipping and tax"
      />

      {/* ---------------- Returns ---------------- */}

      <SettingsSection t="Returns">
        <FormField
          id="rw"
          type="number"
          min="0"
          label="Return window (days)"
          value={f.returnWindowDays ?? ""}
          onChange={set("returnWindowDays")}
          hint="Counted from delivery date. Products can override this individually."
        />

        <div className="flex items-end">
          <Toggle
            checked={Boolean(f.returnsEnabled)}
            onChange={setBool("returnsEnabled")}
            label="Returns enabled"
          />
        </div>
      </SettingsSection>

      {/* ---------------- Shipping ---------------- */}

      <Sec t="Shipping, tax & payments">
        <FormField
          id="sf"
          type="number"
          min="0"
          label="Shipping fee (₹)"
          value={f.shippingFee ?? ""}
          onChange={set("shippingFee")}
        />

        <FormField
          id="fs"
          type="number"
          min="0"
          label="Free shipping above (₹)"
          value={f.freeShippingAbove ?? ""}
          onChange={set("freeShippingAbove")}
        />

        <FormField
          id="tx"
          type="number"
          min="0"
          step="0.1"
          label="Tax included in prices (%)"
          value={f.taxPercent ?? ""}
          onChange={set("taxPercent")}
        />

        <FormField
          id="dd"
          type="number"
          min="1"
          label="Delivery time (days)"
          value={f.deliveryDays ?? ""}
          onChange={set("deliveryDays")}
        />

        <Toggle
          checked={Boolean(f.codEnabled)}
          onChange={setBool("codEnabled")}
          label="Cash on Delivery enabled"
        />
      </Sec>

      {/* ---------------- Store ---------------- */}

      <Sec t="Store & contact information">
        <FormField
          id="st"
          label="Store name"
          value={f.storeName ?? ""}
          onChange={set("storeName")}
        />

        <FormField
          id="ph"
          label="Phone / WhatsApp (shown in footer)"
          value={f.phone ?? ""}
          onChange={set("phone")}
        />

        <FormField
          id="em"
          type="email"
          label="Support email"
          value={f.email ?? ""}
          onChange={set("email")}
        />

        <FormField
          id="sh"
          label="Support hours"
          value={f.supportHours ?? ""}
          onChange={set("supportHours")}
        />

        <div className="sm:col-span-2">
          <FormField
            as="textarea"
            rows={2}
            id="ad"
            label="Store address (used on shipping labels and Store Locator)"
            value={f.address ?? ""}
            onChange={set("address")}
          />
        </div>

        <div className="sm:col-span-2">
          <FormField
            id="nl"
            label="Newsletter text"
            value={f.newsletterText ?? ""}
            onChange={set("newsletterText")}
          />
        </div>
      </Sec>

      {/* ---------------- Social ---------------- */}

      <Sec t="Footer social links">
        {["facebook", "pinterest", "instagram", "youtube"].map((k) => (
          <FormField
            key={k}
            id={`so-${k}`}
            label={k[0].toUpperCase() + k.slice(1)}
            value={f.social?.[k] ?? ""}
            onChange={soc(k)}
            placeholder="https://"
          />
        ))}
      </Sec>

      {/* ---------------- Save ---------------- */}

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? (
          <LoadingSpinner
            size="sm"
            className="border-white border-t-transparent"
          />
        ) : (
          "Save Settings"
        )}
      </button>
    </form>
  );
}
/* ---------------- Email Settings ---------------- */

export function EmailSettingsPage() {
  const { q, f, setF, busy, save } = useSettingsForm();

  if (q.isError) {
    return <ErrorState message={q.error?.userMessage} onRetry={q.refetch} />;
  }

  if (!f) return <PageLoader />;

  const e = f.email_settings || {};

  const set = (k, v) =>
    setF({
      ...f,
      email_settings: {
        ...e,
        [k]: v,
      },
    });

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Email Settings"
        subtitle="Emails are sent through Resend (configure RESEND_API_KEY on the server)"
      />

      <section className="grid gap-4 rounded-lg bg-white p-5 shadow-card sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Toggle
            checked={e.enabled !== false}
            onChange={(v) => set("enabled", v)}
            label="Send emails"
          />
        </div>

        <FormField
          id="fn"
          label="Sender name"
          value={e.fromName || ""}
          onChange={(ev) => set("fromName", ev.target.value)}
        />

        <FormField
          id="ae"
          type="email"
          label="Admin notification email"
          value={e.adminEmail || ""}
          onChange={(ev) => set("adminEmail", ev.target.value)}
          hint="Falls back to the support email if empty"
        />

        <Toggle
          checked={e.notifyAdminNewOrder !== false}
          onChange={(v) => set("notifyAdminNewOrder", v)}
          label="Notify admin: new order"
        />

        <Toggle
          checked={e.notifyAdminReturn !== false}
          onChange={(v) => set("notifyAdminReturn", v)}
          label="Notify admin: return request"
        />

        <Toggle
          checked={e.notifyAdminContact !== false}
          onChange={(v) => set("notifyAdminContact", v)}
          label="Notify admin: contact message"
        />

        <Toggle
          checked={e.sendWelcome !== false}
          onChange={(v) => set("sendWelcome", v)}
          label="Customer: welcome email"
        />

        <Toggle
          checked={e.sendOrderEmails !== false}
          onChange={(v) => set("sendOrderEmails", v)}
          label="Customer: order & payment emails"
        />

        <Toggle
          checked={e.sendReturnEmails !== false}
          onChange={(v) => set("sendReturnEmails", v)}
          label="Customer: return & refund emails"
        />
      </section>

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? (
          <LoadingSpinner
            size="sm"
            className="border-white border-t-transparent"
          />
        ) : (
          "Save Email Settings"
        )}
      </button>
    </form>
  );
}

/* ---------------- Admin profile ---------------- */

export function AdminProfilePage() {
  const { admin } = useAuth();
  const toast = useToast();

  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });

  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (
      pw.newPassword.length < 8 ||
      !/[A-Za-z]/.test(pw.newPassword) ||
      !/\d/.test(pw.newPassword)
    ) {
      return toast.error(
        "Use at least 8 characters with a letter and a number",
      );
    }

    if (pw.newPassword !== pw.confirm) {
      return toast.error("Passwords do not match");
    }

    setBusy(true);

    try {
      await authApi.adminPassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });

      toast.success("Password updated");

      setPw({
        currentPassword: "",
        newPassword: "",
        confirm: "",
      });
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Profile" />

      <section className="mb-5 rounded-lg bg-white p-5 shadow-card">
        <p className="font-bold">{admin?.name}</p>

        <p className="text-sm text-brand-muted">
          {admin?.email} · Administrator
        </p>
      </section>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-lg bg-white p-5 shadow-card"
        noValidate
      >
        <h2 className="font-display text-lg font-bold">Change password</h2>

        <FormField
          id="ap1"
          type="password"
          label="Current password"
          autoComplete="current-password"
          value={pw.currentPassword}
          onChange={(e) =>
            setPw({
              ...pw,
              currentPassword: e.target.value,
            })
          }
        />

        <FormField
          id="ap2"
          type="password"
          label="New password"
          autoComplete="new-password"
          value={pw.newPassword}
          onChange={(e) =>
            setPw({
              ...pw,
              newPassword: e.target.value,
            })
          }
        />

        <FormField
          id="ap3"
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          value={pw.confirm}
          onChange={(e) =>
            setPw({
              ...pw,
              confirm: e.target.value,
            })
          }
        />

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? (
            <LoadingSpinner
              size="sm"
              className="border-white border-t-transparent"
            />
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </div>
  );
}
