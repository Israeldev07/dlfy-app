import type { NextConfig } from "next";

// Fotos de comercios y productos en Supabase Storage (ver src/lib/storage.ts).
const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fotos de hasta 4 MB (src/lib/storage.ts) más el margen del multipart.
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
