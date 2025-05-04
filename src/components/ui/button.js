import { cva } from "class-variance-authority"
import React from "react"
import { cn } from "./utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-bg-primary text-content-primary-foreground hover:bg-primary-hover",
        secondary: "bg-bg-secondary text-content-secondary-foreground hover:bg-secondary-hover",
        outline: "border border-border hover:bg-bg-muted hover:text-content-foreground",
        ghost: "hover:bg-bg-muted hover:text-content-foreground",
        link: "underline-offset-4 hover:underline text-content-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
