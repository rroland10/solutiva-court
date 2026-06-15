import path from "node:path";
import type { NextConfig } from "next";

const monorepoRoot = path.resolve(__dirname, "../..");
const hoistedNodeModules = path.join(monorepoRoot, "node_modules");
const localNodeModules = path.resolve(__dirname, "node_modules");

function reactAliases() {
  const react = path.join(hoistedNodeModules, "react");
  const reactDom = path.join(hoistedNodeModules, "react-dom");

  return {
    react,
    "react-dom": reactDom,
    "react/jsx-runtime": path.join(react, "jsx-runtime.js"),
    "react/jsx-dev-runtime": path.join(react, "jsx-dev-runtime.js"),
    "next/dist/compiled/react": react,
    "next/dist/compiled/react-dom": reactDom,
  };
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config, { isServer, dev }) => {
    config.resolve ??= {};
    config.resolve.modules = [localNodeModules, hoistedNodeModules, "node_modules"];
    config.resolve.symlinks = true;

    // Client bundles only: one React instance. Server keeps Next's compiled React.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        ...reactAliases(),
      };
    }

    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        followSymlinks: true,
        ignored: ["**/.git/**", "**/.next/**"],
      };
    }

    return config;
  },
};

export default nextConfig;
