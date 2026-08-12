/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#13231F', raised: '#1E352E' },
        gold: { DEFAULT: '#D9A94E', dark: '#8A6A2E' },
        cream: { DEFAULT: '#F5F1E6', card: '#FCFBF8', border: '#E8E0CC' },
        danger: '#E5484D',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px -4px rgba(19,35,31,0.10)',
        'card-hover': '0 12px 30px -10px rgba(19,35,31,0.18)',
        login:
          '0 20px 60px -20px rgba(19,35,31,0.18), 0 8px 20px -8px rgba(19,35,31,0.08)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease',
      },
    },
  },
  plugins: [],
}
