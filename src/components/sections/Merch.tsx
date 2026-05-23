"use client";

import React, { useState } from "react";
import { ShoppingBag, Star, Globe, Gift, Award, Plus, Trash2, X, ShoppingCart, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface MerchItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  description: string;
  grade: "LEGENDARY" | "RARE" | "COMMON";
  gradeColor: string;
  image: string;
}

interface CartItem extends MerchItem {
  quantity: number;
}

export const Merch = () => {
  const shopItems: MerchItem[] = [
    {
      id: "merch-1",
      name: "JFF 'Cyber-Obsidian' Hoodie",
      price: 59.99,
      emoji: "🧥",
      description: "Ultra-heavyweight premium cotton featuring an illuminated JFF holographic print back.",
      grade: "LEGENDARY",
      gradeColor: "text-[#ff4b5f] bg-[#ff4b5f]/10 border-[#ff4b5f]/20 shadow-[0_0_10px_rgba(255,75,95,0.2)]",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "merch-2",
      name: "GGEZ Neon Embroidered Cap",
      price: 24.99,
      emoji: "🧢",
      description: "Structured high-profile snapback featuring a glowing cybernetic red e-sports crest.",
      grade: "RARE",
      gradeColor: "text-white bg-white/10 border-white/20",
      image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "merch-3",
      name: "Chaotic Esports Mouse Pad",
      price: 34.99,
      emoji: "🖱️",
      description: "Massive deskmat (900x400mm) with stitched anti-fray borders. Fast speed gliding matrix surface.",
      grade: "RARE",
      gradeColor: "text-white bg-white/10 border-white/20",
      image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "merch-4",
      name: "Clutch or Kick Insulated Mug",
      price: 19.99,
      emoji: "☕",
      description: "Matte black double-wall stainless steel tumbler. Keeps energy drinks ice cold for 24 hours.",
      grade: "COMMON",
      gradeColor: "text-neutral-400 bg-neutral-900 border-white/5",
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80",
    },
  ];

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const getAudioContextClass = () =>
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  const playCartSound = () => {
    if (typeof window === "undefined") return;
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return;

    try {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const playSuccessSound = () => {
    if (typeof window === "undefined") return;
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return;

    try {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.2); // C6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {}
  };

  const addToCart = (item: MerchItem) => {
    playCartSound();
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    setTimeout(() => {
      setCheckoutLoading(false);
      setCheckoutSuccess(true);
      playSuccessSound();
      setCart([]);
    }, 2000);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <section id="merch" className="relative py-24 bg-[#060606] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-6 border-b border-white/5">
          <div className="space-y-3">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center gap-3">
              <span className="text-[#ff0033] filter drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]">🛍️</span> Creator Shop
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm tracking-wider uppercase font-semibold">
              Rep the JFF brand with heavy-duty premium armor and equipment drops!
            </p>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="px-5 py-3 rounded-full border border-white/20 bg-white/5 text-white hover:bg-gradient-to-r hover:from-[#ff0033] hover:to-[#ff4b5f] hover:text-white transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2.5 relative shadow-lg shadow-black/80"
          >
            <ShoppingCart size={15} />
            View Arsenal Cart
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] bg-[length:200%_auto] animate-aurora-shift text-white rounded-full w-5 h-5 text-[9px] font-black flex items-center justify-center border border-white/20 animate-bounce">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Item shop catalog */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shopItems.map((item) => (
            <Card
              key={item.id}
              hoverEffect
              className="border border-white/10 bg-[#181818]/70 hover:border-[#ff0033]/25 transition-all duration-300 flex flex-col justify-between overflow-hidden group h-full shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              {/* Image box */}
              <div className="relative aspect-square overflow-hidden bg-[#0f0f0f] border-b border-white/10">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Loot Grade Badge overlay */}
                <span className={`absolute top-3 left-3 text-[8px] font-black px-2 py-0.5 rounded border ${item.gradeColor}`}>
                  {item.grade}
                </span>

                <span className="absolute bottom-3 right-3 bg-black/85 text-xs font-black text-white px-2.5 py-1 rounded border border-white/10 shadow-lg font-display">
                  ${item.price}
                </span>
              </div>

              {/* Information area */}
              <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h4 className="font-display font-black text-xs sm:text-sm text-white tracking-wide uppercase line-clamp-1 group-hover:text-[#ff4b5f] transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-normal line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <Button
                    onClick={() => addToCart(item)}
                    glow
                    variant="aurora"
                    fullWidth
                    size="sm"
                    className="gap-1.5 cursor-pointer uppercase text-[10px] tracking-widest font-black"
                  >
                    <Plus size={12} /> Add to Arsenal
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Brand values footer */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-16 text-xs text-neutral-500 font-bold border-t border-white/5 pt-8">
          {[
            { icon: <Award size={14} className="text-[#ff0033]" />, text: "Genuine Custom Prints" },
            { icon: <Globe size={14} className="text-white" />, text: "Worldwide Cargo Shipping" },
            { icon: <Star size={14} className="text-[#ff4b5f]" />, text: "Limited Season Drops" },
            { icon: <Gift size={14} className="text-white" />, text: "Community VIP Discounts" },
          ].map((feat, idx) => (
            <div key={idx} className="flex items-center gap-1.5 transition-colors">
              {feat.icon}
              {feat.text}
            </div>
          ))}
        </div>

      </div>

      {/* SLIDING CHECKOUT ARSENAL CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-[#020208]/80 backdrop-blur-sm flex justify-end">
          
          {/* Backdrop mask closer click */}
          <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 cursor-pointer" />

          {/* Drawer core */}
          <div className="relative w-full max-w-md bg-[#181818]/95 backdrop-blur-xl border-l border-[#ff0033]/25 h-full p-6 flex flex-col justify-between shadow-2xl z-10 animate-float">
            
            {/* Header info */}
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <h3 className="font-display font-extrabold text-base text-white tracking-wide uppercase flex items-center gap-2">
                  <ShoppingCart size={16} className="text-[#ff0033]" /> Creator Cart
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {checkoutSuccess && (
                <div className="mt-4 p-4 rounded-lg border border-white/20 bg-white/10 text-white space-y-2 animate-bounce">
                  <h4 className="text-xs font-black uppercase flex items-center gap-1.5">
                    <Sparkles size={12} /> Purchase Complete!
                  </h4>
                  <p className="text-[10px] leading-relaxed">
                    Holographic transmission success. Merch order simulated and sent to the JFF Loot division. Thank you for supporting!
                  </p>
                  <button
                    onClick={() => setCheckoutSuccess(false)}
                    className="text-[9px] font-black uppercase border border-white/30 px-2 py-0.5 rounded hover:bg-white hover:text-black transition-all cursor-pointer block mt-1"
                  >
                    Acknowledge
                  </button>
                </div>
              )}

              {/* Cart List */}
              <div className="mt-6 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500 text-xs space-y-2">
                    <ShoppingCart size={24} className="mx-auto text-neutral-600" />
                    <p>Your arsenal cart is empty. Ready for some epic apparel?</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="bg-[#0d0d26]/60 border border-white/5 p-3 rounded-xl flex items-center gap-4 animate-fade-in">
                      {/* Product thumbnail */}
                      <div className="w-14 h-14 bg-[#0f0f0f] border border-white/10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-2xl relative">
                        <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/85 text-[8px] font-black text-white px-1 py-0.2 rounded">
                          x{item.quantity}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="flex-grow">
                        <h4 className="font-display font-extrabold text-[11px] text-white uppercase tracking-wide truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Garbage bin closer */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 rounded-lg bg-neutral-900 text-neutral-500 hover:text-[#ff4b5f] hover:bg-[#ff0033]/10 transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom summary and Action */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Shipment & Cargo</span>
                  <span className="text-emerald-400 font-bold uppercase text-[9px]">GGEZ FREE</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Import Taxes</span>
                  <span className="text-[9px] uppercase font-bold text-neutral-400">Calculated on sync</span>
                </div>
                <div className="flex justify-between text-white font-extrabold text-sm border-t border-white/5 pt-2 font-display">
                  <span>TOTAL ESTIMATED</span>
                  <span className="text-[#ff4b5f]">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutLoading}
                glow
                variant="aurora"
                fullWidth
                size="lg"
                className="gap-2 uppercase text-xs tracking-widest font-black py-3.5 cursor-pointer"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Synchronizing ledger...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={14} />
                    Simulate Loot Checkout
                  </>
                )}
              </Button>
            </div>

          </div>

        </div>
      )}

    </section>
  );
};
