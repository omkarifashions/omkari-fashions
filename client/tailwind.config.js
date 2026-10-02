/** Central design tokens - taken from the Omkari Fashions reference designs. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAECE2',
        beige: { DEFAULT: '#EFDED3', dark: '#E6D0C2' },
        brand: {
          orange: '#A84300',
          rust: '#8A3600',
          brown: '#4A1D00',
          maroon: '#8B0000',
          ink: '#2B1408',
          text: '#5C2B0E',
          heading: '#4A1E08',
          gold: '#C9922E',
          muted: '#7B6558',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        logo: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Lato', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        header: 'linear-gradient(90deg,#A84300 0%,#7A2E00 42%,#4A1D00 100%)',
        btn: 'linear-gradient(90deg,#B64500 0%,#8A3600 50%,#4A1D00 100%)',
        'btn-rev': 'linear-gradient(90deg,#4A1D00 0%,#8A3600 50%,#B64500 100%)',
        rule: 'linear-gradient(90deg,transparent,#8B4A26,transparent)',
      },
      boxShadow: { card: '0 2px 10px rgba(74,29,0,.12)', bar: '0 -4px 14px rgba(74,29,0,.15)' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        toastIn: { from: { opacity: 0, transform: 'translateY(-8px) scale(.98)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { toastIn: 'toastIn .2s ease-out' },
    },
  },
  plugins: [],
};
