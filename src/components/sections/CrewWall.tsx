"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Users, Sparkles, UserPlus } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";

interface Member {
  id: string;
  name: string;
  avatarUrl: string;
  joinedAt: string;
}

const formatJoined = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "joined recently";
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return "joined today";
  if (days < 2) return "joined yesterday";
  if (days < 30) return `joined ${days}d ago`;
  if (days < 365) return `joined ${Math.floor(days / 30)}mo ago`;
  return `joined ${Math.floor(days / 365)}y ago`;
};

export const CrewWall = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/members", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { members?: Member[]; total?: number };
        if (cancelled) return;
        setMembers(Array.isArray(data.members) ? data.members : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Visible avatars in the main grid. Cap at 30 to keep layout tight;
  // the count chip shows the true total.
  const visible = useMemo(() => members.slice(0, 30), [members]);
  // A second slice rotated through the marquee strip for personality.
  const marquee = useMemo(() => {
    if (members.length === 0) return [];
    // Repeat to fill the strip even with few members.
    const pool = [...members];
    while (pool.length < 12) pool.push(...members);
    return pool.slice(0, 24);
  }, [members]);

  return (
    <section
      id="crew-wall"
      className="relative overflow-hidden bg-[#060606] py-20 sm:py-24"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />
      {/* Subtle scanline grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,0,51,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,51,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-white/5 pb-6 md:flex-row md:items-end">
          <div className="space-y-3">
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-[#ff4b5f] flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#ff0033] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff0033]" />
              </span>
              Crew Online
            </p>
            <h2 className="flex flex-wrap items-center gap-3 font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              <Users
                size={28}
                className="text-[#ff0033] drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]"
              />
              The J4FN Crew Wall
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm tracking-wider uppercase font-semibold">
              {loading
                ? "Pinging the roster…"
                : `${total} ${total === 1 ? "operator" : "operators"} have enlisted in the squad.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-full border border-[#ff0033]/30 bg-[#ff0033]/10 text-[#ff4b5f] text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_16px_rgba(255,0,51,0.18)]">
              <Sparkles size={13} />
              {total} Members
            </div>
          </div>
        </div>

        {/* Empty / error / content */}
        {error ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-neutral-500">
            Couldn&apos;t reach the roster right now. Try again in a moment.
          </div>
        ) : loading ? (
          <SkeletonGrid />
        ) : visible.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <AvatarGrid members={visible} />
            {marquee.length > 0 && <MarqueeStrip members={marquee} />}
          </>
        )}
      </div>
    </section>
  );
};

const AvatarGrid = ({ members }: { members: Member[] }) => (
  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3 sm:gap-4">
    {members.map((m, idx) => (
      <MemberTile key={m.id} member={m} index={idx} />
    ))}
  </div>
);

const MemberTile = ({ member, index }: { member: Member; index: number }) => {
  const src = resolveAvatarUrl(member.avatarUrl, member.id);
  const fallbackLetter = member.name.charAt(0).toUpperCase();
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className="group relative flex flex-col items-center text-center animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 30, 600)}ms` }}
    >
      <div className="relative">
        {/* Glow ring */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#ff0033]/0 via-[#ff0033]/40 to-[#ff4b5f]/0 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-white/10 bg-[#0c0c0c] overflow-hidden group-hover:border-[#ff0033]/60 transition-colors duration-300">
          {imgFailed ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ff0033] to-[#b30024] text-white font-display font-black text-xl">
              {fallbackLetter}
            </div>
          ) : (
            // Using a plain img — DiceBear svg + arbitrary user-provided
            // avatar URLs make next/image's remotePatterns awkward.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={member.name}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        {/* Corner brackets — hover only */}
        <span className="pointer-events-none absolute -top-1 -left-1 h-3 w-3 border-l border-t border-[#ff0033] opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="pointer-events-none absolute -top-1 -right-1 h-3 w-3 border-r border-t border-[#ff0033] opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="pointer-events-none absolute -bottom-1 -left-1 h-3 w-3 border-l border-b border-[#ff0033] opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="pointer-events-none absolute -bottom-1 -right-1 h-3 w-3 border-r border-b border-[#ff0033] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <p className="mt-2.5 font-display text-[10px] sm:text-xs font-black uppercase tracking-wide text-white truncate w-full px-1">
        {member.name}
      </p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500 truncate w-full">
        {formatJoined(member.joinedAt)}
      </p>
    </div>
  );
};

const MarqueeStrip = ({ members }: { members: Member[] }) => (
  <div className="relative mt-10 overflow-hidden rounded-2xl border border-white/5 bg-[#0c0c0c]/60 py-4 sm:mt-16">
    {/* edge fades */}
    <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#060606] to-transparent z-10" />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#060606] to-transparent z-10" />

    <div className="flex gap-6 animate-marquee whitespace-nowrap">
      {[...members, ...members].map((m, i) => (
        <MarqueePill key={`${m.id}-${i}`} member={m} />
      ))}
    </div>
  </div>
);

const MarqueePill = ({ member }: { member: Member }) => {
  const [failed, setFailed] = useState(false);
  const src = resolveAvatarUrl(member.avatarUrl, member.id);
  const letter = member.name.charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 shrink-0 px-2">
      <div className="h-10 w-10 rounded-full border border-white/10 bg-[#0c0c0c] overflow-hidden flex items-center justify-center">
        {failed ? (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ff0033] to-[#b30024] text-white font-display font-black text-sm">
            {letter}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={member.name}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="font-display text-[11px] font-black uppercase tracking-wider text-white">
        {member.name}
        <span className="ml-2 text-[9px] font-bold tracking-[0.18em] text-[#ff4b5f]">
          ●  ONLINE
        </span>
      </div>
    </div>
  );
};

const SkeletonGrid = () => (
  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3 sm:gap-4">
    {Array.from({ length: 20 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-white/10 bg-white/[0.04] animate-pulse" />
        <div className="mt-2.5 h-2 w-12 bg-white/[0.04] rounded animate-pulse" />
        <div className="mt-1 h-2 w-10 bg-white/[0.03] rounded animate-pulse" />
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center sm:p-12">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ff0033]/10 text-[#ff4b5f] mb-4">
      <UserPlus size={22} />
    </div>
    <h3 className="font-display text-xl font-extrabold text-white tracking-tight">
      Be the first to enlist
    </h3>
    <p className="mt-2 text-sm text-neutral-400 max-w-sm mx-auto">
      No operators on the wall yet. Sign up to claim your spot in the JFF crew roster.
    </p>
  </div>
);
