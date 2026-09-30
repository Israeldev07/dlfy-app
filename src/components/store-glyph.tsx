/** Pictograma de tienda del diseño Dfly Home v2 (se pinta con currentColor; usar text-store). */
export function StoreGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="6.6" y="2.9" width="10.8" height="3.3" rx="1.3" />
      <path d="M3.4 11.7 L4.15 7.8 A1.9 1.9 0 0 1 6 6.2 H18 A1.9 1.9 0 0 1 19.85 7.8 L20.6 11.7" />
      <path d="M3.4 11.7 a2.15 2.15 0 0 0 4.3 0 a2.15 2.15 0 0 0 4.3 0 a2.15 2.15 0 0 0 4.3 0 a2.15 2.15 0 0 0 4.3 0" />
      <path d="M7.7 11.7 L8.2 6.3" />
      <path d="M12 11.7 V6.3" />
      <path d="M16.3 11.7 L15.8 6.3" />
      <path d="M5.7 13.85 V20.2" />
      <path d="M18.3 13.85 V20.2" />
      <path d="M9.8 20.2 v-3.5 a1.6 1.6 0 0 1 1.6-1.6 h1.2 a1.6 1.6 0 0 1 1.6 1.6 v3.5" />
      <path d="M3.2 20.2 H20.8" />
    </svg>
  );
}
