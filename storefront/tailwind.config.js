/** @type {import('tailwindcss').Config} */
// Palette from migration/Edova-Purchase-Wireframe_lime.html (lime-on-forest dark theme).
// rgb + <alpha-value> so opacity modifiers (text-mist/60, border-lime/25, …) work.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0a1410', card: '#111f17', edge: '#132219' },   // page bg / surfaces
        mist: 'rgb(232 245 233 / <alpha-value>)',                        // #e8f5e9 primary text
        sage: { DEFAULT: 'rgb(138 168 153 / <alpha-value>)', dim: '#5c7e6b' }, // muted text
        lime: { DEFAULT: 'rgb(212 255 58 / <alpha-value>)', bright: '#e0ff6e' }, // accent
        moss: { DEFAULT: '#1a4d2e', dark: '#143d24' },                   // primary buttons
        amber: '#ffb627',
      },
      fontFamily: {
        ui: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(212,255,58,0.25)',
        'glow-lg': '0 0 0 1px rgba(212,255,58,0.3), 0 12px 40px rgba(45,106,79,0.35), 0 0 36px rgba(212,255,58,0.28)',
        modal: '0 30px 100px -20px rgba(0,0,0,0.9)',
      },
    },
  },
  plugins: [],
}
