/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Server external packages (moved from experimental in Next.js 16)
  serverExternalPackages: ['qrcode', 'whatsapp-web.js'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react', 
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
      '@radix-ui/react-toast',
      '@tanstack/react-query',
      'date-fns',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'axios',
    ],
    optimizeCss: true, // Now enabled - critters package installed
  },
  // Using webpack explicitly (Turbopack has compatibility issues with complex webpack configs)
  // Optimize for Core Web Vitals
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Performance optimizations - optimized for dev mode
  onDemandEntries: {
    maxInactiveAge: process.env.NODE_ENV === 'development' ? 90 * 1000 : 60 * 1000, // 90 seconds in dev, 60 in prod
    pagesBufferLength: process.env.NODE_ENV === 'development' ? 10 : 5, // Keep more pages in memory for faster navigation
  },
  // Enable static page generation where possible
  // Only use standalone in production (slows down dev server)
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Optimize bundle size and dev performance
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        qrcode: false,
        canvas: false,
      };
    }
    
    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'qrcode': 'commonjs qrcode',
        'whatsapp-web.js': 'commonjs whatsapp-web.js',
        'puppeteer': 'commonjs puppeteer',
        'puppeteer-core': 'commonjs puppeteer-core',
      });
    }
    
    // Handle whatsapp-web.js internal modules that may not resolve during build
    // These are dynamically loaded at runtime by whatsapp-web.js
    const webpack = require('webpack');
    
    // Provide fallback for missing WhatsApp Web internal modules via alias
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'WAWebPollsVotesSchema': require.resolve('./lib/empty-module.js'),
    };
    
    // Also use IgnorePlugin as a fallback
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/WAWebPollsVotesSchema$/,
        contextRegExp: /whatsapp-web\.js/,
      })
    );
    
    // Optimize for development speed
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false, // Disable code splitting in dev for faster builds
      };
    } else {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  // SEO optimizations
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;



