import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import { CartBar } from "@/components/cart/cart-bar";
import { CartHydrator } from "@/components/cart/cart-hydrator";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dfly · Delivery en Otavalo",
    template: "%s · Dfly",
  },
  description:
    "Restaurantes, víveres, farmacia y encomiendas de Otavalo en un solo lugar. Pide y te lo llevamos.",
};

export const viewport: Viewport = {
  themeColor: "#F2F2F2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-EC" className={`${archivo.variable} ${archivoBlack.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <CartHydrator />
        <CartBar />
      </body>
    </html>
  );
}
