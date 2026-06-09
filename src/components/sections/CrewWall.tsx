"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Sparkles, UserPlus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
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
  const { onlineUserIds, profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadMembers = useCallback(async (signal?: { cancelled: boolean }) => {
    try {
      const res = await fetch("/api/members", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { members?: Member[]; total?: number };
      if (signal?.cancelled) return;
      setMembers(Array.isArray(data.members) ? data.members : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch {
      if (!signal?.cancelled) setError(true);
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const signal = { cancelled: false };
    void loadMembers(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [loadMembers]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // When the signed-in user edits their name/avatar (AuthProvider's shared
  // profile changes), overlay their own tile so the wall reflects the change
  // immediately without a page reload — derived, not stored, to avoid a
  // cascading setState-in-effect.
  const patchedMembers = useMemo(() => {
    if (!profile) return members;
    return members.map((m) =>
      m.id === profile.id
        ? {
            ...m,
            name: profile.name || m.name,
            // Empty string when the custom avatar was removed, so
            // resolveAvatarUrl falls back to the DiceBear default.
            avatarUrl: profile.avatarUrl ?? "",
          }
        : m
    );
  }, [members, profile]);

  // Visible avatars in the main grid. Cap at 30 to keep layout tight;
  // the count chip shows the true total.
  const visible = useMemo(() => patchedMembers.slice(0, 30), [patchedMembers]);
  const onlineCount = useMemo(
    () => patchedMembers.filter((member) => onlineUserIds.has(member.id)).length,
    [patchedMembers, onlineUserIds]
  );

  return (
    <div className="relative z-10 mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-10 flex flex-col justify-between gap-6 border-b border-white/5 pb-6 md:flex-row md:items-end">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#38d56f] sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
            </span>
            {onlineCount} Online
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
        <AvatarGrid members={visible} onlineUserIds={onlineUserIds} />
      )}
    </div>
  );
};

const AvatarGrid = ({
  members,
  onlineUserIds,
}: {
  members: Member[];
  onlineUserIds: Set<string>;
}) => (
  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3 sm:gap-4">
    {members.map((m, idx) => (
      <MemberTile
        key={m.id}
        member={m}
        index={idx}
        isOnline={onlineUserIds.has(m.id)}
      />
    ))}
  </div>
);

const MemberTile = ({
  member,
  index,
  isOnline,
}: {
  member: Member;
  index: number;
  isOnline: boolean;
}) => {
  const src = resolveAvatarUrl(member.avatarUrl, member.id);
  const fallbackLetter = member.name.charAt(0).toUpperCase();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgFailed = failedSrc === src;

  return (
    <div
      className="group relative flex flex-col items-center text-center animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 30, 600)}ms` }}
    >
      <div className="relative">
        {/* Glow ring */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#ff0033]/0 via-[#ff0033]/40 to-[#ff4b5f]/0 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
        <div
          className={`relative h-16 w-16 overflow-hidden rounded-full border bg-[#0c0c0c] transition-colors duration-300 sm:h-20 sm:w-20 ${
            isOnline
              ? "border-[#22c55e]/70 shadow-[0_0_22px_rgba(34,197,94,0.18)] group-hover:border-[#22c55e]"
              : "border-white/15 shadow-[0_0_18px_rgba(255,0,51,0.12)] group-hover:border-[#ff0033]/60"
          }`}
        >
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
              onError={() => setFailedSrc(src)}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        {isOnline && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#050505] bg-[#050505] sm:h-6 sm:w-6"
            title="Online now"
          >
            <span className="absolute h-3.5 w-3.5 animate-ping rounded-full bg-[#22c55e]/60 sm:h-4 sm:w-4" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.95)] sm:h-3 sm:w-3" />
            <span className="sr-only">Online now</span>
          </span>
        )}
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
      No operators on the wall yet. Sign up to claim your spot in the J4FN crew roster.
    </p>
  </div>
);
