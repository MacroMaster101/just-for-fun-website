"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Star,
  Globe,
  Gift,
  Award,
  Plus,
  Trash2,
  X,
  ShoppingCart,
  Loader2,
  Sparkles,
  Rocket,
  Bell,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Grade = "LEGENDARY" | "RARE" | "COMMON";

interface MerchItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  description: string;
  grade: Grade;
  imageUrl: string;
}

interface CartItem extends MerchItem {
  quantity: number;
}

const GRADE_BADGE: Record<Grade, string> = {
  LEGENDARY:
    "text-[#ff4b5f] bg-[#ff4b5f]/10 border-[#ff4b5f]/20 shadow-[0_0_10px_rgba(255,75,95,0.2)]",
  RARE: "text-white bg-white/10 border-white/20",
  COMMON: "text-neutral-400 bg-neutral-900 border-white/5",
};

export const Merch = () => {
  const [items, setItems] = useState<MerchItem[]>([]);
  const [shopLive, setShopLive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the shop.live setting and the product list in parallel. Both
  // fail safely — a missing setting (or an empty product table) defaults
  // to the Coming Soon panel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [settingsRes, itemsRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/merch", { cache: "no-store" }),
        ]);
        const settings = settingsRes.ok
          ? ((await settingsRes.json()) as { settings?: Record<string, string> })
          : { settings: {} };
        const itemsData = itemsRes.ok
          ? ((await itemsRes.json()) as { items?: MerchItem[] })
          : { items: [] };
        if (cancelled) return;
        setShopLive(settings.settings?.["shop.live"] === "true");
        setItems(Array.isArray(itemsData.items) ? itemsData.items : []);
      } catch {
        if (!cancelled) {
          setShopLive(false);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
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
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.2);
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
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
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

  // Section header is shared between the live grid and the coming-soon
  // panel so the visual continuity stays the same when the shop flips on.
  const sectionHeader = (
    <div className="mb-10 flex flex-col justify-between gap-6 border-b border-white/5 pb-6 md:mb-16 md:flex-row md:items-end">
      <div className="space-y-3">
        <h2 className="flex flex-wrap items-center gap-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          <span className="text-[#ff0033] filter drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]">
            🛍️
          </span>{" "}
          Creator Shop
        </h2>
        <p className="text-neutral-400 text-xs sm:text-sm tracking-wider uppercase font-semibold">
          Rep the JFF brand with heavy-duty premium armor and equipment drops!
        </p>
      </div>

      {shopLive && items.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-black/80 transition-all hover:bg-gradient-to-r hover:from-[#ff0033] hover:to-[#ff4b5f] hover:text-white md:w-auto"
        >
          <ShoppingCart size={15} />
          View Arsenal Cart
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] bg-[length:200%_auto] animate-aurora-shift text-white rounded-full w-5 h-5 text-[9px] font-black flex items-center justify-center border border-white/20 animate-bounce">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>
      )}
    </div>
  );

  const showGrid = !loading && shopLive && items.length > 0;

  return (
    <section id="merch" className="relative overflow-hidden bg-[#060606] py-20 sm:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {sectionHeader}

        {/* Coming Soon panel — shown while loading, when shop is paused,
            or when the product table is empty. */}
        {!showGrid && (
          <ComingSoonPanel loading={loading} />
        )}

        {showGrid && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card
                key={item.id}
                hoverEffect
                className="border border-white/10 bg-[#181818]/70 hover:border-[#ff0033]/25 transition-all duration-300 flex flex-col justify-between overflow-hidden group h-full shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              >
                <div className="relative aspect-square overflow-hidden bg-[#0f0f0f] border-b border-white/10">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">
                      {item.emoji}
                    </div>
                  )}

                  <span
                    className={`absolute top-3 left-3 text-[8px] font-black px-2 py-0.5 rounded border ${GRADE_BADGE[item.grade]}`}
                  >
                    {item.grade}
                  </span>

                  <span className="absolute bottom-3 right-3 bg-black/85 text-xs font-black text-[#ffffff] px-2.5 py-1 rounded border border-white/10 shadow-lg font-display image-overlay-badge">
                    ${item.price.toFixed(2)}
                  </span>
                </div>

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
        )}

        {/* Brand values footer — kept on both modes to preserve layout */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 border-t border-white/5 pt-8 text-xs font-bold text-neutral-500 sm:mt-16 sm:gap-6">
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

      {/* Cart drawer — only ever rendered when the shop is live and has
          products, so we don't need a guard inside it. */}
      {isCartOpen && showGrid && (
        <div className="fixed inset-0 z-50 bg-[#020208]/80 backdrop-blur-sm flex justify-end">
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 cursor-pointer"
          />
          <div className="relative z-10 flex h-full w-full max-w-md animate-float flex-col justify-between border-l border-[#ff0033]/25 bg-[#181818]/95 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
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

              <div className="mt-6 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500 text-xs space-y-2">
                    <ShoppingCart size={24} className="mx-auto text-neutral-600" />
                    <p>Your arsenal cart is empty. Ready for some epic apparel?</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#0d0d26]/60 border border-white/5 p-3 rounded-xl flex items-center gap-4 animate-fade-in"
                    >
                      <div className="w-14 h-14 bg-[#0f0f0f] border border-white/10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-2xl relative">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
                        ) : (
                          <span>{item.emoji}</span>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 bg-black/85 text-[8px] font-black text-[#ffffff] px-1 py-0.2 rounded image-overlay-badge">
                          x{item.quantity}
                        </span>
                      </div>

                      <div className="flex-grow">
                        <h4 className="font-display font-extrabold text-[11px] text-white uppercase tracking-wide truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

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

const ComingSoonPanel = ({ loading }: { loading: boolean }) => (
  <Card className="border border-white/10 bg-[#181818]/70 overflow-hidden">
    <div className="relative px-5 py-14 text-center sm:px-12 sm:py-20">
      {/* Subtle scanline backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,0,51,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,51,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-xl mx-auto">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-[#ff0033]/30 blur-2xl animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#ff0033]/40 bg-[#0c0c0c] text-[#ff4b5f] shadow-[0_0_24px_rgba(255,0,51,0.35)]">
            <Rocket size={32} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-[#ff4b5f]">
            ●  Loot Vault Sealed
          </p>
          <h3 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            Coming Soon
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            {loading
              ? "Pinging the loot vault…"
              : "The JFF Creator Shop is currently being forged in the cyber-foundry. Hoodies, caps, deskmats, and limited drops are inbound. Stay tuned for the first season launch."}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#contact"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#ff0033] to-[#ff4b5f] text-white text-xs font-black uppercase tracking-widest hover:shadow-[0_0_24px_rgba(255,0,51,0.45)] transition-shadow flex items-center gap-2"
          >
            <Bell size={13} /> Get Notified
          </a>
          <a
            href="#latest"
            className="px-5 py-2.5 rounded-full border border-white/15 bg-white/[0.02] text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-colors"
          >
            Watch Latest Videos
          </a>
        </div>
      </div>
    </div>
  </Card>
);
