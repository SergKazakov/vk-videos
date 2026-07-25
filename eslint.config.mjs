import config from "@skazakov/eslint-config"
import { defineConfig } from "eslint/config"

export default defineConfig([
  ...config,
  {
    files: ["public/*.js"],
    languageOptions: { globals: { document: "readonly", console: "readonly" } },
  },
])
