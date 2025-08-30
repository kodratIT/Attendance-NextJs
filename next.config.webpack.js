/** @type {import('next').NextConfig} */
const nextConfigTurbo = {
  // Performance optimizations for Turbopack
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material', 
      'react-use',
      'lodash',
      'axios',
      'date-fns'
    ],
    // Enable parallel processing
    cpus: Math.max(1, (require('os').cpus() || []).length - 1),
  },
  
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  
  // Optimize builds
  swcMinify: true,
  reactStrictMode: false, // Disable strict mode to reduce double renders in dev
  
  // Note: compiler.removeConsole is not supported in Turbopack
  // It will be automatically handled in production builds
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Note: webpack customizations are not available in Turbopack
  // Turbopack handles module resolution automatically
  
  // Output file tracing
  output: 'standalone',
  
  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
}

module.exports = nextConfigTurbo
