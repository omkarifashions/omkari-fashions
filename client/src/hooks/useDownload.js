import { useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { downloadBlob } from '../utils/format.js';

export default function useDownload() {
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const run = async (key, fn, filename) => {
    setBusy(key);
    try {
      const res = await fn();
      downloadBlob(res.data, filename);
    } catch (e) {
      toast.error(e.userMessage || 'Download failed');
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}
