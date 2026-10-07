

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {

        "3xl": "1920px",
      },
      colors: {
        "fashion-gold": "#a08339",
        "fashion-black": "#1a1a1a",
        "brand-gold": "#D4AF37",
      },
      fontFamily: {
        sans: ["var(--font-jost)", "Jost Static", "sans-serif"],
        serif: ["var(--font-cinzel)", "Cinzel Static", "serif"],
        cinzel: ["var(--font-cinzel)", "Cinzel Static", "serif"],
        jost: ["var(--font-jost)", "Jost Static", "sans-serif"],
      },
    },
  },
  plugins: [],
}
