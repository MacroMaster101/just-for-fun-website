import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "aurora";
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
    "inline-flex items-center justify-center font-bold tracking-wide rounded-full transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer relative overflow-hidden group";
  
  const variants = {
    primary:
      "bg-[#ff0033] text-white hover:bg-[#e5002e]",
    aurora:
      "bg-gradient-to-r from-[#ff0033] via-[#b20710] to-[#ff4b5f] bg-[length:200%_auto] text-white animate-aurora-shift",
    secondary:
      "bg-[#272727] border border-white/10 text-neutral-100 hover:bg-[#3f3f3f] backdrop-blur-sm",
    outline:
      "border border-white/20 text-white hover:border-[#ff0033]/80 hover:bg-[#ff0033]/10",
    ghost: "text-neutral-400 hover:text-white hover:bg-white/5",
    danger: "bg-red-950/50 border border-red-500/20 text-red-400 hover:bg-red-900/60 hover:text-white",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  const glowStyles = glow
    ? variant === "primary"
      ? "shadow-[0_0_18px_rgba(255,0,51,0.35)] hover:shadow-[0_0_28px_rgba(255,0,51,0.48)]"
      : variant === "aurora"
      ? "shadow-[0_0_20px_rgba(255,0,51,0.38)] hover:shadow-[0_0_32px_rgba(255,75,95,0.5)]"
      : ""
    : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${glowStyles} ${className}`}
      {...props}
    >
      {/* Subtle sheen effect on hover */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};
