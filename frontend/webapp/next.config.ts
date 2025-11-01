import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: false },
  images: {
    remotePatterns: [
      // { protocol: "https", hostname: "example.com" },
    ],
  },
  async rewrites() {
    // Dev コンテナ → ホストの Django(8000) へ到達させる
    // Django 側では control 配下にAPIがぶら下がるため /control/api へルーティング
    const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://host.docker.internal:8000/";
    return [
      // 末尾スラッシュ有無の両方を許容
      { source: "/api/:path*", destination: `${apiBase}control/api/:path*` },
      { source: "/api/:path*/", destination: `${apiBase}control/api/:path*/` },
    ];
  },
};

export default nextConfig;
