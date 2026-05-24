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
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  ExternalLink,
  Menu,
  X,
  Compass,
  Users,
  MessageSquare,
  Clock,
  Heart
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

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

export default function AdminPage() {
  const { user } = useAuth();
  
  // Security & Loading states
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(5);
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState<"command" | "inbox" | "admins" | "cache">("command");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [admins, setAdmins] = useState<AdminEmail[]>([]);
  
  // Message reading modal/drawer state
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  
  // Admin form state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminFormError, setAdminFormError] = useState<string | null>(null);
  const [adminFormSuccess, setAdminFormSuccess] = useState<string | null>(null);
  
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

  // Load active tab data
  useEffect(() => {
    if (!isAdmin) return;

    if (activeTab === "inbox") {
      fetchMessages();
    } else if (activeTab === "admins") {
      fetchAdmins();
    }
  }, [activeTab, isAdmin]);

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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-grid-subtle opacity-20" />
        <div className="relative text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#ff0033] animate-spin" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
            Validating Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Access denied view
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-grid-subtle opacity-30" />
        <Card className="max-w-md w-full p-8 border-[#ff0033]/20 bg-[#0d0d0d]/80 backdrop-blur-xl text-center space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(255,0,51,0.15)]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff0033]" />
          
          <div className="inline-flex p-4 rounded-full bg-red-950/40 border border-red-500/20 text-[#ff2d55] animate-pulse">
            <ShieldAlert size={40} />
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl tracking-wide uppercase text-white">
              Access Denied
            </h1>
            <p className="text-xs font-semibold tracking-wider text-[#ff0033] uppercase">
              Section Restricted to Administrators
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed pt-2">
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
    <div className="min-h-screen bg-[#060606] text-white bg-grid-subtle pt-24 pb-16 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-8 mb-10">
          <div className="space-y-1.5">
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight flex items-center gap-3">
              <span className="text-[#ff0033] drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]">⚙️</span> Control Console
            </h1>
            <p className="text-neutral-400 text-xs tracking-wider uppercase font-semibold">
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
          <div className="lg:col-span-3 space-y-2">
            {[
              { id: "command", name: "Command Center", icon: <Compass size={16} /> },
              { id: "inbox", name: "Contact Inbox", icon: <MessageSquare size={16} /> },
              { id: "admins", name: "Administration", icon: <Users size={16} /> },
              { id: "cache", name: "YouTube Cache", icon: <RefreshCw size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex w-full items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm tracking-wide transition border text-left cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[#ff0033] bg-[#ff0033]/10 text-white shadow-[0_0_20px_rgba(255,0,51,0.15)]"
                    : "border-white/5 bg-[#101010]/80 text-neutral-400 hover:border-white/10 hover:text-white"
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
                  <Card className="p-6 border-white/5 bg-[#101010]/70 backdrop-blur relative overflow-hidden group hover:border-[#ff0033]/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff0033]/5 to-transparent rounded-full -mr-8 -mt-8" />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest">Database messages</span>
                        <MessageSquare size={18} className="text-[#ff2d55]" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">Live</span>
                        <Badge variant="success" pulse>Connected</Badge>
                      </div>
                      <p className="text-neutral-400 text-xs leading-relaxed">
                        Communications inbox is fully operational and storing viewer submissions.
                      </p>
                    </div>
                  </Card>

                  {/* Card 2 */}
                  <Card className="p-6 border-white/5 bg-[#101010]/70 backdrop-blur relative overflow-hidden group hover:border-[#ff0033]/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff0033]/5 to-transparent rounded-full -mr-8 -mt-8" />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest">Admin security</span>
                        <Users size={18} className="text-[#ff2d55]" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">Active</span>
                        <Badge variant="primary">Filtered</Badge>
                      </div>
                      <p className="text-neutral-400 text-xs leading-relaxed">
                        Control Console access is limited strictly to active administrator accounts.
                      </p>
                    </div>
                  </Card>

                  {/* Card 3 */}
                  <Card className="p-6 border-white/5 bg-[#101010]/70 backdrop-blur relative overflow-hidden group hover:border-[#ff0033]/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff0033]/5 to-transparent rounded-full -mr-8 -mt-8" />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest">API Sync Status</span>
                        <Clock size={18} className="text-[#ff2d55]" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">Cache</span>
                        <Badge variant="success">Standby</Badge>
                      </div>
                      <p className="text-neutral-400 text-xs leading-relaxed">
                        YouTube video cache tables are operating normally.
                      </p>
                    </div>
                  </Card>
                </div>

                <Card className="p-8 border-white/5 bg-[#101010]/60 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#ff0033]" />
                  <div className="space-y-4">
                    <h3 className="font-display font-extrabold text-xl text-white">
                      🎮 Welcome to the Command Console
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      This secure admin panel allows you to direct all backend actions for the **Just For Fun Gaming Channel** website.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-lg bg-neutral-900/60 border border-white/5 space-y-2">
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">Inbox Control</h4>
                        <p className="text-xs text-neutral-500">Read incoming feedback, respond directly using one-click SMTP email integration, and purge database logs once handled.</p>
                      </div>
                      <div className="p-4 rounded-lg bg-neutral-900/60 border border-white/5 space-y-2">
                        <h4 className="text-xs font-black uppercase text-white tracking-widest">Admin Roster</h4>
                        <p className="text-xs text-neutral-500">Add trusted creators and co-hosts by entering their emails. Only people in the roster are authorized to access this console.</p>
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
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                    <input
                      type="text"
                      placeholder="Search messages by name, email, or content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#101010]/90 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-[#ff0033]/50 text-white placeholder-neutral-500"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchMessages} className="gap-2 shrink-0">
                    <RefreshCw size={14} /> Refresh Inbox
                  </Button>
                </div>

                <Card className="border-white/5 bg-[#101010]/60 backdrop-blur overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 font-mono text-[9px] uppercase tracking-widest text-neutral-500 bg-neutral-900/40">
                          <th className="p-4">Sender</th>
                          <th className="p-4">Message Snippet</th>
                          <th className="p-4">Submitted At</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMessages.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-xs text-neutral-500">
                              No messages found in your inbox.
                            </td>
                          </tr>
                        ) : (
                          filteredMessages.map((msg) => (
                            <tr 
                              key={msg.id} 
                              className="border-b border-white/5 hover:bg-white/5 transition-colors group/row cursor-pointer"
                              onClick={() => setSelectedMessage(msg)}
                            >
                              <td className="p-4">
                                <div className="font-semibold text-xs text-white truncate max-w-[150px]">{msg.name}</div>
                                <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">{msg.email}</div>
                              </td>
                              <td className="p-4 max-w-[280px]">
                                <p className="text-xs text-neutral-300 truncate">{msg.message}</p>
                              </td>
                              <td className="p-4 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
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
                                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:border-[#ff0033]/50 hover:text-white transition"
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
                    <h3 className="font-display font-extrabold text-lg text-white">
                      🛡️ Active Administrators
                    </h3>
                    <Button variant="outline" size="sm" onClick={fetchAdmins}>
                      <RefreshCw size={12} />
                    </Button>
                  </div>
                  
                  <Card className="border-white/5 bg-[#101010]/60 backdrop-blur overflow-hidden">
                    <div className="divide-y divide-white/5">
                      {admins.length === 0 ? (
                        <div className="p-8 text-center text-xs text-neutral-500">Loading administrators...</div>
                      ) : (
                        admins.map((admin) => {
                          const isSelf = admin.email === user?.email?.toLowerCase().trim();
                          return (
                            <div key={admin.email} className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate flex items-center gap-2">
                                  {admin.email}
                                  {isSelf && <Badge variant="success">You</Badge>}
                                </p>
                                <p className="text-[10px] text-neutral-500 pt-0.5">
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
                  <h3 className="font-display font-extrabold text-lg text-white">
                    ➕ Add Administrator
                  </h3>
                  <Card className="p-6 border-white/10 bg-[#141414]/90 backdrop-blur-xl">
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

            {/* Tab 4: YouTube Cache controls */}
            {activeTab === "cache" && (
              <div className="space-y-6">
                <Card className="p-8 border-white/5 bg-[#101010]/60 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#ff0033]" />
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-display font-extrabold text-xl text-white">
                        🔄 YouTube Data Caching & Management
                      </h3>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        To prevent your site from exhausting the daily YouTube API quota (10,000 units), video data is cached in PostgreSQL and served directly to viewers. 
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 space-y-4">
                      <h4 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-[#ff0033]" /> Caching Specifications
                      </h4>
                      <ul className="space-y-2 text-xs text-neutral-400 list-disc list-inside pl-1">
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

      {/* Expanded Message Modal/Drawer Overlay */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <Card className="max-w-2xl w-full p-8 border-white/10 bg-[#0d0d0d]/95 backdrop-blur-2xl relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-fade-in-up">
            <button 
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <div className="flex items-baseline gap-2">
                  <Badge variant="primary" className="mb-2">Message Detail</Badge>
                </div>
                <h3 className="font-display font-extrabold text-2xl text-white truncate">
                  {selectedMessage.name}
                </h3>
                <p className="text-xs text-[#ff4b5f] font-semibold pt-1">
                  <a href={`mailto:${selectedMessage.email}`} className="hover:underline">
                    {selectedMessage.email}
                  </a>
                </p>
                <p className="text-[10px] text-neutral-500 pt-1 font-mono uppercase tracking-wider">
                  Submitted: {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Message Content:</p>
                <div className="p-5 rounded-xl bg-neutral-900/60 border border-white/5 text-sm text-neutral-200 leading-relaxed max-h-[250px] overflow-y-auto whitespace-pre-wrap border-l-2 border-[#ff0033]">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
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
    </div>
  );
}
