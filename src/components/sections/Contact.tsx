"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

export const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccess("Your message has been sent successfully!");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send message. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="relative py-24 bg-slate-950 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-violet-600/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-violet-500">✉️</span> Get in Touch
          </h2>
          <p className="text-slate-400 text-sm tracking-wider uppercase font-semibold">
            Business inquiries, collaborations, or just want to say hi? Drop a message!
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-cyan-500 mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch max-w-5xl mx-auto">
          {/* Left Column: Information Card */}
          <div className="lg:col-span-5 flex flex-col justify-between p-8 rounded-2xl border border-white/5 bg-slate-900/35 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-violet-600/10 blur-xl pointer-events-none rounded-full" />
            
            <div className="space-y-6 relative z-10">
              <h3 className="font-display font-extrabold text-2xl text-white tracking-wide">
                📬 Let&apos;s Talk!
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Whether you have a business proposal, want to collaborate on content, suggest games, or just share your thoughts — I&apos;d love to hear from you!
              </p>
              
              <div className="space-y-3 pt-4">
                {[
                  "💼 Business Inquiries",
                  "🤝 Collaboration Ideas",
                  "💡 Game Recommendations",
                  "💬 Viewer Feedback & Suggestions",
                ].map((reason) => (
                  <div
                    key={reason}
                    className="bg-slate-950 border border-white/5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300"
                  >
                    {reason}
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 tracking-wider font-semibold uppercase mt-8 border-t border-white/5 pt-4">
              Average response time: 24-48 hours
            </p>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <Card className="p-8 border border-white/10 bg-slate-900/60 backdrop-blur-md">
              <form onSubmit={handleSubmit} className="space-y-5">
                {success && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-4 text-xs text-emerald-300">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-950/40 border border-red-500/20 p-4 text-xs text-red-300">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="Your Name"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  label="Your Email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Textarea
                  label="Your Message"
                  required
                  placeholder="Write your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                <Button
                  type="submit"
                  disabled={loading}
                  glow
                  fullWidth
                  className="gap-2 pt-3 pb-3"
                >
                  {loading ? "Sending..." : "Send Message"}{" "}
                  <Send size={16} className="ml-1" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
