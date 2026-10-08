/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

// Hostname хранилища Supabase берём из переменной окружения,
// чтобы не хранить его захардкоженным в коде.
function buildRemotePatterns() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;

  /** @type {Array<{ protocol: "https"; hostname: string; port: string; pathname: string }>} */
  const patterns = [
    // 1. Google аватарки
    { protocol: "https", hostname: "lh3.googleusercontent.com", port: "", pathname: "/**" },
    // Логотип платёжного сервиса «Экспресс Платежи»
    { protocol: "https", hostname: "express-pay.by", port: "", pathname: "/brandbook/**" },
  ];

  // Хранилище картинок Supabase (hostname из SUPABASE_URL)
  if (supabaseHost) {
    patterns.push({
      protocol: "https",
      hostname: supabaseHost,
      port: "",
      pathname: "/storage/v1/object/public/**",
    });
  }

  return patterns;
}

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: buildRemotePatterns(),
  },
  // Отключи кэш в разработке (чтобы избежать проблем с кешированием)
  generateEtags: process.env.NODE_ENV === "development" ? false : true,
  // Один канонический адрес: любой заход через www редиректит на https://radius-stay.by,
  // чтобы Google не считал www.radius-stay.by и radius-stay.by двумя разными сайтами.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.radius-stay.by" }],
        destination: "https://radius-stay.by/:path*",
        permanent: true,
      },
    ];
  },
};

export default config;
