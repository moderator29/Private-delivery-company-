/**
 * Site navigation, defined once so the header, the footer and the sitemap can
 * never disagree about which pages exist.
 */

import type { ComponentType } from "react";

import {
  BoxIcon,
  BuildingIcon,
  CalendarIcon,
  GlobeIcon,
  InfoIcon,
  MailIcon,
  ShieldIcon,
  SupportIcon,
  TruckIcon,
} from "@/components/ui/icons";

export interface NavItem {
  href: string;
  label: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/track", label: "Track" },
  { href: "/ship", label: "Ship" },
  { href: "/services", label: "Services" },
  { href: "/business", label: "Business" },
  { href: "/support", label: "Support" },
];

export const FOOTER_NAV: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Shipping",
    items: [
      { href: "/track", label: "Track a shipment" },
      { href: "/ship", label: "Send a shipment" },
      { href: "/services", label: "Delivery services" },
      { href: "/business", label: "Business solutions" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/about", label: "About SwiftTrack" },
      { href: "/support", label: "Support centre" },
      { href: "/help", label: "Help and FAQ" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/terms", label: "Terms of Service" },
    ],
  },
];

/** Every public route, used to generate the sitemap. */
export const PUBLIC_ROUTES = [
  "/",
  "/track",
  "/ship",
  "/services",
  "/business",
  "/about",
  "/support",
  "/help",
  "/contact",
  "/legal/privacy",
  "/legal/terms",
] as const;

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/shipments", label: "Shipments" },
];

/**
 * Drop panels for the desktop nav and the expandable sections in the mobile
 * drawer. Only the destinations that genuinely have somewhere further to go get
 * one; the rest are plain links.
 */
export interface NavPanelEntry {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

export const NAV_PANELS: Record<string, NavPanelEntry[]> = {
  "/ship": [
    {
      href: "/ship",
      label: "Send a shipment",
      description: "What we need from you and how collection works.",
      icon: BoxIcon,
    },
    {
      href: "/services",
      label: "Compare service levels",
      description: "Standard through to same day, and managed freight.",
      icon: TruckIcon,
    },
    {
      href: "/contact",
      label: "Book a collection",
      description: "Talk to operations about a pickup window.",
      icon: CalendarIcon,
    },
  ],
  "/services": [
    {
      href: "/services",
      label: "All delivery services",
      description: "Five levels of urgency on one network.",
      icon: TruckIcon,
    },
    {
      href: "/services#handling",
      label: "How we handle shipments",
      description: "Custody, customs, packaging and exceptions.",
      icon: ShieldIcon,
    },
    {
      href: "/business",
      label: "Business accounts",
      description: "Scheduled collections and a named contact.",
      icon: BuildingIcon,
    },
  ],
  "/business": [
    {
      href: "/business",
      label: "Business solutions",
      description: "For companies shipping regularly from Dubai.",
      icon: BuildingIcon,
    },
    {
      href: "/about",
      label: "About SwiftTrack",
      description: "Our vision, our network and how we measure it.",
      icon: GlobeIcon,
    },
    {
      href: "/contact",
      label: "Talk to our team",
      description: "Start a conversation about your lanes.",
      icon: MailIcon,
    },
  ],
  "/support": [
    {
      href: "/support",
      label: "Tracking support",
      description: "What every shipment status actually means.",
      icon: SupportIcon,
    },
    {
      href: "/help",
      label: "Help and FAQ",
      description: "Answers to the questions we are actually asked.",
      icon: InfoIcon,
    },
    {
      href: "/contact",
      label: "Contact us",
      description: "Message the team about a specific shipment.",
      icon: MailIcon,
    },
  ],
};
