import React from "react";
import { cn } from "./utils";

const Dialog = ({ open, onClose, children, className }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className={cn(
          "relative bg-bg-background rounded-lg shadow-lg max-w-md w-full max-h-[85vh] overflow-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ className, children, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  >
    {children}
  </div>
);

const DialogTitle = ({ className, children, ...props }) => (
  <h3
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-content-foreground",
      className
    )}
    {...props}
  >
    {children}
  </h3>
);

const DialogDescription = ({ className, children, ...props }) => (
  <p
    className={cn("text-sm text-content-muted-foreground", className)}
    {...props}
  >
    {children}
  </p>
);

const DialogContent = ({ className, children, ...props }) => (
  <div
    className={cn("p-6 pt-0", className)}
    {...props}
  >
    {children}
  </div>
);

const DialogFooter = ({ className, children, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle };
