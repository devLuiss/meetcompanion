import React from "react"
import { cn } from "./utils"

const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-border bg-bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-content-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-content-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
