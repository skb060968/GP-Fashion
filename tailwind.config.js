

const fluid = (min, pref, max, lineHeight) => [`clamp(${min}, ${pref}, ${max})`, { lineHeight }]

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
      fontSize: {
        xs: fluid("0.75rem", "0.375rem + 0.469vw", "1.125rem", "1.333"),
        sm: fluid("0.875rem", "0.4375rem + 0.547vw", "1.3125rem", "1.429"),
        base: fluid("1rem", "0.5rem + 0.625vw", "1.5rem", "1.5"),
        lg: fluid("1.125rem", "0.5625rem + 0.703vw", "1.6875rem", "1.556"),
        xl: fluid("1.25rem", "0.625rem + 0.781vw", "1.875rem", "1.4"),
        "2xl": fluid("1.5rem", "0.75rem + 0.938vw", "2.25rem", "1.333"),
        "3xl": fluid("1.875rem", "0.9375rem + 1.172vw", "2.8125rem", "1.2"),
        "4xl": fluid("2.25rem", "1.125rem + 1.406vw", "3.375rem", "1.111"),
        "5xl": fluid("3rem", "1.5rem + 1.875vw", "4.5rem", "1"),
        "6xl": fluid("3.75rem", "1.875rem + 2.344vw", "5.625rem", "1"),
        "7xl": fluid("4.5rem", "2.25rem + 2.813vw", "6.75rem", "1"),
      },
      colors: {
        "fashion-gold": "#a08339",
        "fashion-black": "#1a1a1a",
        "brand-gold": "#D4AF37",
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        cinzel: ["var(--font-cinzel)", "serif"],
        jost: ["var(--font-jost)", "sans-serif"],
      },
    },
  },
  plugins: [],
}
