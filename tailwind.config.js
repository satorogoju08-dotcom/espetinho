export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
        },
        dark: {
          base: 'var(--color-bg-base)',
          card: 'var(--color-bg-card)',
          hover: 'var(--color-bg-card-hover)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bebas Neue', 'system-ui', 'sans-serif'],
        condensed: ['Barlow Condensed', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
