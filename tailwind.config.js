let plugin = require("tailwindcss/plugin")

module.exports = {
  content: ["./pages/index.html"],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("grayed-out", ".grayed-out")
    })
  ]
}
