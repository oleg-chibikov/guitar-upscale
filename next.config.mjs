/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.statically.io",
        port: "",
        pathname: "/gh/oleg-chibikov/guitar-upscale-assets/main/**",
      },
    ],
  },
  // distDir: "dist",
  // output: "export",
  // trailingSlash: true,
};

export default nextConfig;
