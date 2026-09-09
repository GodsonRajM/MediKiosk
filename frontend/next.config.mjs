/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === "true" || (process.env.NODE_ENV === "production" && process.env.NEXT_EXPORT !== "false");

const nextConfig = {
  reactStrictMode: true,
  ...(isExport ? { output: "export" } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
