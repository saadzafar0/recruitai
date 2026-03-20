import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CSS variable-based colors for theme support
        'theme-bg': 'var(--color-bg)',
        'theme-card': 'var(--color-bg-card)',
        'theme-input': 'var(--color-bg-input)',
        'theme-elevated': 'var(--color-bg-elevated)',
        'theme-text': 'var(--color-text-primary)',
        'theme-text-secondary': 'var(--color-text-secondary)',
        'theme-border': 'var(--color-border-subtle)',
        'theme-border-input': 'var(--color-border-input)',
        'theme-border-hover': 'var(--color-border-hover)',
        // Midnight Slate color system (using CSS vars for theme support)
        dark: {
          bg: 'var(--color-bg)',
          card: 'var(--color-bg-card)',
          input: 'var(--color-bg-input)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        accent: {
          purple: 'var(--color-accent-purple)',
          'purple-hover': 'var(--color-accent-purple-hover)',
          green: 'var(--color-accent-green)',
          red: 'var(--color-accent-red)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          input: 'var(--color-border-input)',
        },
      },
      boxShadow: {
        'theme-card': 'var(--shadow-card)',
        'theme-elevated': 'var(--shadow-elevated)',
      },
    },
  },
  plugins: [],
}

export default config
