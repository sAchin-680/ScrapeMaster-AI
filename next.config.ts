// next.config.ts
module.exports = {
  experimental: {
    serverActions: {}, // Ensure this is an object
  },
  serverExternalPackages: ['your-package-name'], // Move the key here
};