## unplugin-jsx-if

在 react 项目中使用 vue 的 v-if 语法 🍬

### [demo](./playground/src/pages/index.tsx)

## Install

```bash
npm i unplugin-jsx-if -d
```

## Usage

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginJsxSugarIf from 'unplugin-jsx-if/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vitePluginJsxSugarIf({ prefix: 'v' /* 可以是任意的, 会检测 xx-if xxx-else-if xxx-else */ })],
})
```

## :coffee:

[buy me a cup of coffee](https://github.com/Simon-He95/sponsor)

## License

[MIT](./license)

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/Simon-He95/sponsor/sponsors.svg">
    <img src="https://cdn.jsdelivr.net/gh/Simon-He95/sponsor/sponsors.png"/>
  </a>
</p>
