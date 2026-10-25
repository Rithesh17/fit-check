import type { Metadata } from "next";
import Link from "next/link";
import { ContactLink, LegalPage, Section } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Pulse",
  description: "The terms that govern your use of Pulse.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <Section title="Agreement to these terms">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
          the Pulse Android app and this website (together, the
          &ldquo;Service&rdquo;). By creating an account or using the Service, you agree
          to these Terms and to our{" "}
          <Link href="/privacy" className="font-semibold text-pulse">
            Privacy Policy
          </Link>
          . If you do not agree, do not use the Service.
        </p>
      </Section>

      <Section title="Eligibility">
        <p>
          You must be at least 13 years old to use the Service. If you are under the
          age of majority where you live, you may use the Service only with the
          consent of a parent or guardian.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          You are responsible for keeping your login credentials secure and for all
          activity that happens under your account. Provide accurate information,
          and tell us promptly at <ContactLink /> if you suspect unauthorized use.
        </p>
      </Section>

      <Section title="Not medical advice">
        <p>
          Pulse is a tool for recording and reviewing your training. It does not
          provide medical, health or fitness advice, and nothing in the Service is a
          substitute for advice from a qualified professional. Consult a physician
          before starting any exercise program. Physical exercise carries an
          inherent risk of injury; you exercise at your own risk and are solely
          responsible for your safety.
        </p>
        <p>
          Statistics shown by the Service, such as estimated one-rep maxes,
          distance, pace and calories, are estimates and may be inaccurate. GPS
          tracking depends on your device and conditions. When running outdoors,
          stay aware of your surroundings and do not interact with the app while it
          is unsafe to do so.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          You own the workouts, notes, measurements and other data you enter into
          the Service (&ldquo;Your Content&rdquo;). You grant us a limited,
          non-exclusive, worldwide, royalty-free license to host, store, process and
          display Your Content solely to operate and provide the Service to you. This license
          ends when you delete Your Content or your account, except for residual
          backup copies kept for a limited time.
        </p>
      </Section>

      <Section title="Intellectual property">
        <p>
          The Service, including its software, design, text, graphics, logos, the
          name &ldquo;Pulse&rdquo;, the exercise library and all other content we provide
          (excluding Your Content), is owned by Pulse or its licensors and is
          protected by copyright, trademark and other intellectual property laws.
          All rights not expressly granted to you are reserved.
        </p>
        <p>
          Subject to these Terms, we grant you a limited, personal, non-exclusive,
          non-transferable, revocable license to use the Service for your own
          personal, non-commercial purposes.
        </p>
      </Section>

      <Section title="No redistribution and other restrictions">
        <p>You agree not to, and not to help anyone else to:</p>
        <ul>
          <li>
            copy, reproduce, redistribute, republish, sell, resell, rent, lease,
            sublicense or otherwise commercially exploit the Service or any part of
            its content;
          </li>
          <li>
            modify, translate or create derivative works based on the Service;
          </li>
          <li>
            decompile, reverse engineer or disassemble the Service, except to the
            extent applicable law expressly permits it;
          </li>
          <li>
            scrape, crawl or harvest data from the Service by automated means, or
            use it to build a competing product;
          </li>
          <li>
            remove, obscure or alter any copyright, trademark or other proprietary
            notices;
          </li>
          <li>
            interfere with or disrupt the Service, probe or breach its security, or
            access accounts or data that are not yours;
          </li>
          <li>
            distribute modified or repackaged copies of the app, or offer the app
            for download anywhere other than our official download page;
          </li>
          <li>
            use the Service for anything unlawful, harmful, harassing or
            fraudulent, or upload content that infringes anyone else&rsquo;s rights.
          </li>
        </ul>
      </Section>

      <Section title="Third-party services">
        <p>
          The Service includes features from third parties, such as Google sign-in,
          embedded YouTube videos and map tiles. Your use of those features is also
          subject to the third parties&rsquo; own terms and policies, and we are not
          responsible for their content or practices.
        </p>
      </Section>

      <Section title="Feedback">
        <p>
          If you send us ideas or suggestions, we may use them without restriction
          or obligation to you.
        </p>
      </Section>

      <Section title="Changes to the Service">
        <p>
          We may change, suspend or discontinue any part of the Service at any time.
          The Service is currently offered free of charge; if we ever introduce paid
          features, we will tell you before you are charged.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You may stop using the Service and delete your account at any time. We may
          suspend or terminate your access if you violate these Terms or if needed
          to protect the Service or other users. Sections that by their nature
          should survive termination, including ownership, disclaimers, limitation
          of liability and governing law, will survive.
        </p>
      </Section>

      <Section title="Disclaimer of warranties">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;, WITHOUT
          WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
          UNINTERRUPTED, ERROR-FREE OR SECURE, OR THAT YOUR DATA WILL NEVER BE LOST.
          KEEP YOUR OWN RECORDS OF ANYTHING IMPORTANT TO YOU.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, PULSE AND ITS OPERATORS WILL NOT
          BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR
          PUNITIVE DAMAGES, OR FOR ANY LOSS OF DATA, PROFITS OR GOODWILL, OR FOR
          PERSONAL INJURY ARISING FROM EXERCISE, ARISING OUT OF OR RELATED TO YOUR
          USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE
          SERVICE WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID US IN THE 12
          MONTHS BEFORE THE CLAIM OR US$50. Some jurisdictions do not allow certain
          of these limitations, so they may not all apply to you.
        </p>
      </Section>

      <Section title="Indemnification">
        <p>
          You agree to indemnify and hold harmless Pulse and its operators from any
          claims, losses and expenses (including reasonable legal fees) arising
          from your misuse of the Service, Your Content, or your violation of these
          Terms or of anyone else&rsquo;s rights.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These Terms are governed by the laws of the State of California, USA,
          without regard to its conflict-of-law rules. Any dispute arising from
          these Terms or the Service will be brought exclusively in the state or
          federal courts located in California, and you consent to their
          jurisdiction, except where the law of your place of residence gives you
          the right to bring a claim locally.
        </p>
      </Section>

      <Section title="General">
        <p>
          These Terms and the Privacy Policy are the entire agreement between you
          and us about the Service. If any provision is found unenforceable, the
          rest remain in effect. Our failure to enforce a provision is not a waiver.
          You may not assign these Terms without our consent; we may assign them in
          connection with a merger, acquisition or sale of assets.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these Terms from time to time. We will revise the effective
          date above, and for material changes we will provide notice through the
          Service. Continuing to use the Service after a change means you accept
          the updated Terms.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these Terms? Email <ContactLink />.
        </p>
      </Section>
    </LegalPage>
  );
}
