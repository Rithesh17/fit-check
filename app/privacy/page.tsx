import type { Metadata } from "next";
import { ContactLink, LegalPage, Section } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Pulse",
  description: "How Pulse collects, uses and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <Section title="Overview">
        <p>
          This Privacy Policy explains how Pulse (&ldquo;Pulse&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;) collects, uses and protects information when you use the
          Pulse Android app and this website (together, the &ldquo;Service&rdquo;).
          By using the Service you agree to the practices described here.
        </p>
        <p>
          The short version: we collect only what is needed to run the Service, we
          do not sell your personal information, and we do not use advertising or
          third-party analytics trackers.
        </p>
      </Section>

      <Section title="Information we collect">
        <p>
          <strong>Account information.</strong> When you create an account we
          collect your email address and a password (stored only in hashed form by
          our authentication provider). If you sign in with Google, we receive your
          name, email address and profile picture from Google. We do not receive
          your Google password.
        </p>
        <p>
          <strong>Fitness data you enter.</strong> Workouts, exercises, sets,
          weights and repetitions, routines and templates, schedules, goals, notes,
          and body metrics and measurements such as body weight and body
          composition.
        </p>
        <p>
          <strong>Location data (mobile app only).</strong> When you record a run,
          the app collects your device&rsquo;s precise GPS location to map your route
          and calculate distance and pace. This happens only while a run is being
          recorded, including while the screen is off or the app is in the
          background during that run. Location is never collected at other times.
        </p>
        <p>
          <strong>Technical information.</strong> Like most online services, our
          hosting and database providers automatically process basic technical
          data such as IP address, browser or device type and request timestamps,
          for security and to keep the Service running.
        </p>
      </Section>

      <Section title="How we use your information">
        <ul>
          <li>To create and secure your account and sign you in.</li>
          <li>
            To store, sync and display your fitness data across your devices, and to
            compute statistics such as personal records, volume and progress.
          </li>
          <li>To show workout reminders you choose to schedule (on your device).</li>
          <li>To respond to your requests and support questions.</li>
          <li>
            To maintain, protect and improve the Service, and to comply with legal
            obligations.
          </li>
        </ul>
        <p>
          We do not sell, rent or trade your personal information, and we do not use
          it for advertising.
        </p>
      </Section>

      <Section title="Health and fitness information">
        <p>
          Some of the information you log, such as body weight, body composition and
          training history, may be considered sensitive. We use it only to provide
          the Service to you. Pulse is not a medical service and does not provide
          medical advice.
        </p>
      </Section>

      <Section title="Service providers">
        <p>
          We rely on a small number of providers who process data on our behalf,
          only as needed to run the Service:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> &mdash; database and authentication; stores your
            account and fitness data.
          </li>
          <li>
            <strong>Netlify</strong> &mdash; hosting for this website.
          </li>
          <li>
            <strong>GitHub</strong> &mdash; hosts the Android app download. GitHub
            processes standard request data (such as your IP address) when you
            download it.
          </li>
          <li>
            <strong>Google</strong> &mdash; optional &ldquo;Sign in with Google&rdquo;.
          </li>
          <li>
            <strong>YouTube</strong> &mdash; exercise demonstration videos are embedded
            from YouTube. When you play one, YouTube may collect information under{" "}
            <a
              href="https://policies.google.com/privacy"
              className="font-semibold text-pulse"
              target="_blank"
              rel="noreferrer"
            >
              Google&rsquo;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>OpenFreeMap</strong> &mdash; map tiles for run routes in the mobile
            app. Your device requests map images for the area being displayed.
          </li>
        </ul>
        <p>
          We may also disclose information if required by law, to protect the
          rights, safety or property of Pulse or others, or as part of a merger,
          acquisition or sale of assets, in which case this policy will continue to
          apply to your information.
        </p>
      </Section>

      <Section title="Cookies and local storage">
        <p>
          This website does not set cookies or use trackers. The app stores your
          data in a local database on your device so it works offline, and keeps
          your sign-in session in the device&rsquo;s secure storage. We do not use
          advertising or tracking cookies anywhere.
        </p>
      </Section>

      <Section title="Data retention and deletion">
        <p>
          We keep your information for as long as your account is active. You can
          ask us to delete your account and all associated data at any time by
          emailing <ContactLink /> from the address on your account; we will do so
          within 30 days. Deleted data is removed from our
          active database promptly; residual copies in provider backups expire on
          their normal schedule. Data stored locally by the mobile app is removed
          when you sign out with a different account or uninstall the app.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Data is encrypted in transit using HTTPS, access to your records is
          restricted to your account by database-level access rules, and mobile
          sign-in tokens are kept in the device&rsquo;s secure storage. No method of
          transmission or storage is completely secure, however, and we cannot
          guarantee absolute security.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct,
          export or delete your personal information, to object to or restrict
          certain processing, and to withdraw consent. California residents have
          rights under the CCPA/CPRA, including the right to know what personal
          information we collect and the right to delete it; we do not sell or
          share personal information as those terms are defined there. To exercise
          any of these rights, email <ContactLink />. We will not discriminate
          against you for exercising them.
        </p>
      </Section>

      <Section title="Children">
        <p>
          The Service is not directed to children under 13, and we do not knowingly
          collect personal information from them. If you believe a child has given
          us personal information, contact us and we will delete it.
        </p>
      </Section>

      <Section title="International users">
        <p>
          Our providers may store and process information in the United States and
          other countries. By using the Service you understand that your information
          may be transferred to countries with different data protection laws than
          your own.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. When we do, we will
          revise the effective date above, and for material changes we will provide
          notice through the Service. Continuing to use the Service after a change
          means you accept the updated policy.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this policy or your data? Email <ContactLink />.
        </p>
      </Section>
    </LegalPage>
  );
}
