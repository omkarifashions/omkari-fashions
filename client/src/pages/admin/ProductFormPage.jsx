import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../api/services.js";
import { useToast } from "../../context/ToastContext.jsx";
import FormField from "../../components/common/FormField.jsx";
import {
  ErrorState,
  LoadingSpinner,
  PageLoader,
} from "../../components/common/Feedback.jsx";
import {
  ImageUploader,
  PageHeader,
  Toggle,
} from "../../components/admin/AdminUI.jsx";

const EMPTY = {
  name: "",
  sku: "",
  category: "",
  collections: [],
  subcategory: "",
  price: "",
  salePrice: "",
  stock: "",
  shortDescription: "",
  description: "",
  craftsmanship: "",
  occasion: "",
  colors: "",
  metalType: "",
  stoneType: "",
  stoneColor: "",
  tags: "",
  isBestseller: false,
  isNewArrival: false,
  isActive: true,
  isReturnable: true,
  returnWindowDays: "",
  images: [],
  specifications: {
    size: "",
    colour: "",
    designNo: "",
    baseMetal: "",
    countryOfOrigin: "India",
    brand: "Omkari Fashions",
  },
};

const Section = ({ title, children }) => (
  <section className="rounded-lg bg-white p-5 shadow-card">
    <h2 className="mb-4 font-display text-lg font-bold text-brand-heading">
      {title}
    </h2>
    {children}
  </section>
);

