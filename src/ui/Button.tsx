import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "ghost" | "outline" | "secondary";
type ButtonSize = "default" | "sm" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  outline: "border border-border bg-transparent hover:bg-accent",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-7 px-2 text-xs",
  icon: "h-8 w-8",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          "cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
