module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      twocol: { raw: "(orientation: landscape)" },
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        "fashion-gold": "#a08339",
        "fashion-black": "#1a1a1a",
        "brand-gold": "#D4AF37",
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        cinzel: ["Cinzel Variable", "serif"],
        jost: ["Jost Variable", "sans-serif"],
      },
    },
  },
  plugins: [],
}
