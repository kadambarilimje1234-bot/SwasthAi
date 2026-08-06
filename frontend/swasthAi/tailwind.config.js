/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#2563EB',
          'ai-cyan': '#06B6D4',
          success: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444',
        },
        fontFamily: {
          inter: ['Inter', 'sans-serif'],
        },
        borderRadius: {
          '3xl': '24px',
        },
        backdropBlur: {
          xs: '2px',
        }
      },
    },
    plugins: [],
  }