import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    plugins: {
      // import プラグインは Next の設定側で定義済み。二重登録を避ける。
      "unused-imports": (await import("eslint-plugin-unused-imports")).default ?? (await import("eslint-plugin-unused-imports")),
      perfectionist: (await import("eslint-plugin-perfectionist")).default ?? (await import("eslint-plugin-perfectionist")),
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // インポートはグループごと＋空行で分離、各グループ内をアルファベット順
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: [
            ["builtin"],
            ["external"],
            ["internal"],
            ["parent", "sibling", "index"],
          ],
          "newlines-between": "always",
          pathGroups: [{ pattern: "@/**", group: "internal", position: "after" }],
          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["fs", "crypto", "child_process", "os", "path"],
              message:
                "Server 専用モジュールは Client Component から import しないでください。",
            },
          ],
        },
      ],
    },
  },
  // 設定ファイル群は Node API を利用するため制限を緩める
  {
    files: [
      "eslint.config.mjs",
      "next.config.*",
      "postcss.config.*",
      "tailwind.config.*",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];

export default eslintConfig;
