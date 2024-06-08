# Prisma HMR Plugin for Vite

This Vite plugin monitors changes to your Prisma schema file and ensures that the Prisma client is regenerated seamlessly, without needing to restart your development server. It automatically shuts down the Prisma binary process and regenerates the Prisma client whenever the schema is updated, providing a smooth development experience.

## Installation

To install the plugin, add it to your project dependencies:

```sh
npm i -D vite-plugin-prisma-hmr
```

```sh
yarn add -D vite-plugin-prisma-hmr
```

```sh
pnpm add -D vite-plugin-prisma-hmr
```

## Usage

To use the plugin in your Vite project, add it to your Vite configuration file (`vite.config.js` or `vite.config.ts`):

```js
import { defineConfig } from "vite";
import prismaHmrPlugin from "vite-plugin-prisma-hmr";

export default defineConfig({
  plugins: [
    prismaHmrPlugin("binary"), // Optional: specify your Prisma binary generator
  ],
});
```

## Configuration

The plugin accepts a single optional configuration parameter:

- `generator`: Name of generator that has engineType = 'binary'

It can be omitted in case it's the only generator in schema. In case you're using library mode for production you have to specify the right generator here.

## Requirements

For HMR to work with this plugin, you need to have a binary generator configured in your Prisma setup. This generator is necessary to regenerate the Prisma client when changes to the schema are detected.

Example of prisma schema

```prisma
generator library {
  provider   = "prisma-client-js"
  engineType = "library"
}

generator binary {
  provider   = "prisma-client-js"
  engineType = "binary"
}
```

## How It Works

1. The plugin listens for changes to the `prisma/schema.prisma` file.
2. When a change is detected, it kills any running Prisma binaries.
3. It regenerates the Prisma client using the specified binary generator.

## Additional steps

Update `package.json` to regenerate the right client on build / start of dev server

```json
{
  "dev": "pnpm generate:bin && vite",
  "build": "pnpm generate:lib && vite build",
  "generate:lib": "prisma generate --generator library",
  "generate:bin": "prisma generate --generator binary"
}
```
