/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Твоя палитра
        primary: '#4F46E5',     // Primary
        mainText: '#111827',  // black for text
        greyText: '#374151',  // secondary text
        offWhite: '#F9FAFB',   // off white
        lightGrey: '#EFEFEF',  // main bg
      },
      fontSize: {
        // typography
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h3': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'h4': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'h5': ['14px', { lineHeight: '20px', fontWeight: '400' }],
      },
      boxShadow: {
        'ios': '0 8px 30px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'button': '25px',
        'card': '25px',
        'pfp': '25px',
      }
    },
  },
  plugins: [],
}