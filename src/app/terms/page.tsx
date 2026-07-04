import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Just For Fun",
  description:
    "The terms and conditions for using the Just For Fun (j4fn.site) website.",
};

const LAST_UPDATED = "July 4, 2026";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: (
      <p>
        By accessing or using{" "}
        <a href="https://j4fn.site" className="text-[#ff4b5f] hover:underline">
          https://j4fn.site
        </a>{" "}
        (the &quot;Site&quot;), operated by the Just For Fun YouTube channel
        (&quot;J4FN&quot;, &quot;we&quot;, &quot;us&quot;), you agree to these
        Terms of Service. If you do not agree, please do not use the Site.
      </p>
    ),
  },
  {
    title: "2. The Service",
    body: (
      <p>
        The Site is a free community hub for the Just For Fun gaming channel.
        It provides YouTube videos and highlights, stream schedules, community
        features such as the soundboard and challenge wheel, and optional
        accounts for saving favorites and ratings. The Site is provided for
        entertainment purposes.
      </p>
    ),
  },
  {
    title: "3. Accounts",
    body: (
      <>
        <p>
          You may sign in using your Google account. You are responsible for
          activity that happens under your account. We may suspend or remove
          accounts that abuse the Site, attempt to disrupt it, or violate these
          terms.
        </p>
        <p>
          You can stop using the Site at any time and request deletion of your
          account data as described in our{" "}
          <Link href="/privacy" className="text-[#ff4b5f] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    title: "4. Acceptable Use",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Do not attempt to hack, overload, or disrupt the Site.</li>
        <li>
          Do not submit spam, abusive, hateful, or unlawful content through
          ratings, the contact form, or any other feature.
        </li>
        <li>Do not impersonate other people or misrepresent your identity.</li>
        <li>
          Do not scrape or harvest data from the Site or its users.
        </li>
      </ul>
    ),
  },
  {
    title: "5. Content & Intellectual Property",
    body: (
      <>
        <p>
          The J4FN name, logo, branding, and original content on the Site
          belong to Just For Fun. YouTube videos remain subject to
          YouTube&apos;s own terms of service. Game names, artwork, and
          trademarks referenced on the Site belong to their respective owners.
        </p>
        <p>
          By submitting content to the Site (such as ratings or messages), you
          grant us permission to store and display it as part of operating the
          Site.
        </p>
      </>
    ),
  },
  {
    title: "6. Third-Party Links & Services",
    body: (
      <p>
        The Site links to and embeds third-party services such as YouTube,
        Twitch, Discord, and Facebook. We are not responsible for the content
        or practices of those services; your use of them is governed by their
        own terms.
      </p>
    ),
  },
  {
    title: "7. Disclaimer & Limitation of Liability",
    body: (
      <>
        <p>
          The Site is provided &quot;as is&quot; and &quot;as available&quot;,
          without warranties of any kind. We do not guarantee the Site will be
          uninterrupted, error-free, or always available.
        </p>
        <p>
          To the maximum extent permitted by law, J4FN shall not be liable for
          any indirect, incidental, or consequential damages arising from your
          use of the Site.
        </p>
      </>
    ),
  },
  {
    title: "8. Changes to These Terms",
    body: (
      <p>
        We may update these terms from time to time. Changes will be posted on
        this page with an updated date. Continued use of the Site after changes
        take effect means you accept the revised terms.
      </p>
    ),
  },
  {
    title: "9. Contact",
    body: (
      <p>
        Questions about these terms? Email us at{" "}
        <a
          href="mailto:justforfun.ggez@gmail.com"
          className="text-[#ff4b5f] hover:underline"
        >
          justforfun.ggez@gmail.com
        </a>
        .
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft size={14} /> Back to base
      </Link>

      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff0033]/30 bg-[#ff0033]/10 text-[#ff4b5f]">
        <ScrollText size={26} />
      </div>
      <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
        Terms of Service
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