export default function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const cats = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminApi.list("categories"),
  });
  const cols = useQuery({
    queryKey: ["admin", "collections"],
    queryFn: () => adminApi.list("collections"),
  });
  const prod = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => adminApi.getOne("products", id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (!prod.data) return;

    // Handle different possible API response shapes
    const p =
      prod.data?.product || prod.data?.item || prod.data?.data || prod.data;

    if (!p || !p._id) return;

    setF({
      ...EMPTY,

      ...p,

      name: p.name ?? "",
      sku: p.sku ?? "",

      category:
        typeof p.category === "object"
          ? p.category?._id || ""
          : p.category || "",

      collections: Array.isArray(p.collections)
        ? p.collections.map((c) => (typeof c === "object" ? c?._id : c))
        : [],

      subcategory: p.subcategory ?? "",

      price: p.price ?? "",
      salePrice:
        p.salePrice === null || p.salePrice === undefined ? "" : p.salePrice,

      stock: p.stock ?? "",

      shortDescription: p.shortDescription ?? "",
      description: p.description ?? "",
      craftsmanship: p.craftsmanship ?? "",

      occasion: Array.isArray(p.occasion)
        ? p.occasion.join(", ")
        : (p.occasion ?? ""),

      colors: Array.isArray(p.colors) ? p.colors.join(", ") : (p.colors ?? ""),

      metalType: p.metalType ?? "",
      stoneType: p.stoneType ?? "",
      stoneColor: p.stoneColor ?? "",

      tags: Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags ?? ""),

      isBestseller: Boolean(p.isBestseller),
      isNewArrival: Boolean(p.isNewArrival),
      isActive: p.isActive !== false,
      isReturnable: p.isReturnable !== false,

      returnWindowDays:
        p.returnWindowDays === null || p.returnWindowDays === undefined
          ? ""
          : p.returnWindowDays,

      images: Array.isArray(p.images) ? p.images : [],

      specifications: {
        ...EMPTY.specifications,
        ...(p.specifications || {}),
      },
    });
  }, [prod.data]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setSpec = (k) => (e) =>
    setF((x) => ({
      ...x,
      specifications: { ...x.specifications, [k]: e.target.value },
    }));
  const selectedCat = (cats.data?.items || []).find(
    (c) => c._id === f.category,
  );

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 3) er.name = "Enter a product name";
    if (!f.sku.trim()) er.sku = "SKU is required";
    if (!f.category) er.category = "Select a category";
    if (f.price === "" || Number(f.price) <= 0)
      er.price = "Enter a valid price";
    if (f.salePrice !== "" && Number(f.salePrice) >= Number(f.price))
      er.salePrice = "Sale price must be lower than price";
    if (f.stock === "" || Number(f.stock) < 0)
      er.stock = "Enter stock quantity";
    if (f.returnWindowDays !== "" && Number(f.returnWindowDays) < 0)
      er.returnWindowDays = "Invalid number of days";
    setErrors(er);
    if (Object.keys(er).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setBusy(true);
    try {
      const body = {
        ...f,
        price: Number(f.price),
        salePrice: f.salePrice === "" ? 0 : Number(f.salePrice),
        stock: Number(f.stock),
        returnWindowDays:
          f.returnWindowDays === "" ? null : Number(f.returnWindowDays),
      };
      if (isNew) await adminApi.create("products", body);
      else await adminApi.update("products", id, body);
      toast.success(
        isNew ? "Product created successfully" : "Product updated successfully",
      );
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["home"] });
      navigate("/admin/products");
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  if (!isNew && prod.isLoading) return <PageLoader />;
  if (!isNew && prod.isError)
    return (
      <ErrorState message={prod.error?.userMessage} onRetry={prod.refetch} />
    );

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto max-w-4xl space-y-5 pb-16"
    >
      <PageHeader title={isNew ? "Add Product" : "Edit Product"}>
        <Link to="/admin/products" className="btn-outline !py-2">
          ← Back
        </Link>
      </PageHeader>

      <Section title="Basic information">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              id="p-name"
              label="Product name"
              value={f.name}
              onChange={set("name")}
              error={errors.name}
            />
          </div>
          <FormField
            id="p-sku"
            label="SKU"
            value={f.sku}
            onChange={set("sku")}
            error={errors.sku}
          />
          <FormField
            as="select"
            id="p-cat"
            label="Category"
            value={f.category}
            onChange={(e) =>
              setF((x) => ({ ...x, category: e.target.value, subcategory: "" }))
            }
            error={errors.category}
          >
            <option value="">Select category</option>
            {(cats.data?.items || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </FormField>
          <FormField
            id="p-sub"
            label="Style / Subcategory"
            list="subs"
            value={f.subcategory}
            onChange={set("subcategory")}
            hint="Pick a suggestion or type a new one"
          />
          <datalist id="subs">
            {(selectedCat?.subcategories || []).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <div className="sm:col-span-2">
            <FormField
              id="p-short"
              label="Short description"
              value={f.shortDescription}
              onChange={set("shortDescription")}
              maxLength={200}
            />
          </div>
          <div className="sm:col-span-2">
            <FormField
              as="textarea"
              rows={5}
              id="p-desc"
              label="Description"
              value={f.description}
              onChange={set("description")}
            />
          </div>
        </div>
      </Section>

      <Section title="Pricing & stock">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="p-price"
            type="number"
            min="0"
            label="Price / MRP (₹)"
            value={f.price}
            onChange={set("price")}
            error={errors.price}
          />
          <FormField
            id="p-sale"
            type="number"
            min="0"
            label="Sale price (₹)"
            value={f.salePrice}
            onChange={set("salePrice")}
            error={errors.salePrice}
            hint="Leave empty for no discount"
          />
          <FormField
            id="p-stock"
            type="number"
            min="0"
            label="Stock"
            value={f.stock}
            onChange={set("stock")}
            error={errors.stock}
          />
        </div>
      </Section>

      <Section title="Images">
        <ImageUploader
          multiple
          folder="products"
          label="Product images (first image is the main image)"
          value={f.images}
          onChange={(v) => setF((x) => ({ ...x, images: v }))}
        />
      </Section>

      <Section title="Attributes">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="p-craft"
            label="Craftsmanship"
            value={f.craftsmanship}
            onChange={set("craftsmanship")}
            placeholder="Temple, Kundan, Jadau…"
          />
          <FormField
            id="p-metal"
            label="Metal type"
            value={f.metalType}
            onChange={set("metalType")}
            placeholder="Gold Plated"
          />
          <FormField
            id="p-stone"
            label="Stone type"
            value={f.stoneType}
            onChange={set("stoneType")}
            placeholder="Ruby, Emerald, Kundan…"
          />
          <FormField
            id="p-stonec"
            label="Stone colour"
            value={f.stoneColor}
            onChange={set("stoneColor")}
          />
          <FormField
            id="p-occ"
            label="Occasion"
            value={f.occasion}
            onChange={set("occasion")}
            hint="Comma separated: Wedding, Festive"
          />
          <FormField
            id="p-colors"
            label="Colors"
            value={f.colors}
            onChange={set("colors")}
            hint="Comma separated: Gold, Red"
          />
          <div className="sm:col-span-2">
            <FormField
              id="p-tags"
              label="Search tags"
              value={f.tags}
              onChange={set("tags")}
              hint="Comma separated keywords"
            />
          </div>
          <div className="sm:col-span-2">
            <p className="label">Collections</p>
            <div className="flex flex-wrap gap-3">
              {(cols.data?.items || []).map((c) => (
                <label
                  key={c._id}
                  className="flex items-center gap-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#A84300]"
                    checked={f.collections.includes(c._id)}
                    onChange={(e) =>
                      setF((x) => ({
                        ...x,
                        collections: e.target.checked
                          ? [...x.collections, c._id]
                          : x.collections.filter((i) => i !== c._id),
                      }))
                    }
                  />
                  {c.title}
                </label>
              ))}
              {!cols.data?.items?.length && (
                <span className="text-sm text-brand-muted">
                  No collections created yet
                </span>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Specifications">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="s-size"
            label="Size (cm)"
            value={f.specifications.size}
            onChange={setSpec("size")}
          />
          <FormField
            id="s-colour"
            label="Colour"
            value={f.specifications.colour}
            onChange={setSpec("colour")}
          />
          <FormField
            id="s-design"
            label="Design No"
            value={f.specifications.designNo}
            onChange={setSpec("designNo")}
          />
          <FormField
            id="s-base"
            label="Base metal"
            value={f.specifications.baseMetal}
            onChange={setSpec("baseMetal")}
          />
          <FormField
            id="s-origin"
            label="Country of origin"
            value={f.specifications.countryOfOrigin}
            onChange={setSpec("countryOfOrigin")}
          />
          <FormField
            id="s-brand"
            label="Brand"
            value={f.specifications.brand}
            onChange={setSpec("brand")}
          />
        </div>
      </Section>

      <Section title="Visibility & returns">
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle
            checked={f.isActive}
            onChange={(v) => setF((x) => ({ ...x, isActive: v }))}
            label="Active (visible in store)"
          />
          <Toggle
            checked={f.isBestseller}
            onChange={(v) => setF((x) => ({ ...x, isBestseller: v }))}
            label="Bestseller"
          />
          <Toggle
            checked={f.isNewArrival}
            onChange={(v) => setF((x) => ({ ...x, isNewArrival: v }))}
            label="New arrival"
          />
          <Toggle
            checked={f.isReturnable}
            onChange={(v) => setF((x) => ({ ...x, isReturnable: v }))}
            label="Returnable"
          />
          {f.isReturnable && (
            <FormField
              id="p-rw"
              type="number"
              min="0"
              label="Return window (days)"
              value={f.returnWindowDays}
              onChange={set("returnWindowDays")}
              error={errors.returnWindowDays}
              hint="Leave empty to use the store-wide return window"
            />
          )}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-beige-dark bg-[#f6ede6]/95 px-4 py-3 sm:-mx-6 sm:px-6">
        <Link
          to="/admin/products"
          className="rounded-[4px] border border-brand-muted/50 px-5 py-2.5 font-bold"
        >
          Cancel
        </Link>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? (
            <>
              <LoadingSpinner
                size="sm"
                className="border-white border-t-transparent"
              />{" "}
              {isNew ? "Saving…" : "Updating…"}
            </>
          ) : isNew ? (
            "Create Product"
          ) : (
            "Update Product"
          )}
        </button>
      </div>
    </form>
  );
}
