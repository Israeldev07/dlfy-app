import { TONE_DOT, TONE_TEXT, type Tone } from "@/modules/admin/copy";

/** Punto + etiqueta. El color nunca va solo: la etiqueta siempre lo acompaña. */
export function StatusLabel({ label, tone, className = "" }: { label: string; tone: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13.5px] font-semibold whitespace-nowrap ${TONE_TEXT[tone]} ${className}`}>
      <span aria-hidden className={`size-2 flex-none rounded-full ${TONE_DOT[tone]}`} />
      {label}
    </span>
  );
}
