/** @type {import('tailwindcss').Config} */
/**
 * tailwind.config.js
 * Design A — Artisan Canvas: purple token extensions added.
 * All original tokens (border, ring, muted, primary, etc.) preserved
 * — Radix UI and shadcn components depend on them.
 * All original fonts (Poppins, Playball, Permanent Marker, Agbalumo)
 * preserved — existing components still reference them.
 */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // ─────────────────────────────────────────────────────────
      // EXISTING colors (unchanged — Radix UI / shadcn depends on these)
      // ─────────────────────────────────────────────────────────
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // ── Design A — Artisan Canvas purple palette ────────────
        // Usage: bg-artisan-primary, text-artisan-text, border-artisan-border, etc.
        artisan: {
          // Warm white page base
          white:         '#FAF8F1',

          // Core purples
          primary:       '#5C2D91', // deep violet — CTAs, icons
          'primary-mid': '#7B3FA0', // mid violet — hover, gradients
          'primary-light':'#A87DC8', // lavender — borders, light accents
          'primary-pale': '#C9A0DC', // pale lavender — tags, subtle fills
          'primary-wash': '#EDE0F9', // wash — section tints, card bg

          // Warm mauve tones (from logo's lower brush stroke)
          mauve:         '#7B4A72',
          'mauve-light': '#C47AB8',
          'mauve-deep':  '#5A2848',

          // Backgrounds (light — never dark)
          bg:            '#FAF8F1', // page base
          'bg-mid':      '#F4EEFF', // mid wash
          'bg-deep':     '#EDE0F9', // deepest tint

          // Text scale
          text:          '#2D0E5A', // primary body text
          'text-mid':    '#4A2560', // medium emphasis
          'text-muted':  '#6B4A80', // secondary / muted
          'text-faint':  '#9B7AB0', // placeholder, disabled

          // Surfaces
          surface:       'rgba(255,255,255,0.85)',
          'surface-mid': 'rgba(255,255,255,0.70)',

          // Dark purple (for footer, deep accents — used sparingly)
          deep:          '#2D0E5A',
          'deep-mid':    '#4A2580',
        },
      },

      // ─────────────────────────────────────────────────────────
      // EXISTING border radius (unchanged — Radix UI uses --radius)
      // ─────────────────────────────────────────────────────────
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
        // Design A artisan radius tokens
        'artisan-card':  '22px',
        'artisan-pill':  '50px',
        'artisan-badge': '20px',
        'artisan-input': '12px',
      },

      // ─────────────────────────────────────────────────────────
      // FONTS — original fonts kept, Design A fonts added
      // ─────────────────────────────────────────────────────────
      fontFamily: {
        // ── Original (kept — existing components use these) ──
        sans:               ['Poppins', 'Inter', 'sans-serif'],
        serif:              ['Playball', 'cursive'],
        'permanent-marker': ['"Permanent Marker"', 'cursive'],
        chewy:              ['Chewy', 'cursive'],
        agbalumo:           ['Agbalumo', 'cursive'],

        // ── Design A — Artisan Canvas fonts ──
        // font-display   → Playfair Display (hero headings, card names)
        // font-script    → Dancing Script (artsy labels, sub-headings)
        // font-serif-display → Cormorant Garamond (large italic display text)
        // font-ui        → Inter (body copy, UI text, buttons)
        display:         ['"Playfair Display"', 'Georgia', 'serif'],
        script:          ['"Dancing Script"', 'cursive'],
        'serif-display': ['"Cormorant Garamond"', 'Georgia', 'serif'],
        ui:              ['Inter', 'Poppins', 'sans-serif'],
        'home-brand':    ['"Archivo Black"', 'Arial Black', 'sans-serif'],
        'home-editorial':['Lora', 'Georgia', 'serif'],
      },

      // ─────────────────────────────────────────────────────────
      // BOX SHADOWS — artisan shadow scale
      // ─────────────────────────────────────────────────────────
      boxShadow: {
        'artisan-sm': '0 4px 16px rgba(92, 45, 145, 0.12)',
        'artisan-md': '0 8px 30px rgba(92, 45, 145, 0.22)',
        'artisan-lg': '0 20px 60px rgba(92, 45, 145, 0.30)',
        'artisan-card':'0 4px 20px rgba(92, 45, 145, 0.08)',
        'artisan-btn': '0 6px 24px rgba(92, 45, 145, 0.38)',
      },

      // ─────────────────────────────────────────────────────────
      // KEYFRAMES — original + Design A animations
      // ─────────────────────────────────────────────────────────
      keyframes: {
        // ── Original (unchanged) ──
        'accordion-down': {
          from: { height: 0 },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: 0 },
        },

        // ── Design A artisan keyframes ──
        'artisan-float-orb': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%':       { transform: 'translate(20px, -20px) scale(1.05)' },
        },
        'artisan-blob-morph': {
          '0%, 100%': { borderRadius: '60% 40% 50% 50% / 40% 50% 60% 50%' },
          '33%':       { borderRadius: '50% 60% 40% 50% / 60% 40% 50% 40%' },
          '66%':       { borderRadius: '40% 50% 60% 40% / 50% 60% 40% 60%' },
        },
        'artisan-badge-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        'artisan-dot-pulse': {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':       { opacity: '0.5', transform: 'scale(0.75)' },
        },
        'artisan-rotate-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'artisan-fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'artisan-card-fan-in': {
          from: { opacity: '0', transform: 'translateY(24px) rotate(var(--card-rotation, 0deg))' },
          to:   { opacity: '1', transform: 'translateY(0) rotate(var(--card-rotation, 0deg))' },
        },
      },

      // ─────────────────────────────────────────────────────────
      // ANIMATION utilities
      // ─────────────────────────────────────────────────────────
      animation: {
        // ── Original ──
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',

        // ── Design A ──
        'artisan-float':   'artisan-float-orb   12s ease-in-out infinite',
        'artisan-blob':    'artisan-blob-morph   8s ease-in-out infinite',
        'artisan-badge':   'artisan-badge-float  5s ease-in-out infinite',
        'artisan-pulse':   'artisan-dot-pulse    2.5s ease-in-out infinite',
        'artisan-rotate':  'artisan-rotate-slow 20s linear infinite',
        'artisan-fade-up': 'artisan-fade-up     0.5s ease forwards',
      },

      // ─────────────────────────────────────────────────────────
      // BACKDROP BLUR — ensure blur-artisan is available
      // ─────────────────────────────────────────────────────────
      backdropBlur: {
        artisan: '20px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
