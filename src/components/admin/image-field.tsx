"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Trash2, Undo2 } from "lucide-react";

/**
 * Foto con vista previa. Envía `image` (archivo nuevo) y `removeImage` ("on" para quitar la actual).
 * La vista previa es local: la foto se sube recién al guardar el formulario.
 */
export function ImageField({
  label,
  currentUrl,
  error,
  hint = "JPG, PNG o WebP de hasta 4 MB. Mejor cuadrada.",
}: {
  label: string;
  currentUrl: string | null;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [tooBig, setTooBig] = useState(false);
  const [lostPick, setLostPick] = useState(false);

  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  // React resetea el formulario cuando la acción devuelve errores: el archivo elegido se vacía
  // y no se puede restaurar, así que se quita la vista previa y se pide elegirlo de nuevo.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!preview || !form) return;
    const onReset = () => {
      setPreview(null);
      setLostPick(true);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [preview]);

  const shown = preview ?? (removed ? null : currentUrl);
  const message = tooBig
    ? "La foto pesa más de 4 MB. Usa una más liviana."
    : (error ?? (lostPick ? "Vuelve a elegir la foto antes de guardar." : undefined));

  function onPick(file: File | undefined) {
    setTooBig(false);
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setTooBig(true);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
    setRemoved(false);
    setLostPick(false);
  }

  function clearPick() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-[14px] font-semibold text-ink">
        {label}
      </span>
      <div className="flex items-center gap-4">
        <label
          htmlFor={id}
          className={`group relative flex size-24 flex-none cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 transition-shadow duration-150 has-focus-visible:ring-2 has-focus-visible:ring-route-deep ${
            message ? "ring-2 ring-brand" : "ring-ink/20 hover:ring-ink/40"
          }`}
        >
          {shown ? (
            // Vista previa local (blob:) o la foto ya guardada: no pasa por el optimizador de imágenes.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus aria-hidden className="size-8 text-ink/45 transition-colors duration-150 group-hover:text-ink/70" strokeWidth={1.75} />
          )}
          <input
            ref={inputRef}
            id={id}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-msg`}
            aria-invalid={message ? true : undefined}
            onChange={(e) => onPick(e.target.files?.[0])}
            className="sr-only"
          />
        </label>
        <div className="flex flex-col items-start gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="min-h-10 rounded-control px-3 text-[14px] font-semibold text-ink ring-1 ring-ink/15 transition-colors duration-150 hover:bg-ink/[0.05]"
          >
            {shown ? "Cambiar foto" : "Subir foto"}
          </button>
          {preview ? (
            <button
              type="button"
              onClick={clearPick}
              className="inline-flex min-h-10 items-center gap-1.5 px-1 text-[14px] font-medium text-ink-soft hover:text-ink"
            >
              <Undo2 aria-hidden className="size-4" strokeWidth={2} />
              Descartar la nueva
            </button>
          ) : currentUrl && !removed ? (
            <button
              type="button"
              onClick={() => setRemoved(true)}
              className="inline-flex min-h-10 items-center gap-1.5 px-1 text-[14px] font-medium text-brand hover:text-brand-deep"
            >
              <Trash2 aria-hidden className="size-4" strokeWidth={2} />
              Quitar foto
            </button>
          ) : removed ? (
            <button
              type="button"
              onClick={() => setRemoved(false)}
              className="inline-flex min-h-10 items-center gap-1.5 px-1 text-[14px] font-medium text-ink-soft hover:text-ink"
            >
              <Undo2 aria-hidden className="size-4" strokeWidth={2} />
              Mantener la foto
            </button>
          ) : null}
        </div>
      </div>
      {removed && !preview ? <input type="hidden" name="removeImage" value="on" /> : null}
      <p id={`${id}-msg`} className={message ? "text-[13.5px] font-medium text-brand-deep" : "text-[13px] text-ink-soft"}>
        {message ?? (removed && !preview ? "La foto se quitará al guardar." : hint)}
      </p>
    </div>
  );
}
