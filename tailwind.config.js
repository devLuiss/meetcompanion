/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Cores de conteúdo
        "content-primary": "var(--color-content-primary)",
        "content-secondary": "var(--color-content-secondary)",
        "content-foreground": "var(--color-content-foreground)",
        "content-primary-foreground": "var(--color-content-primary-foreground)",
        "content-secondary-foreground": "var(--color-content-secondary-foreground)",
        "content-muted-foreground": "var(--color-content-muted-foreground)",
        
        // Cores de background
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        "bg-background": "var(--color-bg-background)",
        "bg-muted": "var(--color-bg-muted)",
        "bg-input": "var(--color-bg-input)",
        
        // Cores de borda
        "border-primary": "var(--color-border-primary)",
        "border": "var(--color-border)",
        
        // Cores de acento
        "accent": "var(--color-accent)",
        "accent-foreground": "var(--color-accent-foreground)",
        
        // Cores de hover
        "primary-hover": "var(--color-primary-hover)",
        "secondary-hover": "var(--color-secondary-hover)",
      }
    },
  },
  plugins: [],
}