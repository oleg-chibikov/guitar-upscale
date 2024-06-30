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
  // distDir: "dist",
  // output: "export",
  // trailingSlash: true,
};

export default nextConfig;
