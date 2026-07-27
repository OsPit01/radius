/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      // 1. Google аватарки
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      // Если будешь использовать другие хосты для картинок, добавляй сюда
      {
        protocol: "https",
        hostname: "feqiuipwtrbksobfbeda.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Отключи кэш в разработке (чтобы избежать проблем с кешированием)
  generateEtags: process.env.NODE_ENV === "development" ? false : true,
};

export default config;
