import React from "react";

interface BadgeProps {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  pulse = false,
  children,
  className = "",
}) => {
  const variants = {
    primary: "bg-[#ff0033]/12 border border-[#ff0033]/35 text-[#ff4b5f]",
    secondary: "bg-white/10 border border-white/20 text-white",
    success: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400",
    danger: "bg-red-500/10 border border-red-500/30 text-red-400",
    warning: "bg-amber-500/10 border border-amber-500/30 text-amber-400",
  };

  const pulseColors = {
    primary: "bg-[#ff0033]",
    secondary: "bg-white",
    success: "bg-emerald-500",
    danger: "bg-red-500",
    warning: "bg-amber-500",
  };

  const pulseAnimateColors = {
    primary: "bg-[#ff0033]/75",
    secondary: "bg-white/75",
    success: "bg-emerald-400/75",
    danger: "bg-red-400/75",
    warning: "bg-amber-400/75",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest leading-none backdrop-blur-sm ${variants[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseAnimateColors[variant]}`}
          />
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pulseColors[variant]}`}
          />
        </span>
      )}
      {children}
    </span>
  );
};
