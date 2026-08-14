import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: "tsconfig.build.json",
  },
  experimental: {
    // The enrollment form accepts a headshot up to 8MB and sends it inline as a
    // base64 data URL, which inflates it by ~4/3 to roughly 10.7MB. Server
    // Actions cap request bodies at 1MB by default, so every application with a
    // real photo attached failed to submit — one of the two causes of the
    // client-reported "clicked submit and nothing happened" bug (08/08 round).
    // Headroom on top of 10.7MB covers the rest of the form fields.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
