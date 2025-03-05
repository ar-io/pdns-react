/** @type {import('tailwindcss').Config} */

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'selector', // or 'media' or 'class'
  theme: {
    extend: {
      backgroundImage: {
        'primary-gradient':
          'linear-gradient(90deg, rgba(255, 185, 56, 0.1), #ffb938 100%)',
        ['grey-gradient']: 'linear-gradient(90deg, #48484CBF, #48484C80)',
      },
      fontFamily: {
        sans: ['Rubik', 'sans-serif'],
      },
      boxShadow: {
        one: '0px 0px 4px rgba(0, 0, 0, 0.5)',
      },
      text: {
        // TODO: add typography tokens
        base: '14px',
        scale: 1.2,
      },
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      bold: 700,
    },
    colors: {
      primary: '#ffb938',
      ['primary-thin']: 'rgba(255, 185, 56, 0.1)',
      background: '#131314',
      foreground: '#222224',
      success: '#44af69',
      'success-thin': 'rgba(34, 197, 94, 0.1)',
      error: '#ef6461',
      'error-thin': ' rgba(239, 68, 68, 0.1)',
      warning: '#ffb938',
      ['warning-light']: '#FFD688BF',
      link: '#6c97b5',
      white: '#fafafa',
      black: 'black',
      ['light-grey']: '#A3A3AD',
      grey: '#7d7d85',
      'metallic-grey': '#18191a',
      ['dark-grey']: '#38393b',
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
    // eslint-disable-next-line
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
};
