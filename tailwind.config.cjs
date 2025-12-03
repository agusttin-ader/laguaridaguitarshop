/**
 * Tailwind config for the project. Defines content paths so PurgeCSS/Tailwind
 * removes unused utilities correctly and keeps a predictable build output.
 */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './pages/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
    './scripts/**/*.{js,mjs}'
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          100: '#D4AF37'
        }
      },
      borderRadius: {
        lg: '12px'
      }
    }
  },
  plugins: []
}
