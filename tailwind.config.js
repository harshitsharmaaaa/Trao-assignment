/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk backgrounds
        cyber: {
          bg: '#0a0a0f',
          surface: '#12121a',
          elevated: '#1a1a28',
          well: '#0d0d12',
        },
        // Neon accent
        neon: {
          DEFAULT: '#0ea5e9',
          bright: '#38bdf8',
          glow: 'rgba(14, 165, 233, 0.3)',
        },
      },
      boxShadow: {
        'neon': '0 0 20px rgba(14, 165, 233, 0.3)',
        'neon-strong': '0 0 30px rgba(14, 165, 233, 0.5)',
        'glow-success': '0 0 15px rgba(16, 185, 129, 0.3)',
        'glow-error': '0 0 15px rgba(239, 68, 68, 0.3)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 20px rgba(14, 165, 233, 0.2)' },
          to: { boxShadow: '0 0 30px rgba(14, 165, 233, 0.4)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        '3xl': '64px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      },
    },
  },
  plugins: [],
};
