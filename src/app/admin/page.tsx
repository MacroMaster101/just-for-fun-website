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
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  userId: string | null;
  createdAt: string;
}

interface AdminEmail {
  email: string;
  createdAt: string;
}

interface MusicTrack {
  id: string;
  title: string;
  youtubeId: string;
  isActive: boolean;
  createdAt: string;
}

interface SquadMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  favoriteGames: string[];
  signatureAgent: string;
  twitchUrl: string | null;
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
  mouse: string;
  bio: string;
  combatStyle: string;
  sortOrder: number;
}

const emptySquadMember: Omit<SquadMember, "id"> = {
  name: "",
  role: "",
  avatarUrl: "",
  favoriteGames: [],
  signatureAgent: "",
  twitchUrl: null,
  cpu: "",
  gpu: "",
  ram: "",
  monitor: "",
  mouse: "",
  bio: "",
  combatStyle: "",
  sortOrder: 0,
};

export default function AdminPage() {
  const { user } = useAuth();
  
  // Security & Loading states
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(5);
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState<"command" | "inbox" | "admins" | "cache" | "music" | "squad">("command");
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
  
  // Admin form state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminFormError, setAdminFormError] = useState<string | null>(null);
  const [adminFormSuccess, setAdminFormSuccess] = useState<string | null>(null);
  
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
  }, [user]);

  // Handle redirect if not admin
  useEffect(() => {
    if (isAdmin !== false) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAdmin]);

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
      const res = await fetch("/api/admin/music");
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
    try {
      const res = await fetch("/api/admin/music", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to activate track.");
      } else {
        fetchTracks();
      }
    } catch {
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
      // Trigger live video sync cache
      const res = await fetch("/api/youtube/refresh", {
        headers: {
          "Authorization": `Bearer ${process.env.CRON_SECRET || "687b0749df9041f66d10f8f4a97f006d52ba0eb9f00f622a64940f9167edf666"}`
        }
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
            onClick={() => { window.location.href = "/"; }}
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
              onClick={() => { window.location.href = "/"; }}
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
                          label="YouTube Video ID"
                          type="text"
                          required
                          placeholder="e.g. h7MYJghRWt0"
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

              {/* Tab 6: YouTube Cache controls */}
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

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--color-border)]">
                <a 
                  href={`mailto:${selectedMessage.email}?subject=Reply from JFF Gaming Channel&body=Hi ${selectedMessage.name},%0D%0A%0D%0A`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full font-bold text-sm tracking-wide bg-gradient-to-r from-[#ff0033] to-[#ff2d55] text-white py-2.5 transition active:scale-[0.98] shadow-lg shadow-[#ff0033]/25 cursor-pointer text-center"
                >
                  <Mail size={16} /> Reply via Email
                </a>
                
                <Button 
                  variant="danger" 
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="gap-2"
                >
                  <Trash2 size={16} /> Delete Message
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

interface SquadMemberEditorProps {
  initial: SquadMember | (Omit<SquadMember, "id"> & { id?: string });
  isNew: boolean;
  avatarUploading: boolean;
  onAvatarUpload: (memberId: string, file: File) => void;
  onCancel: () => void;
  onSave: (member: SquadMember | Omit<SquadMember, "id">, isNew: boolean) => void;
}

const SquadMemberEditor = ({
  initial,
  isNew,
  avatarUploading,
  onAvatarUpload,
  onCancel,
  onSave,
}: SquadMemberEditorProps) => {
  const [form, setForm] = useState(initial);
  const [gamesInput, setGamesInput] = useState((initial.favoriteGames || []).join(", "));

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    const games = gamesInput
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);
    onSave({ ...form, favoriteGames: games }, isNew);
  };

  const onAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isNew || !("id" in form) || !form.id) {
      alert("Save the member first, then upload an avatar.");
      return;
    }
    onAvatarUpload(form.id, file);
  };

  const memberId = "id" in form ? form.id : undefined;

  return (
    <Card className="p-6 border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-display font-extrabold text-lg text-[var(--color-text)]">
          {isNew ? "New Squad Member" : `Edit: ${form.name || "Unnamed"}`}
        </h4>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] cursor-pointer"
          aria-label="Close editor"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identity */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            Avatar
          </label>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display font-black text-xl text-[var(--color-text)]">
                  {form.name.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={form.avatarUrl}
                onChange={(e) => update("avatarUrl", e.target.value)}
                placeholder="https://..."
              />
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[var(--color-text-muted)] cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={onAvatarFile}
                    disabled={isNew || avatarUploading}
                    className="hidden"
                  />
                  <span
                    className={`inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 transition ${
                      isNew || avatarUploading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-[#ff0033]/40 hover:text-[var(--color-text)]"
                    }`}
                  >
                    <Plus size={12} />
                    {avatarUploading ? "Uploading…" : isNew ? "Save first" : "Upload image"}
                  </span>
                </label>
                {memberId && form.avatarUrl && (
                  <span className="text-[10px] text-[var(--color-text-muted)] truncate">
                    Saved to Supabase storage.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Name *</label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Kavisha (GGEZ)" className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Role *</label>
          <Input value={form.role} onChange={(e) => update("role", e.target.value)} placeholder="Founder / Main Duelist" className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Signature Agent</label>
          <Input value={form.signatureAgent} onChange={(e) => update("signatureAgent", e.target.value)} placeholder="Jett / Reyna" className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Combat Style</label>
          <Input value={form.combatStyle} onChange={(e) => update("combatStyle", e.target.value)} placeholder="Aggressive / W-Key Warrior" className="mt-2" />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Favorite Games (comma-separated)</label>
          <Input value={gamesInput} onChange={(e) => setGamesInput(e.target.value)} placeholder="Valorant, Valheim, GTA V" className="mt-2" />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            placeholder="Short bio shown in the operator details card."
            className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Twitch URL (optional)</label>
          <Input value={form.twitchUrl ?? ""} onChange={(e) => update("twitchUrl", e.target.value || null)} placeholder="https://www.twitch.tv/..." className="mt-2" />
        </div>

        {/* Specs */}
        <div className="md:col-span-2 pt-2 border-t border-[var(--color-border)]">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#ff0033] mb-3">Hardware Specs</h5>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">CPU</label>
          <Input value={form.cpu} onChange={(e) => update("cpu", e.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">GPU</label>
          <Input value={form.gpu} onChange={(e) => update("gpu", e.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">RAM</label>
          <Input value={form.ram} onChange={(e) => update("ram", e.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Monitor</label>
          <Input value={form.monitor} onChange={(e) => update("monitor", e.target.value)} className="mt-2" />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Mouse</label>
          <Input value={form.mouse} onChange={(e) => update("mouse", e.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Sort Order</label>
          <Input
            type="number"
            value={String(form.sortOrder)}
            onChange={(e) => update("sortOrder", Number(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit}>{isNew ? "Add Member" : "Save Changes"}</Button>
      </div>
    </Card>
  );
};
