import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los errores de tipos rompen el build. El lint se corre aparte (`npm run lint`).
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
