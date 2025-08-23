/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "tesseract.js-core": "tesseract.js-core/tesseract-core.wasm.js"
    }
    return config
  }
}

module.exports = nextConfig
