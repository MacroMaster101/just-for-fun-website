import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glow?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  hoverEffect = false,
  glow = false,
  glass = true,
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`relative rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 ${
        glass ? "bg-slate-900/40 backdrop-blur-md" : "bg-slate-900"
      } ${
        hoverEffect
          ? "hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-[0_10px_30px_-10px_rgba(139,92,246,0.2)]"
          : ""
      } ${
        glow ? "shadow-[0_0_20px_rgba(139,92,246,0.05)] border-violet-500/10" : ""
      } ${className}`}
      {...props}
    >
      {/* Glow highlight inside card */}
      {glow && (
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-violet-600/10 blur-xl pointer-events-none rounded-full" />
      )}
      {children}
    </div>
  );
};
