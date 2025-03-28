/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(39, 39, 42)",
        background: "rgb(9, 9, 11)",
        foreground: "rgb(250, 250, 250)",
        primary: {
          DEFAULT: "rgb(124, 58, 237)",
          foreground: "rgb(250, 250, 250)",
        },
        secondary: {
          DEFAULT: "rgb(39, 39, 42)",
          foreground: "rgb(250, 250, 250)",
        },
        muted: {
          DEFAULT: "rgb(39, 39, 42)",
          foreground: "rgb(161, 161, 170)",
        },
        accent: {
          DEFAULT: "rgb(39, 39, 42)",
          foreground: "rgb(250, 250, 250)",
        },
      },
      keyframes: {
        "float": {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
          "100%": { transform: "translateY(0px)" },
        },
        "fadeIn": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "fadeIn": "fadeIn 0.2s ease-in-out",
      },
    },
  },
  plugins: [],
} 