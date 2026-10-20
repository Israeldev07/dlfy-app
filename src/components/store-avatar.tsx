import Image from "next/image";
import { StoreGlyph } from "@/components/store-glyph";

/** Foto del comercio o, si aún no tiene, el ícono de tienda sobre el fondo neutro. */
export function StoreAvatar({
  imageUrl,
  px,
  className,
  glyphClassName,
}: {
  imageUrl: string | null;
  /** Lado mayor en píxeles, para pedir la imagen al tamaño justo. */
  px: number;
  className: string;
  glyphClassName: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={px}
        height={px}
        sizes={`${px}px`}
        className={`flex-none rounded-xl object-cover ring-1 ring-line ${className}`}
      />
    );
  }
  return (
    <span className={`flex flex-none items-center justify-center rounded-xl bg-muted text-store ${className}`}>
      <StoreGlyph className={glyphClassName} />
    </span>
  );
}
