import Link from "next/link";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { FluteSoundControl } from "@/components/audio/FluteSoundControl";
import { GuestbookProvider } from "@/components/guestbook/GuestbookProvider";
import { GuestFeatherField } from "@/components/guestbook/GuestFeatherField";
import { GuestFeatherMessage } from "@/components/guestbook/GuestFeatherMessage";
import { LeaveFeatherForm } from "@/components/guestbook/LeaveFeatherForm";
import { PeacockScene } from "@/components/peacock/PeacockScene";
import { SiteHeader } from "@/components/peacock/SiteHeader";
import { NavigationTracker } from "@/components/recruiter/NavigationTracker";
import { interactiveFeathers } from "@/data/featherConfig";

/**
 * Every route shares this layout, so the peacock (and its state machine), the
 * wind and the music all stay mounted while the URL changes.
 *
 * Paint order (back → front): guest feathers · peacock · panels · header ·
 * Quick View · notes and the leave-a-feather form.
 */
export default function PeacockLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestbookProvider>
      <NavigationTracker />
      <AnalyticsProvider />
      <SiteHeader />
      <main id="main">
        <PeacockScene />
        <GuestFeatherField />
        {children}
        <noscript>
          <nav className="noscript-index" aria-label="Sections">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- no-JS fallback */}
            <a href="/about">About</a>
            {interactiveFeathers.map((f) => (
              <a key={f.id} href={f.href}>
                {f.label}
              </a>
            ))}
          </nav>
        </noscript>
      </main>
      <GuestFeatherMessage />
      <LeaveFeatherForm />
      <footer className="site-footer">
        <p className="credit">
          Peacock illustration designed by Freepik ·{" "}
          <Link href="/privacy" className="credit-link">
            Privacy
          </Link>
        </p>
        <FluteSoundControl />
      </footer>
    </GuestbookProvider>
  );
}
