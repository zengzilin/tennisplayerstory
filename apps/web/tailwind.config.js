const neutralPalette = {
  50: '#f5f5ec', 100: '#eef0e5', 200: '#dce0d2', 300: '#c5ceba',
  400: '#a1ae99', 500: '#647266', 600: '#4b624f', 700: '#354937',
  800: '#23352a', 900: '#18291f', 950: '#101d16',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
        serif: ['Arial', 'Helvetica', 'sans-serif'],
      },
      colors: {
        slate: neutralPalette,
        gray: neutralPalette,
        blue: {
          50: '#f0f2e5', 100: '#e9edde', 200: '#d9e5c3', 300: '#c3d78d',
          400: '#a3bc5f', 500: '#637d3c', 600: '#476330', 700: '#354937',
          800: '#263e2d', 900: '#163427', 950: '#101d16',
        },
        lime: {
          50: '#f5f7e8', 100: '#edf2d0', 200: '#e3ec9e', 300: '#d8ed67',
          400: '#c4da55', 500: '#a3bc3d', 600: '#7f9c29', 700: '#637d3c',
          800: '#476330', 900: '#354937', 950: '#163427',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        '3xl': '0.5rem',
        '2xl': '0.5rem',
        xl: '0.4375rem',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        DEFAULT: '0 1px 2px rgb(22 52 39 / 0.04)',
        sm: '0 1px 2px rgb(22 52 39 / 0.03)',
        md: '0 2px 5px rgb(22 52 39 / 0.05)',
        lg: '0 4px 10px rgb(22 52 39 / 0.06)',
        xl: '0 6px 16px rgb(22 52 39 / 0.07)',
        '2xl': '0 8px 20px rgb(22 52 39 / 0.08)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
