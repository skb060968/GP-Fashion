module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "fashion-gold": "#a08339",
        "fashion-black": "#1a1a1a",
        "brand-gold": "#D4AF37",
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        cinzel: ["var(--font-jost)", "sans-serif"],
        jost: ["var(--font-jost)", "sans-serif"],
      },
    },
  },
  plugins: [],
}
