import { useState } from 'react';
import { FALLBACK_IMG } from '../../utils/format.js';

/** Lazy image that swaps to the brand placeholder if the source fails. */
export default function SafeImage({ src, alt, className = '', eager = false, ...rest }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed || !src ? FALLBACK_IMG : src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`${className} ${failed ? 'bg-beige object-contain p-6 opacity-70' : ''}`}
      {...rest}
    />
  );
}
