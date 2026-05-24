"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Trash2,
  Plus,
  RefreshCw,
  Mail,
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  Compass,
  Users,
  MessageSquare,
  Clock,
  UserCog,
  Radio,
  Settings,
  Bot,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";
import { SplineRobot } from "@/components/ui/SplineRobot";
import { SquadMemberEditor } from "./SquadMemberEditor";
import {
  emptySquadMember,
  type AdminEmail,
  type ContactMessage,
  type MusicTrack,
  type SquadMember,
} from "./types";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Security & Loading states
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(5);
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState<"command" | "inbox" | "admins" | "cache" | "music" | "squad" | "settings">("command");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [admins, setAdmins] = useState<AdminEmail[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [editingMember, setEditingMember] = useState<SquadMember | null>(null);
  const [creatingMember, setCreatingMember] = useState<Omit<SquadMember, "id"> | null>(null);
  const [squadFormError, setSquadFormError] = useState<string | null>(null);
  const [squadFormSuccess, setSquadFormSuccess] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  // Message reading modal/drawer state
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  // Clear the reply form whenever the open message changes so the previous
  // draft/error doesn't bleed into a different conversation.
  const openedMessageId = selectedMessage?.id ?? null;
  useEffect(() => {
    // Reset form state whenever the open message id changes (including to
    // null). The setState calls inside an effect are a deliberate "external
    // event (modal opened) -> internal state reset" sync, not a render
    // cascade — guarded by the openedMessageId dependency so it only runs
    // when the open message actually changes.
    /* eslint-disable react-hooks/set-state-in-effect */
    setReplyText("");
    setReplyError(null);
    setReplySuccess(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [openedMessageId]);
  
  // Admin form state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminFormError, setAdminFormError] = useState<string | null>(null);
  const [adminFormSuccess, setAdminFormSuccess] = useState<string | null>(null);
  
  // Site settings form state (Spline scene URL etc.)
  const [splineSceneUrl, setSplineSceneUrl] = useState("");
  const [splineSceneSaved, setSplineSceneSaved] = useState(""); // tracks original for diff
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Music form state
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackYoutubeId, setNewTrackYoutubeId] = useState("");
  const [musicFormError, setMusicFormError] = useState<string | null>(null);
  const [musicFormSuccess, setMusicFormSuccess] = useState<string | null>(null);
  
  // Syncing states
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Check admin status
  // Depend on the user *id*, not the user object itself. Supabase emits a new
  // user object on every TOKEN_REFRESHED / USER_UPDATED event (same id, new
  // reference) which would otherwise re-fire this admin check on every JWT
  // refresh — observed as a flurry of /api/admin/check calls in the logs.
  const userId = user?.id ?? null;
  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/admin/check");
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (active) {
          setIsAdmin(data.isAdmin);
          setChecking(false);
        }
      } catch {
        if (active) {
          setIsAdmin(false);
          setChecking(false);
        }
      }
    };

    checkStatus();
    return () => { active = false; };
  }, [userId]);

  // Handle redirect if not admin
  useEffect(() => {
    if (isAdmin !== false) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAdmin, router]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/emails");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    }
  };

  const fetchTracks = async () => {
    try {
      const res = await fetch("/api/admin/music", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error("Failed to fetch music tracks:", err);
    }
  };

  const fetchSquad = async () => {
    try {
      const res = await fetch("/api/admin/squad");
      if (res.ok) {
        const data = await res.json();
        setSquad(data.members);
      }
    } catch (err) {
      console.error("Failed to fetch squad:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const sceneUrl = (data.settings?.["hero.splineScene"] as string | undefined) ?? "";
      setSplineSceneUrl(sceneUrl);
      setSplineSceneSaved(sceneUrl);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const handleSaveSpline = async () => {
    setSettingsError(null);
    setSettingsSuccess(null);
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero.splineScene", value: splineSceneUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSettingsError(data.error || "Failed to save.");
        return;
      }
      setSplineSceneSaved(splineSceneUrl.trim());
      setSettingsSuccess("Robot scene updated. Refresh the homepage to see it.");
      setTimeout(() => setSettingsSuccess(null), 4000);
    } catch {
      setSettingsError("Network error.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const flashSquadSuccess = (msg: string) => {
    setSquadFormSuccess(msg);
    setSquadFormError(null);
    setTimeout(() => setSquadFormSuccess(null), 2500);
  };

  const handleSaveMember = async (member: SquadMember | Omit<SquadMember, "id">, isNew: boolean) => {
    setSquadFormError(null);
    setSquadFormSuccess(null);
    if (!member.name.trim() || !member.role.trim()) {
      setSquadFormError("Name and role are required.");
      return;
    }
    try {
      const res = await fetch("/api/admin/squad", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });
      const data = await res.json();
      if (!res.ok) {
        setSquadFormError(data.error || "Save failed.");
        return;
      }
      flashSquadSuccess(isNew ? "Member added." : "Member updated.");
      setEditingMember(null);
      setCreatingMember(null);
      await fetchSquad();
    } catch (err) {
      console.error("Failed to save squad member:", err);
      setSquadFormError("Network error.");
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the squad?`)) return;
    try {
      const res = await fetch("/api/admin/squad", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        flashSquadSuccess("Member removed.");
        await fetchSquad();
      }
    } catch (err) {
      console.error("Failed to delete squad member:", err);
    }
  };

  const handleAvatarUpload = async (memberId: string, file: File) => {
    setAvatarUploading(true);
    setSquadFormError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("memberId", memberId);
      const res = await fetch("/api/admin/squad/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setSquadFormError(data.error || "Avatar upload failed.");
        return;
      }
      flashSquadSuccess("Avatar updated.");
      // Refresh the editing form with the new URL.
      setEditingMember((prev) =>
        prev && prev.id === memberId ? { ...prev, avatarUrl: data.avatarUrl } : prev
      );
      await fetchSquad();
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      setSquadFormError("Network error.");
    } finally {
      setAvatarUploading(false);
    }
  };

  // Load active tab data. The fetch helpers update state from an async response —
  // a valid "external data → react state" sync pattern that the lint rule flags
  // because it can't see past the synchronous call.
  useEffect(() => {
    if (!isAdmin) return;

    /* eslint-disable react-hooks/set-state-in-effect */
    if (activeTab === "inbox") {
      fetchMessages();
    } else if (activeTab === "admins") {
      fetchAdmins();
    } else if (activeTab === "music") {
      fetchTracks();
    } else if (activeTab === "squad") {
      fetchSquad();
    } else if (activeTab === "settings") {
      fetchSettings();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [activeTab, isAdmin]);

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact message?")) return;
    try {
      const res = await fetch("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage) return;
    setReplyError(null);
    setReplySuccess(null);
    const trimmed = replyText.trim();
    if (!trimmed) {
      setReplyError("Reply cannot be empty.");
      return;
    }
    setReplySending(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedMessage.id, reply: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReplyError(data.error || "Failed to send reply.");
        return;
      }
      // Patch both the messages list and the open modal with the new reply
      // fields so the UI reflects "replied" state without a re-fetch.
      const replyTimestamp = new Date().toISOString();
      const patch = (m: ContactMessage): ContactMessage =>
        m.id === selectedMessage.id
          ? { ...m, replyText: trimmed, repliedAt: replyTimestamp, repliedBy: m.repliedBy }
          : m;
      setMessages((prev) => prev.map(patch));
      setSelectedMessage((m) => (m ? patch(m) : m));
      setReplyText("");
      const deliveryNote =
        data.delivery === "notification"
          ? "Sent as in-app notification."
          : data.delivery === "email"
            ? "Sent via email."
            : "Saved (email/notification skipped — check SMTP config).";
      setReplySuccess(deliveryNote);
    } catch (err) {
      console.error("Failed to send reply:", err);
      setReplyError("Network error.");
    } finally {
      setReplySending(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError(null);
    setAdminFormSuccess(null);

    const email = newAdminEmail.toLowerCase().trim();
    if (!email) {
      setAdminFormError("Please enter an email address.");
      return;
    }

    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAdminFormError(data.error || "Failed to add administrator.");
      } else {
        setAdminFormSuccess("Administrator added successfully!");
        setNewAdminEmail("");
        fetchAdmins();
      }
    } catch {
      setAdminFormError("Something went wrong. Please try again.");
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from administrators?`)) return;
    try {
      const res = await fetch("/api/admin/emails", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to remove administrator.");
      } else {
        setAdmins((prev) => prev.filter((a) => a.email !== email));
      }
    } catch {
      alert("Failed to remove administrator.");
    }
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setMusicFormError(null);
    setMusicFormSuccess(null);

    const title = newTrackTitle.trim();
    const youtubeId = newTrackYoutubeId.trim();

    if (!title || !youtubeId) {
      setMusicFormError("Title and YouTube Video ID are required.");
      return;
    }

    try {
      const res = await fetch("/api/admin/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, youtubeId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMusicFormError(data.error || "Failed to add music track.");
      } else {
        setMusicFormSuccess("Background music track added successfully!");
        setNewTrackTitle("");
        setNewTrackYoutubeId("");
        fetchTracks();
      }
    } catch {
      setMusicFormError("Something went wrong. Please try again.");
    }
  };

  const handleActivateTrack = async (id: string) => {
    // Optimistic update so the ACTIVE badge swaps immediately. We snapshot
    // the previous list so we can roll back if the server call fails.
    const previousTracks = tracks;
    setTracks((prev) => prev.map((t) => ({ ...t, isActive: t.id === id })));
    try {
      const res = await fetch("/api/admin/music", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTracks(previousTracks);
        alert(data.error || "Failed to activate track.");
        return;
      }
      // Server returns the fresh list from inside the transaction — use it
      // directly instead of a separate GET that could race the commit.
      if (Array.isArray(data.tracks)) {
        setTracks(data.tracks);
      }
    } catch {
      setTracks(previousTracks);
      alert("Failed to activate track.");
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm("Are you sure you want to delete this background music track?")) return;
    try {
      const res = await fetch("/api/admin/music", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete music track.");
      } else {
        fetchTracks();
      }
    } catch {
      alert("Failed to delete music track.");
    }
  };

  const handleSyncCache = async () => {
    setSyncing(true);
    setSyncSuccess(null);
    setSyncError(null);

    try {
      // Trigger live video sync cache. The refresh route accepts admin
      // session cookies as authorization (in addition to the CRON_SECRET
      // bearer token used by Vercel Cron), so we don't ship the secret
      // to the browser bundle.
      const res = await fetch("/api/youtube/refresh", {
        method: "POST",
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok) {
        setSyncSuccess("YouTube Cache refreshed successfully!");
      } else {
        setSyncError(data.message || "Cache sync failed.");
      }
    } catch {
      setSyncError("Network error. Unable to trigger Cache sync.");
    } finally {
      setSyncing(false);
    }
  };

  // Loading view
  if (checking) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center relative transition-colors duration-300">
        <div className="absolute inset-0 bg-grid-subtle opacity-20" />
        <div className="relative text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--color-border)]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#ff0033] animate-spin" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
            Validating Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Access denied view
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6 relative transition-colors duration-300">
        <div className="absolute inset-0 bg-grid-subtle opacity-30" />
        <Card className="max-w-md w-full p-8 border-[#ff0033]/20 bg-[var(--color-bg-soft)]/80 backdrop-blur-xl text-center space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(255,0,51,0.15)]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff0033]" />
          
          <div className="inline-flex p-4 rounded-full bg-red-950/40 border border-red-500/20 text-[#ff2d55] animate-pulse">
            <ShieldAlert size={40} />
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl tracking-wide uppercase text-[var(--color-text)]">
              Access Denied
            </h1>
            <p className="text-xs font-semibold tracking-wider text-[#ff0033] uppercase">
              Section Restricted to Administrators
            </p>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed pt-2">
              Your account holds insufficient privileges to access this console. You are being redirected to the homepage in <span className="font-mono text-[#ff2d55] font-bold text-base">{countdown}</span> seconds.
            </p>
          </div>

          <Button 
            variant="outline" 
            fullWidth 
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <ArrowLeft size={16} /> Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  // Filter messages for search
  const filteredMessages = messages.filter((m) => {
    const query = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      m.message.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] bg-grid-subtle pt-28 pb-16 relative transition-colors duration-300">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {/* Top Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-8 mb-10">
            <div className="space-y-1.5">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-[var(--color-text)] tracking-tight flex items-center gap-3">
                <UserCog className="text-[#ff0033] animate-spin-slow drop-shadow-[0_0_8px_rgba(255,0,51,0.4)]" size={32} />
                Control Console
              </h1>
              <p className="text-[var(--color-text-muted)] text-xs tracking-wider uppercase font-semibold">
                Manage administrators, review client communications, and coordinate platform operations.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push("/")}
              className="gap-2"
            >
              <ArrowLeft size={14} /> Back to Website
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Tab Menu Selector */}
            <div className="lg:col-span-3 space-y-2.5">
              {[
                { id: "command", name: "Command Center", icon: <Compass size={16} /> },
                { id: "inbox", name: "Contact Inbox", icon: <MessageSquare size={16} /> },
                { id: "admins", name: "Administration", icon: <Users size={16} /> },
                { id: "music", name: "Music Stream", icon: <Radio size={16} /> },
                { id: "squad", name: "Squad Roster", icon: <Users size={16} /> },
                { id: "settings", name: "Site Settings", icon: <Settings size={16} /> },
                { id: "cache", name: "YouTube Cache", icon: <RefreshCw size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex w-full items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 border text-left cursor-pointer ${
                    activeTab === tab.id
                      ? "border-[#ff0033] bg-[#ff0033]/10 text-[#ff0033] shadow-[0_0_20px_rgba(255,0,51,0.12)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-soft)]/50 text-[var(--color-text-muted)] hover:border-[#ff0033]/30 hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Right Column: Dynamic Content cards */}
            <div className="lg:col-span-9">
              
              {/* Tab 1: Command Center Overview */}
              {activeTab === "command" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <Card hoverEffect className="p-6 border-[var(--color-border)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff0033]/5 to-transparent rounded-full -mr-8 -mt-8" />
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--color-text-subtle)] font-mono text-[10px] uppercase tracking-widest">Database messages</span>
                          <MessageSquare size={18} className="text-[#ff2d55]" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[var(--color-text)]">Live</span>
                          <Badge variant="success" pulse>Connected</Badge>
                        </div>
                        <p className="text-[var(--color-text-muted)] text-xs leading-relaxed">
                          Communications inbox is fully operational and storing viewer submissions.
                        </p>
                      </div>
                    </Card>

                    {/* Card 2 */}
                    <Card hoverEffect className="p-6 border-[var(--color-border)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff0033]/5 to-transparent rounded-full -mr-8 -mt-8" />
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--color-text-subtle)] font-mono text-[10px] uppercase tracking-widest">Admin security</span>
                          <Users size={18} className="text-[#ff2d55]" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[var(--color-text)]">Active</span>
                          <Badge variant="primary">Filtered</Badge>
                        </div>
                        <p className="text-[var(--color-text-muted)] text-xs leading-relaxed">
                          Control Console access is limited strictly to active administrator accounts.
                        </p>
                      </div>
                    </Card>

                    {/* Card 3 */}
                    <Card hoverEffect className="p-6 border-[var(--color-border)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff0033]/5 to-transparent rounded-full -mr-8 -mt-8" />
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--color-text-subtle)] font-mono text-[10px] uppercase tracking-widest">API Sync Status</span>
                          <Clock size={18} className="text-[#ff2d55]" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[var(--color-text)]">Cache</span>
                          <Badge variant="success">Standby</Badge>
                        </div>
                        <p className="text-[var(--color-text-muted)] text-xs leading-relaxed">
                          YouTube video cache tables are operating normally.
                        </p>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-4">
                      <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                        🎮 Welcome to the Command Console
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                        This secure admin panel allows you to direct all backend actions for the **Just For Fun Gaming Channel** website.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] space-y-2">
                          <h4 className="text-xs font-black uppercase text-[var(--color-text)] tracking-widest">Inbox Control</h4>
                          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">Read incoming feedback, respond directly using one-click SMTP email integration, and purge database logs once handled.</p>
                        </div>
                        <div className="p-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] space-y-2">
                          <h4 className="text-xs font-black uppercase text-[var(--color-text)] tracking-widest">Admin Roster</h4>
                          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">Add trusted creators and co-hosts by entering their emails. Only people in the roster are authorized to access this console.</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Tab 2: Contact Messages Inbox */}
              {activeTab === "inbox" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                      <input
                        type="text"
                        placeholder="Search messages by name, email, or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--color-bg-soft)]/80 border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-subtle)] rounded-full py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-[#ff0033]/50 focus:ring-1 focus:ring-[#ff0033]/30 transition-all duration-300"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchMessages} className="gap-2 shrink-0">
                      <RefreshCw size={14} /> Refresh Inbox
                    </Button>
                  </div>

                  <Card className="border-[var(--color-border)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] bg-[var(--color-surface-2)]/60">
                            <th className="p-4">Sender</th>
                            <th className="p-4">Message Snippet</th>
                            <th className="p-4">Submitted At</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMessages.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-12 text-center text-xs text-[var(--color-text-muted)]">
                                No messages found in your inbox.
                              </td>
                            </tr>
                          ) : (
                            filteredMessages.map((msg) => (
                              <tr 
                                key={msg.id} 
                                className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/40 transition-colors group/row cursor-pointer"
                                onClick={() => setSelectedMessage(msg)}
                              >
                                <td className="p-4">
                                  <div className="font-semibold text-xs text-[var(--color-text)] truncate max-w-[150px]">{msg.name}</div>
                                  <div className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[150px]">{msg.email}</div>
                                </td>
                                <td className="p-4 max-w-[280px]">
                                  <p className="text-xs text-[var(--color-text-muted)] truncate">{msg.message}</p>
                                </td>
                                <td className="p-4 text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                                  {new Date(msg.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-2">
                                    <a 
                                      href={`mailto:${msg.email}?subject=Reply from JFF Gaming Channel&body=Hi ${msg.name},%0D%0A%0D%0A`}
                                      className="p-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[#ff0033]/50 hover:text-[var(--color-text)] transition"
                                      title="Reply via Email"
                                    >
                                      <Mail size={14} />
                                    </a>
                                    <button
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="p-2 rounded-lg bg-red-950/20 border border-red-500/10 text-[#ff4b5f] hover:bg-[#ff0033]/20 hover:border-[#ff0033] hover:text-white transition"
                                      title="Delete Submission"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* Tab 3: Admins Management CRUD */}
              {activeTab === "admins" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* Roster list */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-extrabold text-lg text-[var(--color-text)]">
                        🛡️ Active Administrators
                      </h3>
                      <Button variant="outline" size="sm" onClick={fetchAdmins}>
                        <RefreshCw size={12} />
                      </Button>
                    </div>
                    
                    <Card className="border-[var(--color-border)] overflow-hidden">
                      <div className="divide-y divide-[var(--color-border)]">
                        {admins.length === 0 ? (
                          <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">Loading administrators...</div>
                        ) : (
                          admins.map((admin) => {
                            const isSelf = admin.email === user?.email?.toLowerCase().trim();
                            return (
                              <div key={admin.email} className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-2)]/40 transition-colors">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--color-text)] truncate flex items-center gap-2">
                                    {admin.email}
                                    {isSelf && <Badge variant="success">You</Badge>}
                                  </p>
                                  <p className="text-[10px] text-[var(--color-text-muted)] pt-0.5">
                                    Registered: {new Date(admin.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveAdmin(admin.email)}
                                  disabled={isSelf}
                                  className="p-2 rounded-lg bg-red-950/20 border border-red-500/10 text-[#ff4b5f] hover:bg-[#ff0033]/20 hover:border-[#ff0033] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                                  title={isSelf ? "You cannot remove your own admin access" : "Remove Administrator"}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Add admin form */}
                  <div className="md:col-span-5 space-y-4">
                    <h3 className="font-display font-extrabold text-lg text-[var(--color-text)]">
                      ➕ Add Administrator
                    </h3>
                    <Card className="p-6 border-[var(--color-border)]">
                      <form onSubmit={handleAddAdmin} className="space-y-4">
                        {adminFormError && (
                          <div className="flex items-start gap-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 p-4 text-xs text-rose-300">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                            <span>{adminFormError}</span>
                          </div>
                        )}
                        
                        {adminFormSuccess && (
                          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-4 text-xs text-emerald-300">
                            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                            <span>{adminFormSuccess}</span>
                          </div>
                        )}

                        <Input
                          label="New Admin Email"
                          type="email"
                          required
                          placeholder="co-host@example.com"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                        />

                        <Button type="submit" variant="aurora" glow fullWidth className="gap-2">
                          <UserPlus size={16} /> Authorize Admin
                        </Button>
                      </form>
                    </Card>
                  </div>
                </div>
              )}

              {/* Tab 4: Music Stream CRUD */}
              {activeTab === "music" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-fade-in-up">
                  {/* Tracks list */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-extrabold text-lg text-[var(--color-text)] flex items-center gap-2">
                        <Radio size={20} className="text-[#ff0033] animate-pulse" />
                        Music Library
                      </h3>
                      <Button variant="outline" size="sm" onClick={fetchTracks}>
                        <RefreshCw size={12} />
                      </Button>
                    </div>
                    
                    <Card className="border-[var(--color-border)] overflow-hidden">
                      <div className="divide-y divide-[var(--color-border)]">
                        {tracks.length === 0 ? (
                          <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                            No custom music tracks added. The site is currently playing the default Synthwave stream.
                          </div>
                        ) : (
                          tracks.map((track) => (
                            <div key={track.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-2)]/40 transition-colors">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[var(--color-text)] truncate flex items-center gap-2">
                                  🎵 {track.title}
                                  {track.isActive && <Badge variant="success" className="ml-1" pulse>Active</Badge>}
                                </p>
                                <p className="text-[10px] text-[var(--color-text-muted)] font-mono pt-0.5">
                                  Video ID: {track.youtubeId} · Added: {new Date(track.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {!track.isActive && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleActivateTrack(track.id)}
                                    className="px-3.5 py-1 text-[10px]"
                                  >
                                    Activate
                                  </Button>
                                )}
                                <button
                                  onClick={() => handleDeleteTrack(track.id)}
                                  className="p-2 rounded-lg bg-red-950/20 border border-red-500/10 text-[#ff4b5f] hover:bg-[#ff0033]/20 hover:border-[#ff0033] hover:text-white transition"
                                  title="Delete Music Track"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Add track form */}
                  <div className="md:col-span-5 space-y-4">
                    <h3 className="font-display font-extrabold text-lg text-[var(--color-text)]">
                      ➕ Add Custom Track
                    </h3>
                    <Card className="p-6 border-[var(--color-border)]">
                      <form onSubmit={handleAddTrack} className="space-y-4">
                        {musicFormError && (
                          <div className="flex items-start gap-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 p-4 text-xs text-rose-300">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                            <span>{musicFormError}</span>
                          </div>
                        )}
                        
                        {musicFormSuccess && (
                          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-4 text-xs text-emerald-300">
                            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                            <span>{musicFormSuccess}</span>
                          </div>
                        )}

                        <Input
                          label="Track Title"
                          type="text"
                          required
                          placeholder="e.g. Chill Synthwave Beat 2026"
                          value={newTrackTitle}
                          onChange={(e) => setNewTrackTitle(e.target.value)}
                        />

                        <Input
                          label="YouTube Video ID or URL"
                          type="text"
                          required
                          placeholder="h7MYJghRWt0 or https://youtu.be/h7MYJghRWt0"
                          value={newTrackYoutubeId}
                          onChange={(e) => setNewTrackYoutubeId(e.target.value)}
                        />

                        <Button type="submit" variant="aurora" glow fullWidth className="gap-2">
                          <Plus size={16} /> Register Track
                        </Button>
                      </form>
                    </Card>
                    
                    {/* Tips box */}
                    <Card className="p-4 border-[var(--color-border)] bg-[var(--color-surface-2)]/30 text-xs text-[var(--color-text-muted)] space-y-2">
                      <p className="font-black uppercase tracking-wider text-[9px] text-[#ff0033]">💡 How to find the YouTube Video ID?</p>
                      <p className="leading-relaxed">Copy the 11-character code at the end of the YouTube video URL.</p>
                      <p className="font-mono text-[10px] text-[var(--color-text)] bg-[var(--color-surface-2)] p-2 rounded border border-[var(--color-border)]">https://youtube.com/watch?v=<span className="text-[#ff0033] font-bold">h7MYJghRWt0</span></p>
                    </Card>
                  </div>
                </div>
              )}

              {/* Tab 5: Squad Roster CRUD */}
              {activeTab === "squad" && (
                <div className="space-y-6">
                  <Card className="p-6 border-[var(--color-border)]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                      <div>
                        <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                          ⚔️ Squad Roster
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          Edit the operators shown on the homepage <code className="bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded text-[10px]">Meet the Squad</code> section.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setCreatingMember({ ...emptySquadMember });
                          setEditingMember(null);
                          setSquadFormError(null);
                          setSquadFormSuccess(null);
                        }}
                        className="gap-2"
                      >
                        <Plus size={14} /> Add Member
                      </Button>
                    </div>

                    {squadFormError && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
                        <AlertTriangle size={14} /> {squadFormError}
                      </div>
                    )}
                    {squadFormSuccess && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs font-bold text-green-500">
                        <CheckCircle2 size={14} /> {squadFormSuccess}
                      </div>
                    )}

                    {/* Roster list */}
                    {squad.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
                        No members yet. Click <strong>Add Member</strong> to create the first one — the homepage will fall back to the built-in default trio until then.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {squad.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
                          >
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                              {m.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="font-display font-black text-sm text-[var(--color-text)]">
                                  {m.name.charAt(0).toUpperCase() || "?"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-[var(--color-text)] truncate">{m.name}</p>
                              <p className="text-xs text-[var(--color-text-muted)] truncate">{m.role}</p>
                            </div>
                            <div className="hidden sm:flex flex-wrap gap-1">
                              {m.favoriteGames.slice(0, 2).map((g) => (
                                <Badge key={g} variant="secondary" className="text-[9px]">{g}</Badge>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingMember(m);
                                setCreatingMember(null);
                                setSquadFormError(null);
                                setSquadFormSuccess(null);
                              }}
                              className="gap-1.5"
                            >
                              <UserCog size={12} /> Edit
                            </Button>
                            <button
                              onClick={() => handleDeleteMember(m.id, m.name)}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                              aria-label={`Delete ${m.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Editor — single form rendered for either create or edit */}
                  {(editingMember || creatingMember) && (
                    <SquadMemberEditor
                      key={editingMember?.id || "new"}
                      initial={editingMember || (creatingMember as Omit<SquadMember, "id"> & { id?: string })}
                      isNew={!editingMember}
                      avatarUploading={avatarUploading}
                      onAvatarUpload={handleAvatarUpload}
                      onCancel={() => {
                        setEditingMember(null);
                        setCreatingMember(null);
                        setSquadFormError(null);
                      }}
                      onSave={(member, isNew) => handleSaveMember(member, isNew)}
                    />
                  )}
                </div>
              )}

              {/* Tab 6: Site Settings */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff0033]/15 text-[#ff4b5f]">
                          <Bot size={18} />
                        </div>
                        <div>
                          <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                            Hero Robot (Spline scene)
                          </h3>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Swap the 3D model in the hero section without a redeploy.
                          </p>
                        </div>
                      </div>

                      {/* Currently active scene — shows what the homepage is using right now. */}
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
                              <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                              Currently active
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 ${
                              splineSceneSaved
                                ? "bg-[#ff0033]/15 text-[#ff4b5f]"
                                : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                            }`}
                          >
                            {splineSceneSaved ? "DB override" : "Built-in default"}
                          </span>
                        </div>
                        {splineSceneSaved ? (
                          <p className="font-mono text-[11px] text-[var(--color-text)] break-all leading-relaxed">
                            {splineSceneSaved}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--color-text-muted)]">
                            No DB override saved — the homepage is rendering the original built-in robot. Paste a custom Spline URL below to change it.
                          </p>
                        )}
                      </div>

                      {/* Live preview of the current scene. Re-keyed on splineSceneSaved
                          so it remounts when admin saves a new URL. */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                          Live preview
                        </label>
                        <div className="relative w-full aspect-video max-w-md rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                          <SplineRobot
                            key={splineSceneSaved || "default"}
                            scene={splineSceneSaved || undefined}
                            className="absolute inset-0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                          Update scene URL
                        </label>
                        <Input
                          type="text"
                          placeholder="https://prod.spline.design/.../scene.splinecode"
                          value={splineSceneUrl}
                          onChange={(e) => setSplineSceneUrl(e.target.value)}
                        />
                        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                          Open your scene on <a href="https://spline.design" target="_blank" rel="noopener noreferrer" className="text-[#ff4b5f] hover:underline">spline.design</a>, click <strong>Export</strong> &rarr; <strong>Code Export</strong> &rarr; <strong>React</strong>, and copy the URL ending in <code className="bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded text-[10px]">.splinecode</code>. Save an empty string to fall back to the built-in default.
                        </p>
                      </div>

                      {settingsError && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
                          <AlertTriangle size={14} /> {settingsError}
                        </div>
                      )}
                      {settingsSuccess && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs font-bold text-green-500">
                          <CheckCircle2 size={14} /> {settingsSuccess}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setSplineSceneUrl("")}
                          disabled={settingsSaving || splineSceneUrl === ""}
                        >
                          Use default
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setSplineSceneUrl(splineSceneSaved)}
                          disabled={splineSceneUrl === splineSceneSaved || settingsSaving}
                        >
                          Revert
                        </Button>
                        <Button
                          onClick={handleSaveSpline}
                          disabled={
                            settingsSaving || splineSceneUrl.trim() === splineSceneSaved.trim()
                          }
                          className="gap-2"
                        >
                          {settingsSaving ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Tab 7: YouTube Cache controls */}
              {activeTab === "cache" && (
                <div className="space-y-6">
                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                          🔄 YouTube Data Caching & Management
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                          To prevent your site from exhausting the daily YouTube API quota (10,000 units), video data is cached in PostgreSQL and served directly to viewers. 
                        </p>
                      </div>

                      <div className="p-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] space-y-4">
                        <h4 className="text-xs font-black uppercase text-[var(--color-text)] tracking-widest flex items-center gap-2">
                          <Clock size={14} className="text-[#ff0033]" /> Caching Specifications
                        </h4>
                        <ul className="space-y-2 text-xs text-[var(--color-text-muted)] list-disc list-inside pl-1">
                          <li>Loads video title, description, thumbnail URLs, and stats.</li>
                          <li>Stores payload inside the `YouTubeCache` table.</li>
                          <li>System refreshes cache periodically via background cron triggers.</li>
                        </ul>
                      </div>

                      {syncSuccess && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-4 text-xs text-emerald-300">
                          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                          <span>{syncSuccess}</span>
                        </div>
                      )}

                      {syncError && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 p-4 text-xs text-rose-300">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <span>{syncError}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <Button
                          variant="primary"
                          glow
                          onClick={handleSyncCache}
                          disabled={syncing}
                          className="gap-2 px-6"
                        >
                          <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                          {syncing ? "Syncing YouTube Cache..." : "Sync Cache Now"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Expanded Message Modal/Drawer Overlay */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <Card glass className="max-w-2xl w-full p-8 border-[var(--color-border)] bg-[var(--color-bg-soft)]/95 backdrop-blur-2xl relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in-up">
            <button 
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-6">
              <div className="border-b border-[var(--color-border)] pb-4">
                <div className="flex items-baseline gap-2">
                  <Badge variant="primary" className="mb-2">Message Detail</Badge>
                </div>
                <h3 className="font-display font-extrabold text-2xl text-[var(--color-text)] truncate">
                  {selectedMessage.name}
                </h3>
                <p className="text-xs text-[#ff4b5f] font-semibold pt-1">
                  <a href={`mailto:${selectedMessage.email}`} className="hover:underline">
                    {selectedMessage.email}
                  </a>
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] pt-1 font-mono uppercase tracking-wider">
                  Submitted: {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">Message Content:</p>
                <div className="p-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text)] leading-relaxed max-h-[250px] overflow-y-auto whitespace-pre-wrap border-l-2 border-[#ff0033]">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Existing reply (if admin already replied previously). */}
              {selectedMessage.replyText && (
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
                    Sent Reply
                    {selectedMessage.repliedAt && (
                      <span className="ml-2 text-neutral-500 normal-case">
                        · {new Date(selectedMessage.repliedAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                  <div className="p-4 rounded-xl bg-[#0c0c0c] border border-emerald-500/20 text-sm text-neutral-200 leading-relaxed max-h-[180px] overflow-y-auto whitespace-pre-wrap border-l-2 border-emerald-500">
                    {selectedMessage.replyText}
                  </div>
                </div>
              )}

              {/* Compose new reply. */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
                  {selectedMessage.replyText ? "Send another reply" : "Reply"}
                  <span className="ml-2 text-neutral-500 normal-case">
                    · {selectedMessage.userId ? "in-app notification" : "via email"}
                  </span>
                </p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder={`Hi ${selectedMessage.name},\n\n`}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30 resize-none"
                />
                {replyError && (
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-1.5">
                    <AlertTriangle size={11} /> {replyError}
                  </p>
                )}
                {replySuccess && (
                  <p className="text-[11px] font-bold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 size={11} /> {replySuccess}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--color-border)]">
                <Button
                  onClick={handleSendReply}
                  disabled={replySending || !replyText.trim()}
                  className="flex-1 gap-2"
                >
                  <Mail size={16} /> {replySending ? "Sending…" : "Send Reply"}
                </Button>

                <Button
                  variant="danger"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="gap-2"
                >
                  <Trash2 size={16} /> Delete
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
