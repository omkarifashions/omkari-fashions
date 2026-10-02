import { useCallback, useState } from 'react';

const KEY = 'omkari_recent';
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

export default function useRecentlyViewed() {
  const [ids, setIds] = useState(read);
  const push = useCallback((id) => {
    const next = [id, ...read().filter((x) => x !== id)].slice(0, 8);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
    setIds(next);
  }, []);
  return { ids, push };
}
