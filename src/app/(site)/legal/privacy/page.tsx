import type { Metadata } from "next";
import Link from "next/link";

import { LegalLayout, type LegalSection } from "@/components/legal/LegalLayout";
import {
  ArchiveIcon,
  BoxIcon,
  CustomsIcon,
  EyeIcon,
  GlobeIcon,
  LockIcon,
  MailIcon,
  RouteIcon,
  ShieldIcon,
  SupportIcon,
  TargetIcon,
} from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { absoluteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SwiftTrack Private Delivery Company collects, uses, shares and retains personal information, and the choices available to you.",
  alternates: { canonical: absoluteUrl("/legal/privacy") },
};

const EFFECTIVE_DATE = "2026-07-30";

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    icon: TargetIcon,
    body: (
      <>
        <p>
          {BRAND.legalName} is a private delivery company registered in {BRAND.headquarters.city},{" "}
          {BRAND.headquarters.country}. In this policy, &quot;we&quot;, &quot;us&quot; and
          &quot;SwiftTrack&quot; mean that company, and &quot;you&quot; means anyone whose personal
          information we handle, whether you send a shipment, receive one or simply contact us.
        </p>
        <p>
          We are the controller of the personal information described here. Where we act only on the
          instructions of a business customer, for example handling recipient details supplied under
          a corporate account, that customer is the controller and we act as their processor.
        </p>
        <p>
          Questions about this policy go to{" "}
          <a href={`mailto:${BRAND.privacyEmail}`}>{BRAND.privacyEmail}</a>.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    icon: BoxIcon,
    body: (
      <>
        <p>We collect only what is needed to move a shipment and answer questions about it.</p>
        <ul>
          <li>
            <strong>Shipment details.</strong> Sender and recipient names, addresses, email
            addresses and phone numbers, plus a description of the contents, declared value, weight
            and dimensions.
          </li>
          <li>
            <strong>Operational records.</strong> Scan events with timestamps and locations, the
            facility and courier involved, internal handling notes, and any exception raised during
            transit.
          </li>
          <li>
            <strong>Contact records.</strong> Messages you send us through the contact form, by
            email or by phone, and our replies.
          </li>
          <li>
            <strong>Delivery feedback.</strong> If you rate a delivery, the rating and any comment
            you write.
          </li>
          <li>
            <strong>Limited technical data.</strong> To protect the tracking lookup and the contact
            form from abuse, we store a one way hash of the network address a request came from. We
            do not store the address itself, and the hash cannot be reversed back into it.
          </li>
        </ul>
        <p>
          We do not use advertising cookies, we do not run third party analytics or tracking
          scripts, and we do not build behavioural profiles. The only cookies this site sets are the
          session cookies required for SwiftTrack staff to sign in to the operations area.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    icon: RouteIcon,
    body: (
      <>
        <p>Your information is used for these purposes and no others:</p>
        <ul>
          <li>Collecting, transporting, clearing and delivering shipments.</li>
          <li>Producing the tracking record and making it available to whoever holds the number.</li>
          <li>Preparing customs and export documentation required by law.</li>
          <li>Answering enquiries, investigating problems and handling claims.</li>
          <li>
            Measuring our own service performance, such as how often deliveries arrive by the
            estimated date.
          </li>
          <li>Preventing fraud and abuse of our public endpoints.</li>
          <li>Meeting legal, tax and regulatory obligations.</li>
        </ul>
        <p>
          We do not sell personal information, we do not rent contact lists, and we do not share
          your details with anyone for their own marketing.
        </p>
      </>
    ),
  },
  {
    id: "public-tracking",
    title: "What is visible on a tracking page",
    icon: EyeIcon,
    body: (
      <>
        <p>
          This is the part of the policy most worth reading carefully, because it is the one that
          surprises people.
        </p>
        <p>
          <strong>
            Anyone who has the tracking number can see the tracking page for that shipment.
          </strong>{" "}
          There is no password on it. A tracking page shows the sender and recipient names, the
          delivery address as it appears on the waybill, the service level, package type, weight,
          the estimated delivery date and the full history of scan events with their times and
          locations.
        </p>
        <p>
          The tracking page deliberately never shows: phone numbers, email addresses, declared
          value, internal operational notes, the identity of individual staff, or any event we have
          marked internal.
        </p>
        <p>
          Because the tracking number is the key, treat it the way you would treat any other
          reference that unlocks information about you. Share a tracking link only with people you
          are content to show the delivery address to. We ask search engines not to index individual
          tracking pages, and we rate limit lookups so the numbers cannot be guessed at scale.
        </p>
        <p>
          If you are a business customer and this level of disclosure does not suit your shipments,
          contact us before booking and we will discuss what can be configured.
        </p>
      </>
    ),
  },
  {
    id: "legal-bases",
    title: "Why we are allowed to use it",
    icon: CustomsIcon,
    body: (
      <>
        <p>
          Where data protection law requires a lawful basis, we rely on the following, depending on
          the situation:
        </p>
        <ul>
          <li>
            <strong>Performance of a contract.</strong> Carrying and delivering a shipment you or
            your sender asked us to carry.
          </li>
          <li>
            <strong>Legal obligation.</strong> Customs declarations, export controls, tax records
            and lawful requests from authorities.
          </li>
          <li>
            <strong>Legitimate interests.</strong> Keeping the network secure, preventing abuse,
            investigating claims and measuring our own performance. We balance these against your
            interests and use the least data that achieves the purpose.
          </li>
          <li>
            <strong>Consent.</strong> Optional things such as leaving a delivery rating. You can
            decline without any effect on the shipment.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    icon: GlobeIcon,
    body: (
      <>
        <p>We share personal information only where it is necessary:</p>
        <ul>
          <li>
            <strong>Customs and border authorities</strong> in the origin and destination countries,
            as required for clearance.
          </li>
          <li>
            <strong>Delivery partners</strong> who complete the final leg in cities where SwiftTrack
            does not operate its own couriers. They receive only what is needed to deliver.
          </li>
          <li>
            <strong>Service providers</strong> who host our systems under contract. Our application
            and database are hosted on Supabase infrastructure.
          </li>
          <li>
            <strong>Authorities and legal advisers</strong> where we are legally obliged to
            disclose, or where it is necessary to establish or defend a legal claim.
          </li>
        </ul>
        <p>
          International delivery necessarily involves transferring information across borders,
          including to countries whose data protection laws differ from those where the shipment
          originated. Where required, we put appropriate safeguards in place with the recipients of
          that information.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    icon: ArchiveIcon,
    body: (
      <>
        <p>
          We keep shipment and tracking records for as long as we need them to run the service, and
          then for as long as customs, tax and limitation periods require. In practice that means
          operational records outlive the delivery itself, because a claim or an audit can arrive
          long after a package has arrived.
        </p>
        <ul>
          <li>
            <strong>Shipment and scan records:</strong> retained while the shipment is active and
            for the period required by customs and tax rules afterwards.
          </li>
          <li>
            <strong>Contact messages:</strong> retained while the enquiry is open and for a
            reasonable period afterwards in case it is reopened.
          </li>
          <li>
            <strong>Abuse prevention hashes:</strong> short lived, and never linked to an identity.
          </li>
          <li>
            <strong>Archived shipments:</strong> removed from public tracking immediately when
            archived, and retained internally for audit.
          </li>
        </ul>
        <p>
          The precise retention periods for a given shipment depend on the countries involved. Ask
          us and we will tell you what applies to yours.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    icon: LockIcon,
    body: (
      <>
        <p>
          Access to shipment data is restricted at the database itself rather than only in the
          application. Every table carries row level security policies, so a request that is not
          from an authorised, active operations account returns nothing at all. Public tracking runs
          through a single narrow function that returns a fixed set of approved fields and cannot
          reach anything else.
        </p>
        <ul>
          <li>Operations accounts are individually issued and can be deactivated immediately.</li>
          <li>
            Every create, update and archive action by an operator is written to an audit log with
            the account that performed it.
          </li>
          <li>All traffic to this site is encrypted in transit.</li>
          <li>
            Public endpoints are rate limited, and lookups are logged without the tracking number so
            our own logs do not become a record of who searched for what.
          </li>
        </ul>
        <p>
          No system is perfectly secure. If we become aware of a breach affecting your personal
          information, we will notify you and the relevant authorities where the law requires it.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    icon: ShieldIcon,
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>Ask what personal information we hold about you and receive a copy.</li>
          <li>Ask us to correct information that is wrong or incomplete.</li>
          <li>Ask us to delete information we no longer have a reason to keep.</li>
          <li>Object to, or ask us to restrict, certain uses of your information.</li>
          <li>Withdraw consent where we relied on it, such as for a delivery rating.</li>
          <li>Complain to your local data protection authority.</li>
        </ul>
        <p>
          To exercise any of these, write to{" "}
          <a href={`mailto:${BRAND.privacyEmail}`}>{BRAND.privacyEmail}</a>. We will ask for enough
          information to be confident we are talking to the right person, which protects you as much
          as us.
        </p>
        <p>
          Some requests we cannot fully grant. We cannot delete a customs declaration we are legally
          required to retain, and we cannot remove a shipment record that is the subject of an open
          claim. Where we refuse, we will tell you why.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    icon: SupportIcon,
    body: (
      <>
        <p>
          Our services are for businesses and adults. We do not knowingly collect personal
          information from children. If you believe a child has provided us with personal
          information, contact{" "}
          <a href={`mailto:${BRAND.privacyEmail}`}>{BRAND.privacyEmail}</a> and we will remove what
          we are able to remove.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    icon: MailIcon,
    body: (
      <>
        <p>
          When we change this policy we will update the effective date at the top of the page. If a
          change materially affects how we use information we already hold, we will take reasonable
          steps to tell affected customers directly rather than relying on you noticing a new date.
        </p>
        <p>
          Our <Link href="/legal/terms">Terms of Service</Link> govern the carriage of shipments and
          sit alongside this policy.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      highlight="Privacy"
      summary={
        <>
          What we collect when we carry a shipment, what appears on a public tracking page, who we
          share information with and how long we keep it. Written to be read, not to be skipped.
        </>
      }
      effectiveDate={EFFECTIVE_DATE}
      sections={SECTIONS}
      reviewNote="This policy is a launch-ready draft prepared for SwiftTrack. It has not yet been reviewed by qualified legal counsel in the United Arab Emirates or in the destination markets SwiftTrack serves. Have it reviewed by a lawyer before relying on it commercially."
    />
  );
}
