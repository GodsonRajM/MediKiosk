/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === "true" || (process.env.NODE_ENV === "production" && process.env.NEXT_EXPORT !== "false");

const nextConfig = {
  reactStrictMode: true,
  ...(isExport ? { output: "export" } : {}),
  // trailingSlash must only be enabled during static production exports, never in next dev
  trailingSlash: process.env.NODE_ENV === "production" && isExport,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

