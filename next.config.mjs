/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true,
        locale: false
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://attendance-next-js-git-dev-kodrats-projects.vercel.app/api/:path*", // Ganti dengan URL backend
      },
    ];
  },
}

export default nextConfig
