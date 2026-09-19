import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface SearchOverlayProps { open: boolean; onClose: () => void }
const destinations = ["compete", "tournaments", "players", "teams", "community"] as const;

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => destinations.filter((key) => t(`nav.links.${key}`).toLowerCase().includes(query.toLowerCase())), [query, t]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", keydown); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="search-overlay" role="dialog" aria-modal="true" aria-label={t("search.title")}>
    <div className="search-top"><span>PEAKGG / {t("search.title")}</span><button type="button" onClick={onClose} aria-label={t("common.close")}>×</button></div>
    <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search.placeholder")} aria-label={t("search.title")} />
    <nav>{results.map((key, index) => <a key={key} href={`#${key}`} onClick={onClose}><span>0{index + 1}</span>{t(`nav.links.${key}`)}<b>↗</b></a>)}</nav>
    {!results.length && <p>{t("search.empty")}</p>}
  </div>;
}