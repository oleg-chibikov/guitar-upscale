// STATIC_EXPORT builds the GitHub Pages copy. It needs auth off and no src/pages/api.
const isStaticExport = process.env.STATIC_EXPORT === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // not needed since we don't use next image. We don't use it to make sure image traffic doesn't count to vercel limits
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "cdn.statically.io",
  //       port: "",
  //       pathname: "/gh/oleg-chibikov/guitar-upscale-assets/main/**",
  //     },
  //   ],
  // },
  ...(isStaticExport && { output: "export", trailingSlash: true }),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
};

export default nextConfig;
