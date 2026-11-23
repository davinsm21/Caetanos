const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl) : undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [supabaseOrigin
      ? { protocol: supabaseOrigin.protocol.slice(0, -1), hostname: supabaseOrigin.hostname, pathname: "/storage/v1/object/public/**" }
      : { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
