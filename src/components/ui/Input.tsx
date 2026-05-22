import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`w-full bg-slate-950/80 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all ${
              icon ? "pl-10" : "pl-4"
            } ${error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30" : ""} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 font-semibold tracking-wide mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full bg-slate-950/80 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all min-h-[120px] ${
            error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30" : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 font-semibold tracking-wide mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
