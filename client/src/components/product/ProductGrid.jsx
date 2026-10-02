import ProductCard from './ProductCard.jsx';
import { ProductCardSkeleton } from '../common/Feedback.jsx';

export default function ProductGrid({ products, loading, skeletons = 8, cols = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' }) {
  return (
    <div className={`grid gap-x-3 gap-y-5 sm:gap-x-3.5 sm:gap-y-6 ${cols}`}>
      {loading
        ? Array.from({ length: skeletons }).map((_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p, i) => <ProductCard key={p._id} product={p} priority={i < 4} />)}
    </div>
  );
}
