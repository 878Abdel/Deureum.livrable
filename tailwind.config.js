export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'sans-serif'],
      },
      gridTemplateColumns: {
        'dashboard': '1fr 1fr 1fr 360px',
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        "@font-face": [
          {
            fontFamily: "Satoshi",
            src: "url('/fonts/Satoshi-Regular.woff2') format('woff2')",
            fontWeight: "400",
            fontStyle: "normal",
          },
          {
            fontFamily: "Satoshi",
            src: "url('/fonts/Satoshi-Medium.woff2') format('woff2')",
            fontWeight: "500",
            fontStyle: "normal",
          },
          {
            fontFamily: "Satoshi",
            src: "url('/fonts/Satoshi-Bold.woff2') format('woff2')",
            fontWeight: "700",
            fontStyle: "normal",
          },
          {
            fontFamily: "Satoshi",
            src: "url('/fonts/Satoshi-Black.woff2') format('woff2')",
            fontWeight: "900",
            fontStyle: "normal",
          },
          {
            fontFamily: "Satoshi",
            src: "url('/fonts/Satoshi-BlackItalic.woff2') format('woff2')",
            fontWeight: "900",
            fontStyle: "italic",
          },
        ],
      });
    },
  ],
}
