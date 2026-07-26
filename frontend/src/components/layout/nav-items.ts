import {
  BarChart3,
  BedDouble,
  Bell,
  Boxes,
  Briefcase,
  Building2,
  CalendarRange,
  History,
  KeyRound,
  LayoutDashboard,
  ScanLine,
  Settings,
  ShieldCheck,
  UserCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Tab } from "@/App";

export type NavCategoryKey =
  "pilotage" | "exploitation" | "relations" | "ressources" | "stats" | "admin";

export interface NavCategory {
  key: NavCategoryKey;
  label: string;
}

export const NAV_CATEGORIES: NavCategory[] = [
  { key: "pilotage", label: "Pilotage" },
  { key: "exploitation", label: "Exploitation Hôtel" },
  { key: "relations", label: "Clients & Partenaires" },
  { key: "ressources", label: "Ressources & Stocks" },
  { key: "stats", label: "Statistiques & Rapports" },
  { key: "admin", label: "Administration" },
];

export interface NavItem {
  tab: Tab;
  label: string;
  icon: LucideIcon;
  category: NavCategoryKey;
  permission: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    tab: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    category: "pilotage",
    permission: "dashboard:read",
  },
  {
    tab: "reporting",
    label: "Reporting & KPIs",
    icon: BarChart3,
    category: "stats",
    permission: "reporting:read",
  },
  {
    tab: "reservations",
    label: "Réservations",
    icon: CalendarRange,
    category: "exploitation",
    permission: "reservations:read",
  },
  {
    tab: "checkin",
    label: "Check-in & Séjours",
    icon: KeyRound,
    category: "exploitation",
    permission: "checkin:read",
  },
  {
    tab: "document-ocr",
    label: "Scan Pièce d'Identité",
    icon: ScanLine,
    category: "exploitation",
    permission: "guests:write",
  },
  {
    tab: "police",
    label: "Fiches Police DGSN",
    icon: ShieldCheck,
    category: "exploitation",
    permission: "checkin:read",
  },
  {
    tab: "housekeeping",
    label: "Housekeeping",
    icon: BedDouble,
    category: "exploitation",
    permission: "housekeeping:read",
  },
  {
    tab: "maintenance",
    label: "Maintenance",
    icon: Wrench,
    category: "exploitation",
    permission: "maintenance:read",
  },
  {
    tab: "guests",
    label: "Fiches Clients",
    icon: UserCheck,
    category: "relations",
    permission: "guests:read",
  },
  {
    tab: "companies",
    label: "Entreprises & Agences",
    icon: Building2,
    category: "relations",
    permission: "guests:read",
  },
  {
    tab: "hr",
    label: "RH & Plannings",
    icon: Briefcase,
    category: "ressources",
    permission: "rh:read",
  },
  {
    tab: "stock",
    label: "Stock & Fournisseurs",
    icon: Boxes,
    category: "ressources",
    permission: "stock:read",
  },
  {
    tab: "notifications",
    label: "Notifications",
    icon: Bell,
    category: "admin",
    permission: "notifications:read",
  },
  {
    tab: "audit",
    label: "Journal d'Audit",
    icon: History,
    category: "admin",
    permission: "audit:read",
  },
  {
    tab: "parameters",
    label: "Paramètres Système",
    icon: Settings,
    category: "admin",
    permission: "parameters:read",
  },
];
