import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Slate color system
        dark: {
          bg: '#0F1117',
          card: '#171921',
          input: '#13151D',
        },
        text: {
          primary: '#E2E4EB',
          secondary: '#7E8494',
        },
        accent: {
          purple: '#7C6AEF',
          'purple-hover': '#9585F5',
          green: '#3ECF8E',
          red: '#EF6B6B',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          input: 'rgba(255,255,255,0.08)',
        },
      },
    },
  },
  plugins: [],
}

export default config
