const nextConfig = {
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "pg"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
