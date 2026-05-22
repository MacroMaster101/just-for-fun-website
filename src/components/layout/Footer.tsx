"use client";

import React from "react";
import { Heart } from "lucide-react";
import { Youtube, Twitter, Discord } from "@/components/ui/Icons";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-950 border-t border-white/5 pt-16 pb-8 overflow-hidden">
      {/* Decorative Wave/Gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 relative z-10">
        {/* Brand */}
        <div className="md:col-span-2 space-y-4">
          <a href="#hero" className="flex items-center gap-2 font-display font-extrabold text-xl tracking-wider text-white">
            <span>🎮</span> JUST FOR FUN
          </a>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
            Your ultimate gaming destination for epic clips, full walkthroughs, and chill vibes. Join our community and stay in the loop!
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://www.youtube.com/channel/UCcCp0B0bypJE4EJjwq8u2lQ"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 hover:border-red-500/50 hover:text-red-500 flex items-center justify-center transition-all hover:-translate-y-1"
            >
              <Youtube size={18} />
            </a>
            <a
              href="https://discord.gg/yourserver"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 hover:border-violet-500/50 hover:text-violet-500 flex items-center justify-center transition-all hover:-translate-y-1"
            >
              <Discord size={18} />
            </a>
            <a
              href="https://twitter.com/justforfun"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 hover:border-cyan-500/50 hover:text-cyan-500 flex items-center justify-center transition-all hover:-translate-y-1"
            >
              <Twitter size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase mb-4">
            Navigation
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li>
              <a href="#hero" className="hover:text-violet-400 transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="#about" className="hover:text-violet-400 transition-colors">
                About
              </a>
            </li>
            <li>
              <a href="#latest" className="hover:text-violet-400 transition-colors">
                Latest Videos
              </a>
            </li>
            <li>
              <a href="#schedule" className="hover:text-violet-400 transition-colors">
                Stream Schedule
              </a>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase mb-4">
            Legal & Support
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li>
              <a href="#contact" className="hover:text-violet-400 transition-colors">
                Contact Us
              </a>
            </li>
            <li>
              <a href="#merch" className="hover:text-violet-400 transition-colors">
                Store Help
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-violet-400 transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-violet-400 transition-colors">
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>
          &copy; {currentYear} JUST FOR FUN &bull; All rights reserved.
        </p>
        <p className="flex items-center gap-1.5">
          Made with <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" /> for the gaming community.
        </p>
      </div>
    </footer>
  );
};
