import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-etoro)', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-etoro-numbers)', 'var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        goodgreen: {
          DEFAULT: '#13C636',
          50: '#ECFFF0',
          100: '#CFFFD9',
          200: '#9EFFB3',
          300: '#6DFF8A',
          400: '#35E95A',
          500: '#13C636',
          600: '#0FA82D',
          700: '#0B8024',
          800: '#075434',
          900: '#04351F',
        },
        // Brand accent alias — ProductClaw/eToro official green. Without
        // this key the text-accent / bg-accent / border-accent / ring-accent
        // utilities (and slash-opacity variants) silently fall through to
        // currentColor / transparent across the proof page.
        accent: '#13C636',
        gray: {
          400: '#a1a1aa', // Improved contrast for secondary text on dark backgrounds (4.8:1)
          500: '#d1d5db', // Better contrast for normal text on dark backgrounds (7.5:1)
          600: '#9ca3af', // Previous gray-500, now gray-600 for lighter usage
        },
        dark: {
          DEFAULT: '#10110E',
          50: '#1C1E16',
          100: '#15170F',
          200: '#12140E',
          300: '#10110E',
          400: '#0A0A0A',
          500: '#050505',
        },
        etoro: {
          afterhours: '#10110E',
          void: '#0A0A0A',
          carbon: '#15170F',
          graphite: '#1C1E16',
          intelligence: '#ECEAD1',
          signal: '#6DFF8A',
          collective: '#075434',
          green: '#13C636',
          red: '#E31937',
        },
        // CSS-variable-driven tokens (for theming)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: '0 1px 2px 0 hsl(var(--shadow))',
        DEFAULT: '0 1px 3px 0 hsl(var(--shadow)), 0 1px 2px -1px hsl(var(--shadow))',
        md: '0 4px 6px -1px hsl(var(--shadow)), 0 2px 4px -2px hsl(var(--shadow))',
        lg: '0 10px 15px -3px hsl(var(--shadow)), 0 4px 6px -4px hsl(var(--shadow))',
        glow: '0 0 20px 4px hsl(var(--ring) / 0.25)',
      },
    },
  },
  plugins: [],
}
export default config
