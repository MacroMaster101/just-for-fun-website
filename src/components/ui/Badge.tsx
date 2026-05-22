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
    primary: "bg-violet-500/10 border border-violet-500/30 text-violet-400",
    secondary: "bg-slate-800 border border-white/5 text-slate-300",
    success: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400",
    danger: "bg-red-500/10 border border-red-500/30 text-red-400",
    warning: "bg-amber-500/10 border border-amber-500/30 text-amber-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest leading-none ${variants[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              variant === "success"
                ? "bg-emerald-400"
                : variant === "danger"
                ? "bg-red-400"
                : "bg-violet-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              variant === "success"
                ? "bg-emerald-500"
                : variant === "danger"
                ? "bg-red-500"
                : "bg-violet-500"
            }`}
          />
        </span>
      )}
      {children}
    </span>
  );
};
