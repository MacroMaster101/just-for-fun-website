"use client";

import React from "react";
import { ShoppingBag, Star, Globe, Gift, Award } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const Merch = () => {
  const previews = [
    { icon: "👕", title: "Premium T-Shirts", desc: "Heavyweight cotton, cool custom graphic prints." },
    { icon: "🧢", title: "Snapback Caps", desc: "Embroidered high quality channel logo caps." },
    { icon: "🎮", title: "Gaming Accessories", desc: "Branded controllers and dynamic items." },
    { icon: "🖱️", title: "Mouse Pads", desc: "Stitched-edge, ultra-smooth gaming mousepads." },
  ];

  const features = [
    { icon: <Award size={16} />, text: "Premium Quality" },
    { icon: <Globe size={16} />, text: "Worldwide Shipping" },
    { icon: <Star size={16} />, text: "Unique Designs" },
    { icon: <Gift size={16} />, text: "Limited Edition" },
  ];

  return (
    <section id="merch" className="relative py-24 bg-slate-950 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-violet-500">🛍️</span> Official Merch
          </h2>
          <p className="text-slate-400 text-sm tracking-wider uppercase font-semibold">
            Rep the JUST FOR FUN brand with premium exclusive gear!
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-cyan-500 mx-auto rounded-full mt-4" />
        </div>

        {/* Coming Soon Area */}
        <Card className="border border-white/10 p-8 sm:p-12 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-md relative overflow-hidden text-center max-w-4xl mx-auto space-y-8">
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-pink-600/10 blur-3xl pointer-events-none" />

          <div className="inline-flex">
            <Badge variant="warning" pulse>
              Coming Soon
            </Badge>
          </div>

          <div className="space-y-4 max-w-xl mx-auto">
            <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
              🚀 Launching Soon!
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We are working hard on bringing you the highest quality gaming apparel and accessories. Subscribe to get notified immediately when the merch shop launches!
            </p>
          </div>

          {/* Merch Item Preview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {previews.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:border-violet-500/20 transition-colors"
              >
                <div className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] mb-2">
                  {item.icon}
                </div>
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-500 leading-snug">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Email Notify Button */}
          <div className="pt-4 flex flex-col items-center justify-center">
            <a
              href="https://www.youtube.com/channel/UCcCp0B0bypJE4EJjwq8u2lQ?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button glow className="gap-2">
                <ShoppingBag size={16} /> Notify Me on Launch
              </Button>
            </a>
          </div>

          {/* Merch Highlights Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-bold border-t border-white/5 pt-8">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                <span className="text-violet-500">{feat.icon}</span>
                {feat.text}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};
