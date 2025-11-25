import { useEffect, useState } from "react";

export function qs(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null && String(v).length)
      search.set(k, String(v));
  return search.toString();
}

export function useDebounce<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

