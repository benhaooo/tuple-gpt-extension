import { defineConfig } from '@twind/core'
import presetAutoprefix from '@twind/preset-autoprefix'
import presetTailwind from '@twind/preset-tailwind'
import presetTypography from '@twind/preset-typography'

/**
 * --------------------------------------------------------------------------
 *                            TWIND CONFIGURATION
 * --------------------------------------------------------------------------
 *
 * This file configures Twind, our CSS-in-JS utility-first library.
 * It maps the CSS variables defined in `src/constants/themes.ts` to Tailwind-like utility classes.
 *
 * @see /src/constants/themes.ts - For the actual color value definitions.
 *
 * ## How to extend:
 * 1. Ensure the color is first defined in `src/constants/themes.ts`.
 * 2. Add the new color to the `theme.extend.colors` object below.
 *    - The key should be the desired utility class name (e.g., 'my-new-color').
 *    - The value should reference the CSS variable using `hsl(var(--my-new-color))`.
 *    - For colors with a corresponding foreground variant, group them in an object
 *      (e.g., `primary: { DEFAULT: 'hsl(...)', foreground: 'hsl(...)' }`).
 */
export default defineConfig({
  presets: [
    presetAutoprefix(), 
    presetTailwind(),
    presetTypography({
      // 使用默认配置，typography插件会自动使用我们的主题颜色
      className: 'prose', // 默认类名
    })
  ],
  hash: false,
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          soft: 'hsl(var(--primary-soft))',
          'soft-foreground': 'hsl(var(--primary-soft-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          soft: 'hsl(var(--secondary-soft))',
          'soft-foreground': 'hsl(var(--secondary-soft-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          soft: 'hsl(var(--accent-soft))',
          'soft-foreground': 'hsl(var(--accent-soft-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // --- Legacy Name Mapping ---
        // These are kept for backward compatibility with older components.
        // New components should prefer the semantic names above (e.g., use `bg-card` instead of `bg-surface`).
        'surface': 'hsl(var(--card))',
        'text-primary': 'hsl(var(--foreground))',
        'text-secondary': 'hsl(var(--muted-foreground))',
      },
    },
  },
}) 