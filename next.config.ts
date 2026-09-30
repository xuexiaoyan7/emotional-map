import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local development only: lets a phone on this trusted Wi-Fi load Next dev assets.
  allowedDevOrigins: ["192.168.0.106", "127.0.0.1", "localhost"],
  // Local fallback uploads are served only by the development route. They must
  // never be traced into the Netlify server function; production media uses
  // the private Supabase bucket instead.
  outputFileTracingExcludes: {
    "/*": ["./.local-uploads/**/*"],
  },
};

export default nextConfig;
