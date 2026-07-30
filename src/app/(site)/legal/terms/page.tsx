import type { Metadata } from "next";
import Link from "next/link";

import { LegalLayout, type LegalSection } from "@/components/legal/LegalLayout";
import {
  AlertIcon,
  ArchiveIcon,
  BoxIcon,
  CalendarIcon,
  CustomsIcon,
  GlobeIcon,
  ScaleIcon,
  ShieldIcon,
  SupportIcon,
  TargetIcon,
  TruckIcon,
} from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { absoluteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms on which SwiftTrack Private Delivery Company accepts, carries and delivers shipments, including liability, claims and prohibited items.",
  alternates: { canonical: absoluteUrl("/legal/terms") },
};

const EFFECTIVE_DATE = "2026-07-30";

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "The agreement",
    icon: TargetIcon,
    body: (
      <>
        <p>
          These terms govern every shipment {BRAND.legalName} accepts for carriage, and your use of
          this website. By handing us a shipment, or by asking us to collect one, you accept these
          terms on behalf of yourself and anyone else with an interest in that shipment.
        </p>
        <p>
          &quot;We&quot; and &quot;SwiftTrack&quot; mean {BRAND.legalName}. &quot;You&quot; means
          the person or company who books the shipment, referred to as the sender. &quot;Shipment&quot;
          means the goods and documents carried under a single waybill.
        </p>
        <p>
          Where you hold a written business account agreement with us, that agreement governs to the
          extent it conflicts with these terms.
        </p>
      </>
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance of shipments",
    icon: BoxIcon,
    body: (
      <>
        <p>
          We may refuse any shipment. We are more likely to do so where the contents are prohibited
          or restricted, where packaging is unsuitable for the route, where the description or
          declared value appears inaccurate, or where the destination is one we do not serve.
        </p>
        <p>
          Handing us a shipment does not by itself create a contract of carriage. The contract
          begins when we accept the shipment and record the collection scan.
        </p>
        <p>
          We may open and inspect a shipment at any time, without notice, where we reasonably believe
          it is necessary for safety, for security, or to comply with a legal requirement or a
          request from a customs or government authority.
        </p>
      </>
    ),
  },
  {
    id: "prohibited",
    title: "Prohibited and restricted items",
    icon: AlertIcon,
    body: (
      <>
        <p>You must not present any of the following for carriage:</p>
        <ul>
          <li>Cash, bearer instruments and negotiable securities</li>
          <li>Weapons, ammunition and their components</li>
          <li>Explosives, compressed gases and flammable liquids</li>
          <li>Illegal substances of any kind</li>
          <li>Live animals and human remains</li>
          <li>Counterfeit goods</li>
          <li>Anything whose carriage, import or export is unlawful on the route</li>
        </ul>
        <p>
          Other categories, including perishable goods, temperature sensitive items, lithium
          batteries and high value goods, are restricted and may only be carried where we have
          agreed to it in writing before collection.
        </p>
        <p>
          If a prohibited item is discovered in a shipment, we may hold it, return it, hand it to
          the relevant authority or dispose of it as the law requires. You remain responsible for any
          cost, penalty or loss that results, and no refund is due.
        </p>
      </>
    ),
  },
  {
    id: "packaging",
    title: "Packaging and description",
    icon: ShieldIcon,
    body: (
      <>
        <p>
          You are responsible for packing the shipment adequately for the route it will travel, and
          for describing the contents accurately and completely on the waybill and customs
          documentation.
        </p>
        <p>
          Our courier may comment on packaging at collection, and may refuse a shipment that is
          clearly unsuitable. That check is a courtesy and not an inspection: accepting a shipment
          does not mean we have approved the packaging or verified the description.
        </p>
        <p>
          <strong>
            Inaccurate descriptions and understated values are the leading cause of shipments being
            held at a border.
          </strong>{" "}
          Where an inaccuracy causes delay, penalty or seizure, the consequences and costs are yours.
        </p>
      </>
    ),
  },
  {
    id: "delivery",
    title: "Delivery and estimates",
    icon: TruckIcon,
    body: (
      <>
        <p>
          We deliver to the address on the waybill, not necessarily to a named individual. Delivery
          to a reception desk, mailroom, concierge, neighbour or other person at or near the address
          who appears authorised to accept it constitutes delivery, unless a signature from a
          specific person was agreed in advance.
        </p>
        <p>
          <strong>Delivery dates and windows shown on tracking pages are estimates.</strong> They
          reflect our operations team&rsquo;s expectation given the service level and route. They are not
          guarantees, they are not terms of the contract, and we do not offer a money back guarantee
          against them.
        </p>
        <p>
          Where delivery cannot be completed, we will attempt redelivery. After repeated
          unsuccessful attempts, the shipment is held and then returned to the sender at the
          sender&rsquo;s cost. Storage charges may apply while a shipment is held.
        </p>
      </>
    ),
  },
  {
    id: "customs",
    title: "Customs, duties and taxes",
    icon: CustomsIcon,
    body: (
      <>
        <p>
          International shipments are subject to inspection, clearance and charges by the
          authorities of the countries they pass through. Those authorities, not SwiftTrack, decide
          what is charged and how long clearance takes.
        </p>
        <p>
          Duties, taxes and clearance charges are payable by the party identified as responsible at
          booking, which is the recipient unless agreed otherwise. If that party does not pay, the
          sender remains liable for them, together with any charge we incur in advancing them.
        </p>
        <p>
          Where we complete customs formalities, we do so as your agent, on the basis of the
          information you provide. Delays caused by inspection, clearance or the accuracy of your
          documentation are not within our control.
        </p>
      </>
    ),
  },
  {
    id: "charges",
    title: "Charges and payment",
    icon: ScaleIcon,
    body: (
      <>
        <p>
          Charges are based on the higher of the actual weight and the volumetric weight of the
          packed shipment, together with the service level and any additional handling agreed. We
          reweigh and remeasure shipments at our gateway, and the figures recorded there are the ones
          used for billing.
        </p>
        <p>
          Where reweighing produces a different figure to the one quoted, the shipment record shows
          both, and we will tell you before invoicing rather than after.
        </p>
        <p>
          Invoices are payable within the period stated on them. We may withhold delivery of, or
          exercise a lien over, a shipment where sums are outstanding, to the extent the law allows.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Our liability",
    icon: AlertIcon,
    body: (
      <>
        <p>
          We are liable for physical loss of, or damage to, a shipment while it is in our custody,
          subject to the limits and exclusions set out here and to any liability regime that applies
          to the carriage by law.
        </p>
        <p>
          <strong>Our liability is limited</strong> to the lower of the declared value of the
          shipment and the limit stated in your booking confirmation or account agreement. Where
          cover has been arranged separately and paid for, the terms of that cover apply.
        </p>
        <p>We are not liable for:</p>
        <ul>
          <li>
            Indirect or consequential loss of any kind, including loss of profit, loss of contract,
            loss of market and loss of opportunity, whether or not we knew such loss was possible.
          </li>
          <li>Loss or damage caused by inadequate packaging or an inaccurate description.</li>
          <li>
            Delay, inspection, seizure or destruction by a customs or government authority.
          </li>
          <li>
            Events beyond our reasonable control, including weather, air and sea traffic disruption,
            civil disturbance, industrial action and the acts of third parties.
          </li>
          <li>Inherent defect or natural deterioration of the goods.</li>
        </ul>
        <p>Nothing in these terms limits liability that cannot lawfully be limited.</p>
      </>
    ),
  },
  {
    id: "claims",
    title: "Claims",
    icon: SupportIcon,
    body: (
      <>
        <p>
          Claims for loss or damage must be notified to us in writing promptly, and in any event
          within the period stated in your booking confirmation. Late notification prejudices our
          ability to investigate and may invalidate the claim.
        </p>
        <p>
          Keep the packaging and the contents until a claim is resolved. Photographs of the outer
          packaging, the inner packaging and the goods make a claim substantially easier to settle.
        </p>
        <p>
          We will not consider a claim while charges relating to the shipment remain unpaid. A claim
          is settled once, in full and final settlement for that shipment.
        </p>
      </>
    ),
  },
  {
    id: "website",
    title: "Use of this website",
    icon: GlobeIcon,
    body: (
      <>
        <p>
          Tracking information on this site is provided for the convenience of the sender, the
          recipient and anyone they choose to share the tracking number with. Anyone holding a
          tracking number can view that shipment&rsquo;s tracking page. Our{" "}
          <Link href="/legal/privacy">Privacy Policy</Link> explains exactly what is shown.
        </p>
        <p>
          You must not attempt to enumerate tracking numbers, scrape the tracking service, bypass
          rate limiting, probe our systems for vulnerabilities, or use this site in any way that
          interferes with its operation or with other users. The operations area is for authorised
          SwiftTrack staff only.
        </p>
        <p>
          The SwiftTrack name, logo and site content are our property. Tracking data relating to
          your own shipment remains yours to use as you see fit.
        </p>
      </>
    ),
  },
  {
    id: "archived",
    title: "Cancellation and archived shipments",
    icon: ArchiveIcon,
    body: (
      <>
        <p>
          You may cancel a shipment before collection at no charge. After collection, cancellation is
          treated as a return and is charged accordingly.
        </p>
        <p>
          We archive shipment records once a shipment is closed and the retention period for public
          display has passed. An archived shipment no longer appears on public tracking, and the
          tracking number stops returning a result. The underlying record is retained internally for
          audit and legal purposes as described in our{" "}
          <Link href="/legal/privacy">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law and changes",
    icon: CalendarIcon,
    body: (
      <>
        <p>
          These terms are governed by the laws of the United Arab Emirates, and the courts of Dubai
          have jurisdiction over any dispute, without prejudice to any mandatory protection you have
          under the law of your own country of residence.
        </p>
        <p>
          Where an international convention applies to the carriage, its provisions prevail over
          these terms to the extent of any conflict.
        </p>
        <p>
          We may change these terms. The version in force for a shipment is the version published
          when that shipment was accepted. Changes take effect from the effective date shown at the
          top of this page.
        </p>
        <p>
          If any provision is found unenforceable, the rest remains in force.
        </p>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms of Service"
      highlight="Terms"
      summary={
        <>
          The terms on which we accept, carry and deliver shipments: what we will and will not
          carry, what a delivery estimate means, where our liability begins and ends, and how claims
          work.
        </>
      }
      effectiveDate={EFFECTIVE_DATE}
      sections={SECTIONS}
      reviewNote="These terms are a launch-ready draft prepared for SwiftTrack. They have not been reviewed by qualified legal counsel, and carriage terms interact with mandatory local law and international conventions in ways that vary by route. Have them reviewed by a lawyer before accepting commercial shipments under them."
    />
  );
}
