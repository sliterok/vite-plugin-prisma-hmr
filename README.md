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
  plugins: [prismaHmrPlugin("binary", true)],
});
```

## Configuration

The plugin accepts the following optional configuration parameters:

- `generator`: Name of the generator that has `engineType = 'binary'`. It can be omitted if it's the only generator in the schema.
- `refresh`: Boolean flag to enable invalidation of files that import `@prisma/client`. Default is `false`.

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
4. If `refresh` is enabled, it invalidates all of the files that import `@prisma/client` package.

### Refresh

Usually refresh isn't required but for one specific use case in [typia](https://typia.io/docs/utilization/prisma/) you need it to be able to transform the code on changes in Comment Tags.

## Additional steps

Update `package.json` to regenerate the right client on build / start of dev server.

```json
{
  "dev": "pnpm generate:bin && vite",
  "build": "pnpm generate:lib && vite build",
  "generate:lib": "prisma generate --generator library",
  "generate:bin": "prisma generate --generator binary"
}
```

Disable typia cache because it uses source and id as key and neither change when prisma schema is changed.

```js
export default defineConfig({
  plugins: [
    UnpluginTypia({
      cache: {
        enable: false,
      },
    }),
    prismaHmrPlugin("binary", true),
  ],
});
```
