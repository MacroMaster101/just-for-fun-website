import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Just For Fun",
  description:
    "How Just For Fun (j4fn.site) collects, uses, and protects your information.",
};

const LAST_UPDATED = "July 4, 2026";

const sections = [
  {
    title: "1. Who We Are",
    body: (
      <>
        <p>
          Just For Fun (&quot;J4FN&quot;, &quot;we&quot;, &quot;us&quot;) is a
          YouTube gaming channel community website available at{" "}
          <a href="https://j4fn.site" className="text-[#ff4b5f] hover:underline">
            https://j4fn.site
          </a>
          . This policy explains what information we collect when you use the
          site and how we handle it.
        </p>
        <p>
          For any privacy questions, contact us at{" "}
          <a
            href="mailto:justforfun.ggez@gmail.com"
            className="text-[#ff4b5f] hover:underline"
          >
            justforfun.ggez@gmail.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "2. Information We Collect",
    body: (
      <>
        <p>
          <strong className="text-white">Account information.</strong> If you
          sign in with Google, we receive your name, email address, and profile
          picture from your Google account. Authentication is handled by
          Supabase; we never see or store your Google password.
        </p>
        <p>
          <strong className="text-white">Activity on the site.</strong> When
          you are signed in, we store the content you create or interact with —
          such as favorites, page ratings, and notification preferences — so
          they persist across visits.
        </p>
        <p>
          <strong className="text-white">Contact form.</strong> If you use the
          contact form, we store the name, email address, and message you
          submit so we can respond to you.
        </p>
        <p>
          <strong className="text-white">Analytics.</strong> We use Vercel
          Analytics and Speed Insights to understand aggregate site usage
          (page views, performance). This data is anonymized and does not
          identify you personally.
        </p>
      </>
    ),
  },
  {
    title: "3. How We Use Your Information",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>To let you sign in and keep your favorites and ratings.</li>
        <li>To respond to messages you send us via the contact form.</li>
        <li>To show community features like schedules and notifications.</li>
        <li>To improve site performance and fix problems.</li>
      </ul>
    ),
  },
  {
    title: "4. What We Do NOT Do",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>We do not sell your personal information to anyone.</li>
        <li>We do not send you marketing emails.</li>
        <li>
          We do not request access to your Google contacts, files, or anything
          beyond your basic profile (name, email, picture).
        </li>
      </ul>
    ),
  },
  {
    title: "5. Third-Party Services",
    body: (
      <>
        <p>The site relies on the following services, each with its own privacy policy:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Google</strong> — sign-in
            (OAuth) and embedded YouTube content.
          </li>
          <li>
            <strong className="text-white">Supabase</strong> — authentication
            and database hosting.
          </li>
          <li>
            <strong className="text-white">Vercel</strong> — website hosting
            and anonymized analytics.
          </li>
        </ul>
        <p>
          Embedded YouTube videos may set their own cookies, governed by
          Google&apos;s privacy policy.
        </p>
      </>
    ),
  },
  {
    title: "6. Cookies & Local Storage",
    body: (
      <p>
        We use cookies strictly for keeping you signed in (session cookies set
        by Supabase) and browser local storage for preferences like theme and
        sound settings. We do not use advertising or cross-site tracking
        cookies.
      </p>
    ),
  },
  {
    title: "7. Data Retention & Deletion",
    body: (
      <p>
        Your account data is kept while your account exists. You can request
        deletion of your account and all associated data (favorites, ratings,
        messages) at any time by emailing{" "}
        <a
          href="mailto:justforfun.ggez@gmail.com"
          className="text-[#ff4b5f] hover:underline"
        >
          justforfun.ggez@gmail.com
        </a>{" "}
        from the address linked to your account. We will process the request
        within 30 days.
      </p>
    ),
  },
  {
    title: "8. Children's Privacy",
    body: (
      <p>
        The site is not directed at children under 13, and we do not knowingly
        collect personal information from them. If you believe a child has
        provided us personal information, contact us and we will delete it.
      </p>
    ),
  },
  {
    title: "9. Changes to This Policy",
    body: (
      <p>
        We may update this policy from time to time. Changes will be posted on
        this page with an updated date at the top. Continued use of the site
        after changes means you accept the updated policy.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft size={14} /> Back to base
      </Link>

      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff0033]/30 bg-[#ff0033]/10 text-[#ff4b5f]">
        <ShieldCheck size={26} />
      </div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">
        Last updated: {LAST_UPDATED}
      </p>

      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="mb-3 font-display text-base font-extrabold uppercase tracking-wide text-[#ff4b5f]">
              {s.title}
            </h2>
            <div className="space-y-3 text-sm leading-7 text-neutral-300">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
