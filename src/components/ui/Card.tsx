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
      className={`relative rounded-lg border transition-all duration-300 overflow-hidden ${
        glass
          ? "bg-[#181818]/80 backdrop-blur-xl border-white/10"
          : "bg-[#0f0f0f] border-white/10"
      } ${
        hoverEffect
          ? "hover:-translate-y-1 hover:border-[#ff0033]/50 hover:shadow-[0_16px_40px_-18px_rgba(255,0,51,0.55)]"
          : ""
      } ${
        glow
          ? "shadow-[0_0_32px_rgba(255,0,51,0.16)] border-[#ff0033]/30"
          : ""
      } ${className}`}
      {...props}
    >
      {/* Soft YouTube-red highlights inside the card */}
      {glow && (
        <>
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-[#ff0033]/12 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-white/6 blur-3xl pointer-events-none rounded-full" />
        </>
      )}
      {children}
    </div>
  );
};
