import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 서버에 폰/다른 기기에서 내부 IP(192.168.x.x 등)로 접속 허용
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
