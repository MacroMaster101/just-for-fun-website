import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  glow = false,
  children,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-bold tracking-wide rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  
  const variants = {
    primary:
      "bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500",
    secondary:
      "bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800",
    outline:
      "border-2 border-violet-500/50 hover:border-violet-500 text-violet-400 hover:text-white hover:bg-violet-500/10",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
    danger: "bg-red-950 border border-red-500/30 text-red-400 hover:bg-red-900 hover:text-white",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  const glowStyles = glow && variant === "primary"
    ? "shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)]"
    : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${glowStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
