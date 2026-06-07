import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
    const variants = {
      primary: "bg-[#8B1A1A] text-white hover:bg-[#7a1717] focus:ring-[#8B1A1A]/40",
      secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300",
      ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-200",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400",
    };
    return (
      <button ref={ref} disabled={disabled} className={cn(base, sizes[size], variants[variant], className)} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";