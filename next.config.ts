import type { NextConfig } from "next";
// NEXT_DIST_DIR lets a check build run without clobbering a running dev server's .next.
const nextConfig: NextConfig = { reactStrictMode: true, distDir: process.env.NEXT_DIST_DIR || ".next" };
export default nextConfig;
