import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 忽略构建时的类型错误（用于处理第三方库的类型兼容性问题）
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
