import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // ShadCN variables
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        // Custom color palette for the app
        primary: {
          DEFAULT: "var(--color-primary-600)",
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
          foreground: "var(--color-primary-50)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary-200)",
          50: "var(--color-secondary-50)",
          100: "var(--color-secondary-100)",
          200: "var(--color-secondary-200)",
          300: "var(--color-secondary-300)",
          400: "var(--color-secondary-400)",
          500: "var(--color-secondary-500)",
          600: "var(--color-secondary-600)",
          700: "var(--color-secondary-700)",
          800: "var(--color-secondary-800)",
          900: "var(--color-secondary-900)",
          foreground: "var(--color-secondary-800)",
        },
        
        // Status colors
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        emergency: "var(--color-emergency)",
        info: "var(--color-info)",
        waiting: "var(--color-waiting)",
        inProgress: "var(--color-inProgress)",
        complete: "var(--color-complete)",
        
        // Default ShadCN color extensions
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
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
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
  safelist: [
    // Add color variants that might be used in the app
    'bg-primary-50', 'bg-primary-100', 'bg-primary-200', 'bg-primary-500', 'bg-primary-600', 'bg-primary-700', 'bg-primary-800',
    'bg-secondary-50', 'bg-secondary-100', 'bg-secondary-200', 'bg-secondary-500', 'bg-secondary-700', 'bg-secondary-800',
    'border-primary-200', 'border-primary-500', 'border-secondary-200', 'border-secondary-300',
    'text-primary-500', 'text-primary-700', 'text-primary-800', 
    'text-secondary-400', 'text-secondary-500', 'text-secondary-700', 'text-secondary-800', 'text-secondary-900',
    'bg-success/10', 'bg-warning/10', 'bg-danger/10', 'bg-emergency/10', 'bg-info/10', 'bg-waiting/10', 'bg-inProgress/10', 'bg-complete/10',
    'text-success', 'text-warning', 'text-danger', 'text-emergency', 'text-info', 'text-waiting', 'text-inProgress', 'text-complete',
    'border-success', 'border-warning', 'border-danger'
  ]
} satisfies Config;
