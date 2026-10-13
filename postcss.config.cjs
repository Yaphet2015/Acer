// Convert rem → px so the Shadow DOM UI doesn't scale with the host page's root font-size.
const remToPx = () => ({
  postcssPlugin: 'rem-to-px',
  Declaration(decl) {
    if (decl.value.includes('rem')) decl.value = decl.value.replace(/(-?\d*\.?\d+)rem\b/g, (_, n) => `${+(parseFloat(n) * 16).toFixed(3)}px`);
  },
});
remToPx.postcss = true;
module.exports = { plugins: [require('tailwindcss'), remToPx, require('autoprefixer')] };
