import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import IBAAssistant from "../components/IBAAssistant";
import ConseilIAModal from "../components/ConseilIAModal";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, Plus, ChevronRight,
  Search,
  TrendingUp, TrendingDown, Filter, Download,
  Sparkles, RefreshCw, LogOut, Loader2, Bell, Calendar,
} from "lucide-react";

import logoFace from "../assets/LOGO_face.png";
import dashboardBg from "../assets/BackGradiant/gradients-fm__luminous-shapes-9.webp";
import crypto3D from "../assets/Avalanche_3D.png";

import iconWallet from "../icons/wallet.png";
import iconCoins from "../icons/coins.png";
import iconBills from "../icons/bills.png";
import iconMoneybag from "../icons/moneybag.png";
import iconSavings from "../icons/savings.png";
import iconGold from "../icons/gold.png";
import iconDiamond from "../icons/diamond.png";

import { apiFetch } from "../utils/api";

type BackendUser = {
  id: number;
  nom: string;
  email: string;
  role: string;
  createdAt?: string;
};
type BackendTransaction = {
  id: number;
  montant: string | number;
  type: "revenu" | "depense" | "transfert";
  categorie: string;
  description?: string | null;
  date: string;
  createdAt?: string;
};

type BackendObjectif = {
  id: number;
  titre: string;
  montantCible: string | number;
  montantActuel: string | number;
  symbol: string;
  price: number;
  change24h: number;
  accent?: string;
  icon?: string;
  couleur?: string;
  deadline?: string;
};

type BackendConseil = {
  id: number;
  texte: string;
  statsUtilisees?: unknown;
  createdAt: string;
};

type BackendStats = {
  totalRevenus: number;
  totalDepenses: number;
  solde: number;
  parCategorie: Record<string, number>;
  nombreTransactions: number;
};

type BackendWallet = {
  soldeTotal: number;
  devisePref?: string;
};

type BackendTontine = {
  id: number;
  nom: string;
  code: string;
  frequence: string;
  membres?: Array<{ user?: { nom?: string; email?: string } }>;
  tourActuel: number;
  montantParTour: number;
  totalVersements?: number;
  prochainVersement?: string;
};

type CryptoMarketEntry = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  accent: string;
  icon: string;
};
type BourseTickerData = {
  symbol: string;
  nom: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
  exchange: string;
  variation: number;
  disponible: boolean;
};

type BourseHistoriqueItem = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type DashboardData = {
  user: BackendUser | null;
  wallet: BackendWallet | null;
  transactions: BackendTransaction[];
  stats: BackendStats | null;
  objectifs: BackendObjectif[];
  tontines: BackendTontine[];
  conseils: BackendConseil[];
  crypto: CryptoMarketEntry[];
  bourse: BourseTickerData[];
};

type PageKey = "dashboard" | "stats" | "transactions" | "crypto" | "objectifs" | "tontines" | "bourse";

const couleurs = {
  primary: "#F3F6FB",
  secondary: "rgba(230,235,245,0.82)",
  muted: "rgba(190,200,215,0.72)",
  soft: "rgba(156,170,190,0.52)",
  accent: "#E8FF5A",
  info: "#60a5fa",
  card: "rgba(11,16,26,0.58)",
  cardHover: "rgba(18,24,38,0.74)",
  border: "rgba(255,255,255,0.10)",
  borderHi: "rgba(232,255,90,0.24)",
  radius: 20,
  blur: "blur(18px)",
  shadow: "0 8px 32px rgba(0,10,30,0.45), 0 1px 0 rgba(255,255,255,0.08) inset",
  shadowLg: "0 20px 60px rgba(0,10,30,0.6), 0 1px 0 rgba(255,255,255,0.1) inset",
};

const CRYPTO_TRACKER: Array<{ id: string; name: string; symbol: string; accent: string; icon: string }> = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", accent: "#f59e0b", icon: iconGold },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", accent: "#c084fc", icon: iconDiamond },
  { id: "solana", name: "Solana", symbol: "SOL", accent: "#22d3ee", icon: iconCoins },
  { id: "avalanche-2", name: "Avalanche", symbol: "AVAX", accent: "#ef4444", icon: iconWallet },
];

const formatCryptoPrice = (value: number) => {
  const digits = value >= 100 ? 0 : value >= 1 ? 2 : 4;
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value);
};

const buildCryptoMarket = (payload: Record<string, { usd?: number; usd_24h_change?: number }> | null | undefined) =>
  CRYPTO_TRACKER.map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    price: (payload?.[coin.id]?.usd ?? 0) * 620, // Conversion USD vers XOF (taux approximatif)
    change24h: payload?.[coin.id]?.usd_24h_change ?? 0,
    accent: coin.accent,
    icon: coin.icon,
  }));

const buildBourseMarket = (payload: unknown): BourseTickerData[] => {
  if (!Array.isArray(payload)) return [];
  return payload.map((item: any) => ({
    symbol: item?.symbol ?? "",
    nom: item?.nom ?? item?.name ?? item?.symbol ?? "",
    open: Number(item?.open ?? 0),
    high: Number(item?.high ?? 0),
    low: Number(item?.low ?? 0),
    close: Number(item?.close ?? 0),
    volume: Number(item?.volume ?? 0),
    date: item?.date ?? "",
    exchange: item?.exchange ?? "",
    variation: Number(item?.variation ?? 0),
    disponible: item?.disponible ?? true,
  }));
};

const DashboardBackdrop: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, overflow: "hidden", background: "#05070d" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(180deg, rgba(5,7,13,0.28) 0%, rgba(5,7,13,0.82) 100%), url(${dashboardBg})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  </div>
);

const styleCarte = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: couleurs.card,
  backdropFilter: couleurs.blur,
  WebkitBackdropFilter: couleurs.blur,
  border: `1px solid ${couleurs.border}`,
  borderRadius: couleurs.radius,
  padding: 24,
  boxShadow: couleurs.shadow,
  ...extra,
});

const etiquette = (light?: boolean): React.CSSProperties => ({
  fontSize: 9,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.28em",
  color: light ? "rgba(20,40,70,0.5)" : couleurs.muted,
  marginBottom: 10,
});

const NAVIGATION: Array<{ id: PageKey; label: string; icon: string }> = [
  { id: "dashboard", label: "Dashboard", icon: iconWallet },
  { id: "stats", label: "Statistiques", icon: iconCoins },
  { id: "transactions", label: "Transactions", icon: iconBills },
  { id: "crypto", label: "Crypto", icon: iconDiamond },
  { id: "objectifs", label: "Objectifs", icon: iconSavings },
  { id: "tontines", label: "Tontines", icon: iconMoneybag },
  { id: "bourse", label: "Bourse", icon: iconGold },
];

const NAV_GROUPS: Array<{ label: string; items: PageKey[]; extra?: Array<{ label: string; icon: string }> }> = [
  { label: "Portefeuille", items: ["dashboard", "stats"] },
  { label: "Activité", items: ["transactions", "objectifs", "tontines"] },
  { label: "Marché", items: ["crypto", "bourse"] },
];

const deriveInitials = (user?: BackendUser | null) => {
  const source = user?.nom?.trim() || user?.email?.split("@")[0] || "DE";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "DE";
};

const formatMoney = (value: string | number, digits = 0) => {
  const amount = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(Number.isFinite(amount) ? amount : 0);
};

const formatMoneyLabel = (value: string | number, currency = "F CFA") => `${formatMoney(value)} ${currency}`;

const formatShortDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
};

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const startOfDay = (date: Date) => {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const isSameMonth = (left: Date, right: Date) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
const isSameDay = (left: Date, right: Date) => startOfDay(left).getTime() === startOfDay(right).getTime();

const parseNumber = (value: string | number) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const BulleInfo = ({ active, payload, label: labelValue }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(5,5,5,0.96)",
        border: `1px solid ${couleurs.border}`,
        borderRadius: 12,
        padding: "10px 14px",
      }}
    >
      <p
        style={{
          fontSize: 9,
          color: couleurs.muted,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          marginBottom: 6,
        }}
      >
        {labelValue}
      </p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ fontSize: 12, fontWeight: 700, color: entry.color || couleurs.accent }}>
          {entry.name}: {entry.value?.toLocaleString?.() ?? entry.value}
        </p>
      ))}
    </div>
  );
};

const recentDays = (count: number) => {
  const days: Date[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - index);
    days.push(day);
  }
  return days;
};

const buildTimeline = (transactions: BackendTransaction[]) => {
  const months = new Map<string, { label: string; revenus: number; depenses: number; epargne: number }>();
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = monthKey(monthDate);
    months.set(key, {
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(monthDate),
      revenus: 0,
      depenses: 0,
      epargne: 0,
    });
  }

  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    const key = monthKey(transactionDate);
    const bucket = months.get(key);
    if (!bucket) return;

    const amount = parseNumber(transaction.montant);
    if (transaction.type === "revenu") {
      bucket.revenus += amount;
    } else if (transaction.type === "depense") {
      bucket.depenses += amount;
      bucket.epargne += Math.max(0, Math.round(amount * 0.2));
    }
  });

  return Array.from(months.values()).map((item) => ({
    m: item.label,
    r: Math.round(item.revenus),
    d: Math.round(item.depenses),
    e: Math.round(item.epargne),
  }));
};

const buildWeeklyActivity = (transactions: BackendTransaction[]) => {
  const days = recentDays(7);
  return days.map((day) => {
    const dayTransactions = transactions.filter((transaction) => isSameDay(new Date(transaction.date), day));
    const revenus = dayTransactions.filter((transaction) => transaction.type === "revenu").reduce((sum, transaction) => sum + parseNumber(transaction.montant), 0);
    const depenses = dayTransactions.filter((transaction) => transaction.type === "depense").reduce((sum, transaction) => sum + parseNumber(transaction.montant), 0);

    return {
      j: new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(day),
      v: Math.round(revenus),
      d: Math.round(depenses),
    };
  });
};

const buildExpenseBreakdown = (transactions: BackendTransaction[]) => {
  const totals = new Map<string, number>();
  transactions
    .filter((transaction) => transaction.type === "depense")
    .forEach((transaction) => {
      const current = totals.get(transaction.categorie) ?? 0;
      totals.set(transaction.categorie, current + parseNumber(transaction.montant));
    });

  const palette = ["#E8FF5A", "#fff", "#93c5fd", "#a1a1aa", "#6b7280", "#374151", "#1f2937"];
  return Array.from(totals.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([name, value], index) => ({
      name,
      value: Math.round(value),
      color: palette[index % palette.length],
    }));
};

const buildRecentTransactions = (transactions: BackendTransaction[]) =>
  [...transactions].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

const calcMonthlyTotals = (transactions: BackendTransaction[]) => {
  const now = new Date();
  
  // Essayer d'abord le mois en cours
  let currentMonth = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getFullYear() === now.getFullYear() && transactionDate.getMonth() === now.getMonth();
  });
  
  // Si aucune transaction ce mois-ci, prendre le mois le plus récent avec des transactions
  if (currentMonth.length === 0 && transactions.length > 0) {
    const sortedByDate = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const mostRecentDate = new Date(sortedByDate[0].date);
    currentMonth = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getFullYear() === mostRecentDate.getFullYear() && transactionDate.getMonth() === mostRecentDate.getMonth();
    });
  }
  
  const revenus = currentMonth.filter((transaction) => transaction.type === "revenu").reduce((sum, transaction) => sum + parseNumber(transaction.montant), 0);
  const depenses = currentMonth.filter((transaction) => transaction.type === "depense").reduce((sum, transaction) => sum + parseNumber(transaction.montant), 0);
  const epargne = Math.max(0, revenus - depenses);

  // Calcul du solde total sur toutes les transactions
  const totalRevenus = transactions.filter((transaction) => transaction.type === "revenu").reduce((sum, transaction) => sum + parseNumber(transaction.montant), 0);
  const totalDepenses = transactions.filter((transaction) => transaction.type === "depense").reduce((sum, transaction) => sum + parseNumber(transaction.montant), 0);
  const soldeTotal = totalRevenus - totalDepenses;

  return { revenus, depenses, epargne, soldeTotal };
};

const calcObjectiveProgress = (objectif: BackendObjectif) => {
  const cible = parseNumber(objectif.montantCible);
  const actuel = parseNumber(objectif.montantActuel);
  if (!cible) return 0;
  return Math.max(0, Math.min(100, Math.round((actuel / cible) * 100)));
};

const calcTontineProgress = (tontine: BackendTontine) => {
  const participants = Math.max(1, tontine.membres?.length ?? 1);
  return Math.max(0, Math.min(100, Math.round((tontine.tourActuel / participants) * 100)));
};

const normalizeTontineLabel = (tontine: BackendTontine) => `${tontine.nom}`;

const transactionCategoryLabel = (type: BackendTransaction["type"]) => {
  if (type === "revenu") return "Reçu";
  if (type === "depense") return "Envoyé";
  return "Transfert";
};

const transactionColor = (type: BackendTransaction["type"]) => (type === "revenu" ? couleurs.accent : couleurs.primary);

const transactionIcon = (transaction: BackendTransaction) => {
  if (transaction.type === "revenu") return iconGold;
  if (transaction.type === "depense") return iconBills;
  return iconCoins;
};

const transactionCategoryType = (category: string) => {
  const lower = category.toLowerCase();
  if (["revenus", "salaire", "freelance"].some((word) => lower.includes(word))) return "revenu";
  if (["transferts", "virement"].some((word) => lower.includes(word))) return "transfert";
  return "depense";
};

const HeaderInfo: React.FC<{ title: string; user: BackendUser | null; onAdvice: () => void; adviceLoading: boolean; notifications: Array<{ id: string; message: string; type: 'tontine' | 'epargne'; date: string }> }> = ({
  title,
  user,
  onAdvice,
  adviceLoading,
  notifications,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        padding: "16px 24px 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: couleurs.muted,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 11, color: couleurs.soft, marginTop: 6, textTransform: "capitalize" }}>{today}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: "rgba(120,160,220,0.12)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(180,210,255,0.22)",
          borderRadius: 99,
          padding: "6px 8px",
          boxShadow: "0 8px 32px rgba(0,10,40,0.35), 0 1px 0 rgba(255,255,255,0.15) inset",
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            padding: "7px 14px",
            borderRadius: 99,
            fontSize: 10,
            fontWeight: 500,
            color: couleurs.muted,
            letterSpacing: "0.06em",
          }}
        >
          {today}
        </div>

        <div style={{ width: 1, height: 20, background: couleurs.border, margin: "0 2px" }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 14px",
            borderRadius: 99,
            cursor: "text",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Search size={12} color={couleurs.muted} />
          <input
            type="text"
            placeholder="Rechercher..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              width: 110,
              fontSize: 11,
              color: couleurs.primary,
              fontFamily: "'Satoshi', sans-serif",
              fontWeight: 400,
            }}
          />
        </div>

        <div style={{ width: 1, height: 20, background: couleurs.border, margin: "0 2px" }} />

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 99,
              background: notifications.length > 0 ? "rgba(232,255,90,0.2)" : "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: notifications.length > 0 ? "1px solid rgba(232,255,90,0.3)" : "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <Bell size={14} color={notifications.length > 0 ? couleurs.accent : couleurs.muted} />
            {notifications.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: 99,
                  background: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {notifications.length}
              </div>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && notifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  width: 320,
                  maxHeight: 400,
                  overflowY: "auto",
                  background: "rgba(15,28,50,0.95)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: 12,
                  zIndex: 100,
                  boxShadow: "0 10px 40px rgba(0,10,30,0.5)",
                }}
              >
                <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    Notifications ({notifications.length})
                  </p>
                </div>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: notif.type === 'tontine' ? "rgba(232,255,90,0.08)" : "rgba(96,165,250,0.08)",
                      border: notif.type === 'tontine' ? "1px solid rgba(232,255,90,0.2)" : "1px solid rgba(96,165,250,0.2)",
                      marginBottom: 8,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {notif.type === 'tontine' ? (
                        <Calendar size={14} color={couleurs.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                      ) : (
                        <Sparkles size={14} color={couleurs.info} style={{ flexShrink: 0, marginTop: 1 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, color: couleurs.primary, lineHeight: 1.4 }}>{notif.message}</p>
                        <p style={{ fontSize: 9, color: couleurs.soft, marginTop: 4 }}>{formatShortDate(notif.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ width: 1, height: 20, background: couleurs.border, margin: "0 2px" }} />

        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 99,
            marginLeft: 2,
            background: "rgba(232,255,90,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 800,
            color: "#000",
            boxShadow: "0 2px 8px rgba(232,255,90,0.3)",
            cursor: "pointer",
          }}
        >
          {deriveInitials(user)}
        </div>
      </motion.div>
    </div>
  );
};

const BarreNavigation: React.FC<{
  actif: PageKey;
  setActif: (value: PageKey) => void;
  user: BackendUser | null;
}> = ({ actif, setActif, user }) => {
  const [ouvert, setOuvert] = useState(true);
  const navigate = useNavigate();

  return (
    // Enveloppe qui crée la marge autour de la carte -> effet "flottant"
    <div className="relative flex-shrink-0 h-full" style={{ padding: "20px 0 20px 20px" }}>
      <motion.aside
        animate={{ width: ouvert ? 232 : 88 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="relative flex flex-col h-full overflow-visible"
        style={{
          borderRadius: 28,
          background: "linear-gradient(165deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0.09) 100%)",
          backdropFilter: "blur(30px) saturate(160%)",
          WebkitBackdropFilter: "blur(30px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow:
            "0 24px 60px rgba(0,10,30,0.55), 0 2px 8px rgba(0,10,30,0.3), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 60px rgba(255,255,255,0.04)",
        }}
      >
        {/* Poignée de rangement — toujours au même endroit, à cheval sur le bord droit,
            centrée verticalement pour rester facile à trouver et à cliquer quel que soit l'état */}
        <button
          onClick={() => setOuvert(!ouvert)}
          aria-label={ouvert ? "Réduire le menu" : "Déplier le menu"}
          className="flex items-center justify-center group"
          style={{
            position: "absolute",
            right: -14,
            top: "50%",
            transform: "translateY(-50%)",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(14,20,32,0.92)",
            border: "1px solid rgba(232,255,90,0.35)",
            boxShadow: "0 4px 16px rgba(0,10,30,0.5), 0 0 0 4px rgba(11,16,26,0.4)",
            cursor: "pointer",
            zIndex: 20,
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = couleurs.accent;
            e.currentTarget.style.boxShadow = `0 4px 18px rgba(0,10,30,0.5), 0 0 0 4px rgba(11,16,26,0.4), 0 0 12px rgba(232,255,90,0.35)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(232,255,90,0.35)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,10,30,0.5), 0 0 0 4px rgba(11,16,26,0.4)";
          }}
        >
          <motion.div animate={{ rotate: ouvert ? 180 : 0 }} transition={{ type: "spring", stiffness: 280, damping: 24 }} className="flex items-center justify-center">
            <ChevronRight size={13} color={couleurs.accent} style={{ marginLeft: ouvert ? 0 : 1 }} />
          </motion.div>
        </button>

        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 pt-5 pb-4 flex-shrink-0"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            justifyContent: ouvert ? "flex-start" : "center",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              flexShrink: 0,
              background: "rgba(5,10,20,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <img src={logoFace} style={{ width: 18, height: 18, objectFit: "contain" }} alt="" />
          </div>

          <AnimatePresence>
            {ouvert && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="min-w-0 flex-1"
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#fff",
                  }}
                >
                  DEUREUM
                </span>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.55)",
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.nom ?? user?.email ?? "Connexion active"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation groupée */}
        <nav className="flex-1 overflow-y-auto px-3 pt-4" style={{ scrollbarWidth: "none" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 20 }}>
              {ouvert && (
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.38)",
                    padding: "0 10px 8px",
                  }}
                >
                  {group.label}
                </div>
              )}
              {group.items.map((id) => {
                const item = NAVIGATION.find((n) => n.id === id)!;
                const estActif = actif === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActif(id)}
                    className="relative flex items-center w-full transition-all"
                    style={{
                      padding: ouvert ? "9px 10px" : "10px 0",
                      justifyContent: ouvert ? "space-between" : "center",
                      gap: ouvert ? 0 : undefined,
                      borderRadius: 14,
                      marginBottom: 4,
                      background: estActif ? "rgba(255,255,255,0.96)" : "transparent",
                      boxShadow: estActif ? "0 6px 18px rgba(0,0,0,0.22)" : "none",
                    }}
                  >
                    {/* Bloc icône + libellé — toujours groupé à gauche, aligné en flex (plus d'offsets absolus) */}
                    <span className="flex items-center" style={{ gap: 12, minWidth: 0 }}>
                      <span
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 9,
                          background: estActif ? "rgba(232,255,90,0.9)" : "transparent",
                          transition: "background 0.2s ease",
                        }}
                      >
                        <img
                          src={item.icon}
                          alt=""
                          style={{
                            width: 15,
                            height: 15,
                            flexShrink: 0,
                            filter: estActif ? "invert(0) brightness(0.2)" : "invert(1)",
                            opacity: estActif ? 0.9 : 0.4,
                          }}
                        />
                      </span>
                      <AnimatePresence>
                        {ouvert && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                              fontSize: 12.5,
                              fontWeight: estActif ? 600 : 400,
                              color: estActif ? "#0b1220" : "rgba(255,255,255,0.6)",
                              letterSpacing: "0.01em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>

                    {/* Indicateur de position — point d'accent qui glisse en douceur d'un item à l'autre,
                        placé par le flux flex plutôt que par des coordonnées absolues */}
                    {estActif && ouvert && (
                      <motion.span
                        layoutId="sidebar-active-dot"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: couleurs.accent,
                          boxShadow: `0 0 8px ${couleurs.accent}`,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {estActif && !ouvert && (
                      <motion.span
                        layoutId="sidebar-active-dot"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: 10,
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: couleurs.accent,
                          boxShadow: `0 0 8px ${couleurs.accent}`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
              {group.extra?.map((extraItem) => (
                <div
                  key={extraItem.label}
                  className="relative flex items-center w-full"
                  style={{
                    padding: ouvert ? "9px 10px" : "10px 0",
                    justifyContent: ouvert ? "space-between" : "center",
                    borderRadius: 14,
                    marginBottom: 4,
                    cursor: "not-allowed",
                    userSelect: "none",
                  }}
                  title="Bientôt disponible"
                >
                  <span className="flex items-center" style={{ gap: 12, minWidth: 0 }}>
                    <span
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 26, height: 26, borderRadius: 9 }}
                    >
                      <img
                        src={extraItem.icon}
                        alt=""
                        style={{
                          width: 15,
                          height: 15,
                          flexShrink: 0,
                          filter: "invert(1)",
                          opacity: 0.32,
                        }}
                      />
                    </span>
                    <AnimatePresence>
                      {ouvert && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{
                            fontSize: 12.5,
                            fontWeight: 400,
                            color: "rgba(255,255,255,0.35)",
                            letterSpacing: "0.01em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {extraItem.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>

                  {ouvert && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.3)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: 6,
                        padding: "2px 6px",
                        flexShrink: 0,
                      }}
                    >
                      Bientôt
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="px-3 pb-4 pt-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("user");
              navigate("/login");
            }}
            className="flex items-center w-full rounded-xl transition-all"
            style={{
              padding: ouvert ? "9px 10px" : "10px 0",
              gap: 12,
              justifyContent: ouvert ? "flex-start" : "center",
              color: "rgba(255,255,255,0.55)",
            }}
            onMouseEnter={(event) => (event.currentTarget.style.color = "rgba(255,255,255,0.9)")}
            onMouseLeave={(event) => (event.currentTarget.style.color = "rgba(255,255,255,0.55)")}
          >
            <span className="flex items-center justify-center flex-shrink-0" style={{ width: 26, height: 26 }}>
              <LogOut size={15} style={{ flexShrink: 0 }} />
            </span>
            {ouvert && <span style={{ fontSize: 12, fontWeight: 400 }}>Déconnexion</span>}
          </button>
        </div>
      </motion.aside>
    </div>
  );
};

const HomePage: React.FC<{
  data: DashboardData;
  onAdvice: () => void;
  onOpenTransactions: () => void;
}> = ({ data, onAdvice, onOpenTransactions }) => {
  const monthlyTotals = useMemo(() => calcMonthlyTotals(data.transactions), [data.transactions]);
  const monthlyTimeline = useMemo(() => buildTimeline(data.transactions), [data.transactions]);
  const weeklyActivity = useMemo(() => buildWeeklyActivity(data.transactions), [data.transactions]);
  const expenseBreakdown = useMemo(() => buildExpenseBreakdown(data.transactions), [data.transactions]);
  const recentTransactions = useMemo(() => buildRecentTransactions(data.transactions).slice(0, 5), [data.transactions]);
  const recentAdvice = data.conseils[0];
  const walletSolde = data.wallet?.soldeTotal ? parseNumber(data.wallet.soldeTotal) : 0;
  const walletTotal = walletSolde > 0 ? walletSolde : monthlyTotals.soldeTotal;
  const activeTontines = data.tontines.filter(Boolean).length;
  const epargneRate = monthlyTotals.revenus > 0 ? Math.round((monthlyTotals.epargne / monthlyTotals.revenus) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero Section - Solde Principal */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ 
          position: "relative",
          borderRadius: 28,
          padding: 32,
          background: "linear-gradient(135deg, rgba(232,255,90,0.15) 0%, rgba(96,165,250,0.12) 50%, rgba(232,255,90,0.08) 100%)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 24px 64px rgba(0,10,30,0.45), 0 1px 0 rgba(255,255,255,0.12) inset",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,255,90,0.2) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)", filter: "blur(50px)" }} />
        
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(232,255,90,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={iconWallet} alt="" style={{ width: 24, height: 24, filter: "invert(1)" }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: couleurs.muted, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 2 }}>Solde Total</p>
                <p style={{ fontSize: 10, color: couleurs.soft }}>Mise à jour en temps réel</p>
              </div>
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em", color: couleurs.primary, lineHeight: 1.1, marginBottom: 8 }}>
              {formatMoney(walletTotal)}
            </h1>
            <p style={{ fontSize: 18, fontWeight: 400, color: couleurs.secondary, marginBottom: 24 }}>F CFA</p>
            
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ padding: "12px 20px", borderRadius: 16, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p style={{ fontSize: 10, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Revenus</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: couleurs.accent }}>{formatMoney(monthlyTotals.revenus / 1000, 0)}k F</p>
              </div>
              <div style={{ padding: "12px 20px", borderRadius: 16, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p style={{ fontSize: 10, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Dépenses</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{formatMoney(monthlyTotals.depenses / 1000, 0)}k F</p>
              </div>
              <div style={{ padding: "12px 20px", borderRadius: 16, background: "rgba(96,165,250,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(96,165,250,0.2)" }}>
                <p style={{ fontSize: 10, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Épargne</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: couleurs.info }}>{formatMoney(monthlyTotals.epargne / 1000, 0)}k F</p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 200 }}>
            <button
              onClick={onOpenTransactions}
              style={{
                padding: "14px 28px",
                borderRadius: 16,
                background: "rgba(232,255,90,0.9)",
                color: "#000",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(232,255,90,0.3)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Transférer
            </button>
            <button
              onClick={onAdvice}
              style={{
                padding: "14px 28px",
                borderRadius: 16,
                background: "transparent",
                color: couleurs.primary,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                backdropFilter: "blur(12px)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Analyse IA
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPIs Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          style={styleCarte()}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(232,255,90,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={iconMoneybag} alt="" style={{ width: 20, height: 20, filter: "invert(1)" }} />
            </div>
            <p style={{ fontSize: 10, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em" }}>Taux d'épargne</p>
          </div>
          <p style={{ fontSize: 32, fontWeight: 700, color: couleurs.primary, marginBottom: 4 }}>{epargneRate}%</p>
          <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)" }}>
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${Math.min(epargneRate, 100)}%` }} 
              transition={{ duration: 1, delay: 0.3 }}
              style={{ height: "100%", borderRadius: 99, background: couleurs.accent }} 
            />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }}
          style={styleCarte()}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(96,165,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={iconCoins} alt="" style={{ width: 20, height: 20, filter: "invert(1)" }} />
            </div>
            <p style={{ fontSize: 10, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em" }}>Transactions</p>
          </div>
          <p style={{ fontSize: 32, fontWeight: 700, color: couleurs.primary, marginBottom: 4 }}>{data.transactions.length}</p>
          <p style={{ fontSize: 10, color: couleurs.soft }}>Ce mois</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          style={styleCarte()}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={iconSavings} alt="" style={{ width: 20, height: 20, filter: "invert(1)" }} />
            </div>
            <p style={{ fontSize: 10, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em" }}>Objectifs</p>
          </div>
          <p style={{ fontSize: 32, fontWeight: 700, color: couleurs.primary, marginBottom: 4 }}>{data.objectifs.length}</p>
          <p style={{ fontSize: 10, color: couleurs.soft }}>En cours</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.25 }}
          style={styleCarte()}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={iconMoneybag} alt="" style={{ width: 20, height: 20, filter: "invert(1)" }} />
            </div>
            <p style={{ fontSize: 10, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em" }}>Tontines</p>
          </div>
          <p style={{ fontSize: 32, fontWeight: 700, color: couleurs.primary, marginBottom: 4 }}>{activeTontines}</p>
          <p style={{ fontSize: 10, color: couleurs.soft }}>Groupes actifs</p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          style={styleCarte()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={etiquette()}>Historique financier</p>
              <p style={{ fontSize: 12, color: couleurs.soft }}>6 derniers mois</p>
            </div>
            <div className="flex gap-4">
              {[{ l: "Revenus", c: couleurs.accent }, { l: "Dépenses", c: "rgba(255,255,255,0.35)" }, { l: "Épargne", c: couleurs.info }].map((item) => (
                <div key={item.l} className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: item.c }} />
                  <span style={{ fontSize: 10, color: couleurs.soft, fontWeight: 500 }}>{item.l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTimeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                {[['gR', couleurs.accent], ['gD', '#fff'], ['gE', couleurs.info]].map(([id, color]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color as string} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color as string} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip content={<BulleInfo />} />
              <Area type="monotone" dataKey="r" name="Revenus" stroke={couleurs.accent} strokeWidth={2} fill="url(#gR)" dot={false} />
              <Area type="monotone" dataKey="d" name="Dépenses" stroke="rgba(255,255,255,0.35)" strokeWidth={2} fill="url(#gD)" dot={false} />
              <Area type="monotone" dataKey="e" name="Épargne" stroke={couleurs.info} strokeWidth={2} fill="url(#gE)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.35 }}
          style={styleCarte()}
        >
          <p style={etiquette()}>Répartition dépenses</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 20 }}>
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={expenseBreakdown} cx={70} cy={70} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {expenseBreakdown.map((item, index) => (
                      <Cell key={index} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: couleurs.primary }}>{formatMoney(monthlyTotals.depenses / 1000, 0)}k</span>
                <span style={{ fontSize: 9, color: couleurs.soft }}>F CFA</span>
              </div>
            </div>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
              {expenseBreakdown.length === 0 && <span style={{ color: couleurs.soft, fontSize: 10, textAlign: "center" }}>Aucune dépense</span>}
              {expenseBreakdown.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 6, height: 6, borderRadius: 99, background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: couleurs.primary }}>{formatMoney(item.value / 1000, 0)}k</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions & Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          style={styleCarte()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={etiquette()}>Transactions récentes</p>
              <p style={{ fontSize: 12, color: couleurs.soft }}>Dernières opérations</p>
            </div>
            <button onClick={onOpenTransactions} className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 600, color: couleurs.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Voir tout <ChevronRight size={11} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentTransactions.length === 0 && <p style={{ color: couleurs.soft, fontSize: 11, padding: "20px 0", textAlign: "center" }}>Aucune transaction enregistrée.</p>}
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              >
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: transaction.type === "revenu" ? "rgba(232,255,90,0.12)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={transactionIcon(transaction)} alt="" style={{ width: 16, height: 16, filter: "invert(1)", opacity: 0.6 }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: couleurs.primary }}>{transaction.description || transaction.categorie}</p>
                    <p style={{ fontSize: 10, color: couleurs.soft }}>{formatShortDate(transaction.date)}</p>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: transaction.type === "revenu" ? couleurs.accent : "rgba(255,255,255,0.6)" }}>
                  {transaction.type === "revenu" ? "+" : ""}{formatMoney(transaction.montant)} F
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.45 }}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          {/* Quick Objectifs */}
          <div style={styleCarte()}>
            <div className="flex items-center justify-between mb-4">
              <p style={etiquette()}>Objectifs</p>
              <span style={{ fontSize: 10, color: couleurs.soft }}>{data.objectifs.length} actifs</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.objectifs.length === 0 && <p style={{ color: couleurs.soft, fontSize: 10 }}>Aucun objectif</p>}
              {data.objectifs.slice(0, 2).map((objectif) => {
                const pourcentage = calcObjectiveProgress(objectif);
                return (
                  <div key={objectif.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 11, fontWeight: 500, color: couleurs.primary }}>{objectif.titre}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: couleurs.accent }}>{pourcentage}%</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.07)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pourcentage}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        style={{ height: "100%", borderRadius: 99, background: couleurs.accent }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Advice Card */}
          {recentAdvice && (
            <div style={styleCarte({ background: "linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(232,255,90,0.08) 100%)" })}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} color={couleurs.accent} />
                <p style={{ fontSize: 10, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em" }}>Conseil IA</p>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: couleurs.secondary, marginBottom: 12 }}>{recentAdvice.texte.slice(0, 120)}...</p>
              <button onClick={onAdvice} className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 600, color: couleurs.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                En savoir plus <ChevronRight size={11} />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const SectionPortefeuilleMinimal: React.FC<{
  wallet: BackendWallet | null;
  totalTransactions: number;
  latestTransaction?: BackendTransaction;
}> = ({ wallet, totalTransactions, latestTransaction }) => {
  const [afficher, setAfficher] = useState(true);
  const balance = wallet?.soldeTotal ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.25em" }}>Mon Wallet</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: couleurs.primary, marginTop: 2 }}>{afficher ? formatMoney(balance) : "•••••••"} F CFA</p>
        </div>
        <button
          onClick={() => setAfficher(!afficher)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(30,55,90,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: `1px solid ${couleurs.border}` }}
        >
          {afficher ? <Eye size={13} color={couleurs.muted} /> : <EyeOff size={13} color={couleurs.muted} />}
        </button>
      </div>

      <div style={{ padding: 18, borderRadius: 16, background: "rgba(30,55,90,0.4)", border: `1px solid ${couleurs.border}` }}>
        <p style={etiquette()}>Aperçu du compte</p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p style={{ fontSize: 30, fontWeight: 700, color: couleurs.primary, letterSpacing: "-0.03em" }}>{formatMoney(balance)} F</p>
            <p style={{ fontSize: 11, color: couleurs.soft, marginTop: 4 }}>Portefeuille principal connecté</p>
          </div>
          <img src={iconWallet} alt="" style={{ width: 34, height: 34, filter: "invert(1)", opacity: 0.12 }} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div style={{ width: "100%", height: 3, borderRadius: 99, background: "rgba(255,255,255,0.07)" }}>
            <div style={{ width: "82%", height: "100%", borderRadius: 99, background: couleurs.accent }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: couleurs.accent, flexShrink: 0 }}>Actif</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="flex items-center justify-between" style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(30,55,90,0.28)", border: `1px solid ${couleurs.border}` }}>
          <span style={{ fontSize: 11, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.18em" }}>Transactions</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: couleurs.primary }}>{totalTransactions}</span>
        </div>
        <div className="flex items-center justify-between" style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(30,55,90,0.28)", border: `1px solid ${couleurs.border}` }}>
          <span style={{ fontSize: 11, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.18em" }}>Devise</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: couleurs.primary }}>{wallet?.devisePref ?? "FCFA"}</span>
        </div>
        {latestTransaction && (
          <div className="flex items-center justify-between" style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(30,55,90,0.28)", border: `1px solid ${couleurs.border}` }}>
            <span style={{ fontSize: 11, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.18em" }}>Dernière opération</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: couleurs.primary }}>{formatShortDate(latestTransaction.date)}</span>
          </div>
        )}
      </div>

    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; delta: string; up: boolean | null }> = ({ label, value, delta, up }) => (
  <div style={{ padding: "20px 18px", borderRadius: 16, background: "rgba(30,55,90,0.4)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${couleurs.border}`, boxShadow: "0 4px 16px rgba(0,10,30,0.2)" }}>
    <p style={{ fontSize: 9, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 10 }}>{label}</p>
    <p style={{ fontSize: 22, fontWeight: 700, color: couleurs.primary, letterSpacing: "-0.02em" }}>{value}</p>
    <div className="flex items-center gap-1 mt-2">
      {up !== null && (up ? <TrendingUp size={11} color={couleurs.accent} /> : <TrendingDown size={11} color="rgba(255,255,255,0.4)" />)}
      <span style={{ fontSize: 10, fontWeight: 600, color: up === true ? couleurs.accent : up === false ? "rgba(255,255,255,0.4)" : couleurs.muted }}>{delta}</span>
    </div>
  </div>
);

const PageStatistiques: React.FC<{ data: DashboardData }> = ({ data }) => {
  const monthlyTimeline = useMemo(() => buildTimeline(data.transactions), [data.transactions]);
  const expenseBreakdown = useMemo(() => buildExpenseBreakdown(data.transactions), [data.transactions]);
  const monthlyTotals = useMemo(() => calcMonthlyTotals(data.transactions), [data.transactions]);
  const avgDailySpend = data.transactions.length
    ? Math.round(data.transactions.filter((transaction) => transaction.type === "depense").reduce((sum, transaction) => sum + parseNumber(transaction.montant), 0) / 30)
    : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styleCarte({ gridColumn: "1 / 3" })}>
        <div className="flex justify-between items-center mb-5">
          <p style={etiquette()}>Évolution mensuelle réelle</p>
          <span style={{ fontSize: 9, fontWeight: 600, padding: "4px 12px", borderRadius: 99, background: "rgba(232,255,90,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(232,255,90,0.3)", color: couleurs.accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>Données backend</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyTimeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="m" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
            <Tooltip content={<BulleInfo />} />
            <Line type="monotone" dataKey="r" name="Revenus" stroke={couleurs.accent} strokeWidth={2} dot={{ fill: couleurs.accent, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="d" name="Dépenses" stroke="rgba(255,255,255,0.35)" strokeWidth={2} dot={{ fill: "rgba(255,255,255,0.35)", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="e" name="Épargne" stroke={couleurs.info} strokeWidth={2} dot={{ fill: couleurs.info, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={styleCarte()}>
        <p style={etiquette()}>Répartition détaillée des dépenses</p>
        <div className="flex items-center gap-6 mt-2">
          <div style={{ position: "relative" }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={expenseBreakdown} cx={75} cy={75} innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {expenseBreakdown.map((item, index) => <Cell key={index} fill={item.color} />)}
                </Pie>
                <Tooltip content={<BulleInfo />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: couleurs.primary }}>{formatMoney(monthlyTotals.depenses)}</p>
                <p style={{ fontSize: 8, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.2em" }}>F CFA</p>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {expenseBreakdown.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 6, height: 6, borderRadius: 99, background: item.color }} />
                    <span style={{ fontSize: 11, color: couleurs.secondary }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: couleurs.primary }}>{formatMoney(item.value)} F</span>
                </div>
                <div style={{ height: 2, borderRadius: 99, background: "rgba(255,255,255,0.07)" }}>
                  <div style={{ width: `${Math.min(100, (item.value / Math.max(1, monthlyTotals.depenses)) * 100)}%`, height: "100%", borderRadius: 99, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={styleCarte()}>
        <p style={etiquette()}>Croissance réelle de l'épargne</p>
        <div className="flex items-baseline gap-2 mb-4">
          <span style={{ fontSize: 28, fontWeight: 700, color: couleurs.primary, letterSpacing: "-0.03em" }}>{formatMoney(monthlyTotals.epargne / 1000, 0)}k F</span>
          <span style={{ fontSize: 11, color: couleurs.accent, fontWeight: 600 }}>solde mensuel estimé</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={monthlyTimeline} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={couleurs.info} stopOpacity={0.3} />
                <stop offset="95%" stopColor={couleurs.info} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 8 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
            <Tooltip content={<BulleInfo />} />
            <Area type="monotone" dataKey="e" name="Épargne" stroke={couleurs.info} strokeWidth={2} fill="url(#gS)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={styleCarte({ gridColumn: "1 / 3" })}>
        <p style={etiquette()}>Indicateurs clés du mois</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Taux d'épargne" value={`${monthlyTotals.revenus ? Math.round((monthlyTotals.epargne / monthlyTotals.revenus) * 100) : 0}%`} delta="calculé depuis les transactions" up={monthlyTotals.epargne >= 0} />
          <StatCard label="Dépenses moy/jour" value={formatMoney(avgDailySpend)} delta="sur 30 jours" up={false} />
          <StatCard label="Revenus du mois" value={formatMoney(monthlyTotals.revenus)} delta="depuis le début du mois" up={true} />
          <StatCard label="Transactions" value={String(data.transactions.length)} delta="en base" up={null} />
        </div>
      </motion.div>
    </div>
  );
};

type ChampFormulaire = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: string[];
  placeholder?: string;
};

const ModalFormulaire: React.FC<{
  titre: string;
  champs: ChampFormulaire[];
  ouvert: boolean;
  enEnvoi: boolean;
  erreur: string | null;
  onFermer: () => void;
  onSoumettre: (valeurs: Record<string, string>) => void;
}> = ({ titre, champs, ouvert, enEnvoi, erreur, onFermer, onSoumettre }) => {
  const [valeurs, setValeurs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ouvert) {
      const initial: Record<string, string> = {};
      champs.forEach((champ) => { initial[champ.name] = ""; });
      setValeurs(initial);
    }
  }, [ouvert]);

  if (!ouvert) return null;

  return (
    <div
      onClick={onFermer}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(5,10,20,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          width: "100%", maxWidth: 380, padding: 24, borderRadius: 20,
          background: "rgba(20,32,50,0.96)", backdropFilter: "blur(20px)",
          border: `1px solid ${couleurs.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 600, color: couleurs.primary, marginBottom: 18 }}>{titre}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {champs.map((champ) => (
            <div key={champ.name}>
              <label style={{ display: "block", fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.2em", color: couleurs.muted, marginBottom: 6 }}>
                {champ.label}
              </label>
              {champ.type === "select" ? (
                <select
                  value={valeurs[champ.name] ?? ""}
                  onChange={(e) => setValeurs((v) => ({ ...v, [champ.name]: e.target.value }))}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 13,
                    color: couleurs.primary, background: "rgba(0,0,0,0.4)",
                    border: `1px solid ${couleurs.border}`, outline: "none",
                  }}
                >
                  <option value="">Sélectionner...</option>
                  {champ.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={champ.type ?? "text"}
                  value={valeurs[champ.name] ?? ""}
                  placeholder={champ.placeholder}
                  onChange={(e) => setValeurs((v) => ({ ...v, [champ.name]: e.target.value }))}
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 12,
                    fontSize: 13, color: couleurs.primary, background: "rgba(0,0,0,0.4)",
                    border: `1px solid ${couleurs.border}`, outline: "none",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {erreur && (
          <p style={{ marginTop: 12, fontSize: 11, color: "#fecaca" }}>{erreur}</p>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={onFermer}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${couleurs.border}`,
              background: "transparent", color: couleurs.muted, fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => onSoumettre(valeurs)}
            disabled={enEnvoi}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
              background: enEnvoi ? "rgba(232,255,90,0.4)" : couleurs.accent,
              color: "#000", fontSize: 12, fontWeight: 600, cursor: enEnvoi ? "default" : "pointer",
            }}
          >
            {enEnvoi ? "Envoi..." : "Valider"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PageTransactions: React.FC<{ data: DashboardData; onRefresh: () => void }> = ({ data, onRefresh }) => {
  const [filtre, setFiltre] = useState("Tous");
  const [modalOuvert, setModalOuvert] = useState(false);
  const [enEnvoi, setEnEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const filtres = ["Tous", "Revenus", "Dépenses", "Transferts", "Épargne", "Tontines"];
  const transactions = useMemo(() => buildRecentTransactions(data.transactions), [data.transactions]);
  const transacFiltrees = useMemo(() => {
    if (filtre === "Tous") return transactions;
    return transactions.filter((transaction) => {
      if (filtre === "Dépenses") return transaction.type === "depense";
      if (filtre === "Transferts") return transaction.type === "transfert" || transaction.categorie.toLowerCase().includes("transf");
      if (filtre === "Épargne") return transaction.categorie.toLowerCase().includes("épargne") || transaction.categorie.toLowerCase().includes("epargne");
      if (filtre === "Tontines") return transaction.categorie.toLowerCase().includes("tontine");
      return transactionCategoryType(transaction.categorie) === transactionCategoryType(filtre.toLowerCase());
    });
  }, [filtre, transactions]);

  const creerTransaction = async (valeurs: Record<string, string>) => {
    if (!valeurs.montant || !valeurs.categorie || !valeurs.type || !valeurs.date) {
      setErreur("Tous les champs obligatoires doivent être remplis");
      return;
    }
    setEnEnvoi(true);
    setErreur(null);
    try {
      await apiFetch("/transactions", {
        method: "POST",
        body: JSON.stringify({
          montant: Number(valeurs.montant),
          type: valeurs.type,
          categorie: valeurs.categorie,
          description: valeurs.description || undefined,
          date: valeurs.date,
        }),
      });
      setModalOuvert(false);
      onRefresh();
    } catch (err: any) {
      setErreur(err?.message || "Erreur lors de la création");
    } finally {
      setEnEnvoi(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styleCarte()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p style={etiquette()}>Historique des transactions</p>
            <p style={{ fontSize: 22, fontWeight: 600, color: couleurs.primary, letterSpacing: "-0.02em" }}>{data.transactions.length} opérations</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={() => setModalOuvert(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all" style={{ background: "rgba(232,255,90,0.85)", fontSize: 11, fontWeight: 600, color: "#000" }}>
              <Plus size={12} /> Ajouter
            </button>
            <button onClick={() => setFiltre("Tous")} className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all" style={{ background: "rgba(30,55,90,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: `1px solid ${couleurs.border}`, fontSize: 11, color: couleurs.muted }}>
              <Filter size={12} /> Filtrer
            </button>
            <button
              onClick={() => {
                const header = ["Opération", "Description", "Catégorie", "Date", "Montant"];
                const rows = transacFiltrees.map((transaction) => [
                  transaction.type,
                  transaction.description || transaction.categorie,
                  transaction.categorie,
                  formatShortDate(transaction.date),
                  String(transaction.montant),
                ]);
                const csv = [header, ...rows]
                  .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "transactions-deureum.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
              style={{ background: "rgba(30,55,90,0.45)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: `1px solid ${couleurs.border}`, fontSize: 11, color: couleurs.muted }}
            >
              <Download size={12} /> Exporter
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {filtres.map((item) => (
            <button
              key={item}
              onClick={() => setFiltre(item)}
              style={{
                padding: "6px 16px",
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                transition: "all 0.15s",
                background: filtre === item ? "rgba(232,255,90,0.85)" : "rgba(30,55,90,0.4)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: filtre === item ? "#000" : couleurs.muted,
                border: `1px solid ${filtre === item ? "transparent" : couleurs.border}`,
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={styleCarte()}>
        <div className="grid gap-4 pb-3 mb-2" style={{ gridTemplateColumns: "1fr 1fr 100px 120px 110px 40px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {["Opération", "Description", "Catégorie", "Date", "Montant", ""].map((header, index) => (
            <span key={index} style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.2em" }}>{header}</span>
          ))}
        </div>
        {transacFiltrees.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className="grid gap-4 py-3.5 group items-center transition-all rounded-xl"
            style={{ gridTemplateColumns: "1fr 1fr 100px 120px 110px 40px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
            onMouseEnter={(event) => (event.currentTarget.style.background = "rgba(255,255,255,0.02)")}
            onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
          >
            <div className="flex items-center gap-3">
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={transactionIcon(transaction)} alt="" style={{ width: 16, height: 16, filter: "invert(1)", opacity: 0.5 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: couleurs.primary }}>{transaction.description || transaction.categorie}</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{transaction.description || transaction.categorie}</span>
            <span style={{ fontSize: 9, padding: "3px 10px", borderRadius: 99, display: "inline-block", background: "rgba(255,255,255,0.05)", color: couleurs.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", width: "fit-content" }}>{transaction.categorie}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{formatShortDate(transaction.date)}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: transactionColor(transaction.type) }}>
              {transaction.type === "revenu" ? "+" : ""}{formatMoney(transaction.montant)} F
            </span>
          </motion.div>
        ))}
      </motion.div>

      <ModalFormulaire
        titre="Nouvelle transaction"
        ouvert={modalOuvert}
        enEnvoi={enEnvoi}
        erreur={erreur}
        onFermer={() => { setModalOuvert(false); setErreur(null); }}
        onSoumettre={creerTransaction}
        champs={[
          { name: "type", label: "Type", type: "select", options: ["revenu", "depense", "transfert"] },
          { name: "montant", label: "Montant (FCFA)", type: "number", placeholder: "50000" },
          { name: "categorie", label: "Catégorie", placeholder: "Salaire, Loyer, Alimentation..." },
          { name: "description", label: "Description (optionnel)", placeholder: "Détail de l'opération" },
          { name: "date", label: "Date", type: "date" },
        ]}
      />
    </div>
  );
};

const PageObjectifs: React.FC<{ data: DashboardData; onRefresh: () => void }> = ({ data, onRefresh }) => {
  const [modalOuvert, setModalOuvert] = useState(false);
  const [enEnvoi, setEnEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [objectifCible, setObjectifCible] = useState<number | null>(null);

  const creerObjectif = async (valeurs: Record<string, string>) => {
    if (!valeurs.titre || !valeurs.montantCible || !valeurs.deadline) {
      setErreur("Titre, montant cible et deadline sont obligatoires");
      return;
    }
    setEnEnvoi(true);
    setErreur(null);
    try {
      await apiFetch("/objectifs", {
        method: "POST",
        body: JSON.stringify({
          titre: valeurs.titre,
          montantCible: Number(valeurs.montantCible),
          deadline: valeurs.deadline,
        }),
      });
      setModalOuvert(false);
      onRefresh();
    } catch (err: any) {
      setErreur(err?.message || "Erreur lors de la création");
    } finally {
      setEnEnvoi(false);
    }
  };

  const contribuer = async (valeurs: Record<string, string>) => {
    if (!valeurs.montant || !objectifCible) {
      setErreur("Indiquez un montant");
      return;
    }
    setEnEnvoi(true);
    setErreur(null);
    try {
      await apiFetch(`/objectifs/${objectifCible}/contribuer`, {
        method: "PATCH",
        body: JSON.stringify({ montant: Number(valeurs.montant) }),
      });
      setObjectifCible(null);
      onRefresh();
    } catch (err: any) {
      setErreur(err?.message || "Erreur lors de la contribution");
    } finally {
      setEnEnvoi(false);
    }
  };

  return (
  <>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styleCarte({ gridColumn: "1 / 3" })}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p style={etiquette()}>Mes objectifs d'épargne</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: couleurs.primary }}>{data.objectifs.length} objectifs actifs</p>
        </div>
        <button onClick={() => setModalOuvert(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 99, background: "rgba(232,255,90,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", fontSize: 11, fontWeight: 600, color: "#000" }}>
          <Plus size={13} /> Nouvel objectif
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        {data.objectifs.map((objectif) => {
          const pourcentage = calcObjectiveProgress(objectif);
          return (
            <div key={objectif.id} style={{ padding: 24, borderRadius: 20, background: "rgba(30,55,90,0.38)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${couleurs.border}`, boxShadow: "0 4px 16px rgba(0,10,30,0.2)" }}>
              <div className="flex items-center gap-3 mb-4">
                <img src={iconSavings} alt="" style={{ width: 20, height: 20, filter: "invert(1)", opacity: 0.4 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: couleurs.primary }}>{objectif.titre}</span>
              </div>
              <div style={{ position: "relative", margin: "0 auto 16px", width: 100, height: 100 }}>
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={[{ value: pourcentage }, { value: 100 - pourcentage }]} cx={45} cy={45} innerRadius={36} outerRadius={46} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                      <Cell fill={objectif.couleur || couleurs.accent} />
                      <Cell fill="rgba(255,255,255,0.06)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: objectif.couleur || couleurs.accent }}>{pourcentage}%</span>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, color: couleurs.secondary, marginBottom: 4 }}>{formatMoney(objectif.montantActuel)} / {formatMoney(objectif.montantCible)} F</p>
                <p style={{ fontSize: 9, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{formatShortDate(objectif.deadline ?? "")}</p>
                <button
                  onClick={() => setObjectifCible(objectif.id)}
                  style={{ width: "100%", padding: "8px 0", borderRadius: 10, border: `1px solid ${couleurs.border}`, background: "rgba(232,255,90,0.12)", color: couleurs.accent, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  Contribuer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={styleCarte()}>
      <p style={etiquette()}>Progression totale</p>
      <div className="flex items-baseline gap-2 mb-4">
        <span style={{ fontSize: 28, fontWeight: 700, color: couleurs.primary }}>Live</span>
        <span style={{ fontSize: 11, color: couleurs.accent, fontWeight: 600 }}>données backend</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={buildTimeline(data.transactions)} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="gS2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={couleurs.info} stopOpacity={0.3} />
              <stop offset="95%" stopColor={couleurs.info} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="m" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 8 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
          <Tooltip content={<BulleInfo />} />
          <Area type="monotone" dataKey="e" name="Épargne" stroke={couleurs.info} strokeWidth={2} fill="url(#gS2)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={styleCarte()}>
      <p style={etiquette()}>Conseils DEUREUM</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
        {[
          {
            tip: data.objectifs[0]
              ? `Le premier objectif "${data.objectifs[0].titre}" progresse à ${calcObjectiveProgress(data.objectifs[0])}%.`
              : "Créez un premier objectif pour suivre votre épargne.",
            color: couleurs.accent,
          },
          {
            tip: data.stats
              ? `Vous avez ${formatMoney(data.stats.totalRevenus)} F de revenus et ${formatMoney(data.stats.totalDepenses)} F de dépenses enregistrés.`
              : "Les statistiques vont se remplir dès les premières transactions.",
            color: couleurs.info,
          },
          {
            tip: data.transactions.length
              ? `Votre activité est alimentée par ${data.transactions.length} transactions réelles.`
              : "Aucune transaction pour l'instant.",
            color: "rgba(255,255,255,0.5)",
          },
        ].map((item: { tip: string; color: string }, index: number) => (
          <div key={index} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(30,55,90,0.38)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${couleurs.border}`, boxShadow: "0 4px 16px rgba(0,10,30,0.2)", borderLeft: `3px solid ${item.color}` }}>
            <p style={{ fontSize: 12, color: couleurs.secondary, lineHeight: 1.6 }}>{item.tip}</p>
          </div>
        ))}
      </div>
    </motion.div>
  </div>

  <ModalFormulaire
    titre="Nouvel objectif"
    ouvert={modalOuvert}
    enEnvoi={enEnvoi}
    erreur={erreur}
    onFermer={() => { setModalOuvert(false); setErreur(null); }}
    onSoumettre={creerObjectif}
    champs={[
      { name: "titre", label: "Titre de l'objectif", placeholder: "Vacances à Saly" },
      { name: "montantCible", label: "Montant cible (FCFA)", type: "number", placeholder: "500000" },
      { name: "deadline", label: "Date limite", type: "date" },
    ]}
  />

  <ModalFormulaire
    titre="Contribuer à l'objectif"
    ouvert={objectifCible !== null}
    enEnvoi={enEnvoi}
    erreur={erreur}
    onFermer={() => { setObjectifCible(null); setErreur(null); }}
    onSoumettre={contribuer}
    champs={[
      { name: "montant", label: "Montant à ajouter (FCFA)", type: "number", placeholder: "25000" },
    ]}
  />
  </>
  );
};

const PageTontines: React.FC<{ data: DashboardData; onRefresh: () => void }> = ({ data, onRefresh }) => {
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalRejoindre, setModalRejoindre] = useState(false);
  const [enEnvoi, setEnEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [codeCopie, setCodeCopie] = useState<string | null>(null);

  const copierCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopie(code);
      setTimeout(() => setCodeCopie(null), 2000);
    } catch {
      setCodeCopie(null);
    }
  };

  const creerTontine = async (valeurs: Record<string, string>) => {
    if (!valeurs.nom || !valeurs.montantParTour || !valeurs.frequence) {
      setErreur("Tous les champs sont obligatoires");
      return;
    }
    setEnEnvoi(true);
    setErreur(null);
    try {
      await apiFetch("/tontines", {
        method: "POST",
        body: JSON.stringify({
          nom: valeurs.nom,
          montantParTour: Number(valeurs.montantParTour),
          frequence: valeurs.frequence,
        }),
      });
      setModalOuvert(false);
      onRefresh();
    } catch (err: any) {
      setErreur(err?.message || "Erreur lors de la création");
    } finally {
      setEnEnvoi(false);
    }
  };

  const rejoindreTontine = async (valeurs: Record<string, string>) => {
    if (!valeurs.code?.trim()) {
      setErreur("Saisissez le code d'invitation");
      return;
    }
    setEnEnvoi(true);
    setErreur(null);
    try {
      await apiFetch("/tontines/rejoindre", {
        method: "POST",
        body: JSON.stringify({ code: valeurs.code.trim().toUpperCase() }),
      });
      setModalRejoindre(false);
      onRefresh();
    } catch (err: any) {
      setErreur(err?.message || "Impossible de rejoindre cette tontine");
    } finally {
      setEnEnvoi(false);
    }
  };

  return (
  <>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styleCarte({ gridColumn: "1 / 3" })}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p style={etiquette()}>Mes tontines</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: couleurs.primary }}>{data.tontines.length} groupes actifs</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setModalRejoindre(true); setErreur(null); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 99, background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", fontSize: 11, fontWeight: 600, color: couleurs.primary, border: `1px solid ${couleurs.border}` }}>
            Rejoindre avec un code
          </button>
          <button onClick={() => setModalOuvert(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 99, background: "rgba(232,255,90,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", fontSize: 11, fontWeight: 600, color: "#000" }}>
            <Plus size={13} /> Créer une tontine
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.tontines.map((tontine) => {
          const pourcentage = calcTontineProgress(tontine);
          return (
            <div key={tontine.id} style={{ padding: "20px 24px", borderRadius: 18, background: "rgba(30,55,90,0.38)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${couleurs.border}`, boxShadow: "0 4px 16px rgba(0,10,30,0.2)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: couleurs.primary }}>{tontine.nom}</p>
                  <p style={{ fontSize: 10, color: couleurs.soft, marginTop: 2 }}>
                    {tontine.membres?.length ?? 0} membres · {tontine.frequence}
                  </p>
                  {tontine.code && (
                    <div className="flex items-center gap-2 mt-2">
                      <span style={{ fontSize: 9, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em" }}>Code</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: couleurs.accent, letterSpacing: "0.12em", fontFamily: "monospace" }}>{tontine.code}</span>
                      <button
                        onClick={() => copierCode(tontine.code)}
                        style={{ fontSize: 9, fontWeight: 600, color: codeCopie === tontine.code ? couleurs.accent : couleurs.muted, background: "transparent", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em" }}
                      >
                        {codeCopie === tontine.code ? "Copié" : "Copier"}
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: couleurs.primary }}>Tour {tontine.tourActuel}</p>
                  <p style={{ fontSize: 9, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em" }}>{formatMoney(tontine.montantParTour)} F par tour</p>
                </div>
              </div>
              
              {/* Calendrier et informations de versement */}
              {tontine.prochainVersement && (
                <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(232,255,90,0.08)", border: "1px solid rgba(232,255,90,0.2)", marginBottom: 12 }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 9, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Prochain versement</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: couleurs.accent }}>{formatShortDate(tontine.prochainVersement)}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 9, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Montant</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: couleurs.primary }}>{formatMoney(tontine.montantParTour)} F</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(232,255,90,0.15)" }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 9, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.15em" }}>Total versé</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: couleurs.primary }}>{formatMoney(tontine.totalVersements || 0)} F</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pourcentage}%` }} transition={{ duration: 1.2, delay: 0.05, ease: "easeOut" }} style={{ height: "100%", borderRadius: 99, background: pourcentage >= 100 ? couleurs.accent : "rgba(255,255,255,0.35)" }} />
              </div>
              <div className="flex justify-between mt-2">
                <span style={{ fontSize: 9, color: couleurs.soft }}>{pourcentage}% de progression interne</span>
                <span style={{ fontSize: 9, color: pourcentage >= 100 ? couleurs.accent : couleurs.soft, fontWeight: 600 }}>{pourcentage >= 100 ? "Cycle avancé" : "En cours"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={styleCarte()}>
      <p style={etiquette()}>Répartition par tontine</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {data.tontines.map((tontine, index) => (
          <div key={tontine.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: 99, flexShrink: 0, background: [couleurs.accent, "rgba(255,255,255,0.5)", "rgba(255,255,255,0.2)"][index % 3] }} />
              <span style={{ fontSize: 11, color: couleurs.secondary }}>{tontine.nom}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: couleurs.primary }}>{formatMoney(tontine.montantParTour)} F</span>
          </div>
        ))}
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={styleCarte()}>
      <p style={etiquette()}>Membres par groupe</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
        {data.tontines.map((tontine) => (
          <div key={tontine.id} style={{ padding: 16, borderRadius: 14, background: "rgba(30,55,90,0.38)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${couleurs.border}`, boxShadow: "0 4px 16px rgba(0,10,30,0.2)" }}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: couleurs.primary }}>{tontine.nom}</p>
                <p style={{ fontSize: 10, color: couleurs.soft, marginTop: 3 }}>{tontine.frequence}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: couleurs.accent }}>{tontine.membres?.length ?? 0}</p>
                <p style={{ fontSize: 9, color: couleurs.soft }}>membres</p>
              </div>
            </div>
            {tontine.membres && tontine.membres.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tontine.membres.map((membre, index) => (
                  <span key={index} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 99, background: "rgba(255,255,255,0.06)", color: couleurs.secondary, border: `1px solid ${couleurs.border}` }}>
                    {membre.user?.nom ?? membre.user?.email ?? `Membre ${index + 1}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  </div>

  <ModalFormulaire
    titre="Créer une tontine"
    ouvert={modalOuvert}
    enEnvoi={enEnvoi}
    erreur={erreur}
    onFermer={() => { setModalOuvert(false); setErreur(null); }}
    onSoumettre={creerTontine}
    champs={[
      { name: "nom", label: "Nom de la tontine", placeholder: "Tontine des collègues" },
      { name: "montantParTour", label: "Montant par tour (FCFA)", type: "number", placeholder: "25000" },
      { name: "frequence", label: "Fréquence", type: "select", options: ["hebdomadaire", "mensuelle"] },
    ]}
  />

  <ModalFormulaire
    titre="Rejoindre une tontine"
    ouvert={modalRejoindre}
    enEnvoi={enEnvoi}
    erreur={erreur}
    onFermer={() => { setModalRejoindre(false); setErreur(null); }}
    onSoumettre={rejoindreTontine}
    champs={[
      { name: "code", label: "Code d'invitation", placeholder: "Ex: A1B2C3D4" },
    ]}
  />
  </>
  );
};

const PageCrypto: React.FC<{ data: DashboardData }> = ({ data }) => {
  const market = data.crypto;
  const topMover = useMemo(() => [...market].sort((left, right) => right.change24h - left.change24h)[0], [market]);
  const averageChange = market.length
    ? market.reduce((sum, item) => sum + item.change24h, 0) / market.length
    : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20, alignItems: "start" }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          ...styleCarte({
            gridColumn: "1 / 2",
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(232,255,90,0.16)",
            background:
              "linear-gradient(135deg, rgba(18,24,38,0.92) 0%, rgba(8,12,20,0.88) 100%)",
          }),
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 22%, rgba(232,255,90,0.14), transparent 24%), radial-gradient(circle at 82% 18%, rgba(96,165,250,0.16), transparent 24%), radial-gradient(circle at 55% 92%, rgba(255,255,255,0.05), transparent 26%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 460 }}>
            <p style={etiquette()}>Crypto en direct</p>
            <h2 style={{ fontSize: 34, fontWeight: 700, color: couleurs.primary, letterSpacing: "-0.04em", lineHeight: 1.05 }}>
              Une poche marché plus nette, intégrée au même dashboard.
            </h2>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: couleurs.secondary, marginTop: 14 }}>
              Les prix publics CoinGecko sont mis en scène avec des surfaces sombres et lumineuses pour garder la lecture simple, même dans un environnement visuel chargé.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <div style={{ padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${couleurs.border}` }}>
                <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: couleurs.soft }}>Actifs suivis</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: couleurs.primary, marginTop: 6 }}>{market.length}</p>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${couleurs.border}` }}>
                <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: couleurs.soft }}>Variation moyenne</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: averageChange >= 0 ? couleurs.accent : "#fca5a5", marginTop: 6 }}>
                  {averageChange >= 0 ? "+" : ""}{averageChange.toFixed(2)}%
                </p>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${couleurs.border}` }}>
                <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: couleurs.soft }}>Meilleure perf</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: couleurs.primary, marginTop: 6 }}>{topMover ? topMover.symbol : "-"}</p>
              </div>
            </div>
          </div>

          <div style={{ position: "relative", width: 240, minHeight: 220, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 24, borderRadius: 999, background: "radial-gradient(circle, rgba(232,255,90,0.18) 0%, rgba(232,255,90,0.02) 60%, transparent 70%)", filter: "blur(14px)" }} />
            <img src={crypto3D} alt="" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 220, objectFit: "contain", filter: "drop-shadow(0 34px 60px rgba(0,0,0,0.62))" }} />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        style={styleCarte({ gridColumn: "2 / 3" })}
      >
        <p style={etiquette()}>Lecture rapide</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {market.map((coin) => (
            <div key={coin.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: `1px solid ${couleurs.border}` }}>
              <div className="flex items-center gap-3">
                <img src={coin.icon} alt="" style={{ width: 18, height: 18, filter: "invert(1)", opacity: 0.55 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: couleurs.primary }}>{coin.name}</p>
                  <p style={{ fontSize: 9, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.18em", marginTop: 3 }}>{coin.symbol}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: couleurs.primary }}>{formatCryptoPrice(coin.price)} F CFA</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: coin.change24h >= 0 ? couleurs.accent : "#fca5a5", marginTop: 3 }}>
                  {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.14 }}
        style={styleCarte({ gridColumn: "1 / 3" })}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p style={etiquette()}>Marché sélectionné</p>
            <p style={{ fontSize: 20, fontWeight: 600, color: couleurs.primary }}>Vue synthétique, pas du bruit.</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: couleurs.accent, textTransform: "uppercase", letterSpacing: "0.2em" }}>Crypto</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          {market.map((coin) => (
            <div key={coin.id} style={{ padding: 18, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: `1px solid ${couleurs.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div style={{ width: 26, height: 26, borderRadius: 999, background: `${coin.accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={coin.icon} alt="" style={{ width: 14, height: 14, filter: "invert(1)", opacity: 0.7 }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: couleurs.primary }}>{coin.symbol}</p>
                    <p style={{ fontSize: 9, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.16em" }}>{coin.name}</p>
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: coin.change24h >= 0 ? couleurs.accent : "#fca5a5" }}>
                  {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                </span>
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: couleurs.primary, letterSpacing: "-0.04em" }}>{formatCryptoPrice(coin.price)} F CFA</p>
              <div style={{ marginTop: 12, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)" }}>
                <div style={{ width: `${Math.max(18, Math.min(100, 50 + coin.change24h * 2))}%`, height: "100%", borderRadius: 99, background: coin.change24h >= 0 ? couleurs.accent : "rgba(255,255,255,0.35)" }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
// ─── PageBourse ───────────────────────────────────────────────────────────────
// À coller dans DashboardLive.tsx juste avant le composant PageAccueil / DashboardLive

const PageBourse: React.FC<{ data: DashboardData }> = ({ data }) => {
  const marche = data.bourse;
  const [tickerActif, setTickerActif] = useState<string>(marche[0]?.symbol ?? "AAPL");
  const [historique, setHistorique] = useState<BourseHistoriqueItem[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  const tickerInfo = useMemo(
    () => marche.find((t) => t.symbol === tickerActif) ?? null,
    [marche, tickerActif],
  );

  const topGaineur = useMemo(
    () => [...marche].sort((a, b) => b.variation - a.variation)[0] ?? null,
    [marche],
  );

  const topPerdant = useMemo(
    () => [...marche].sort((a, b) => a.variation - b.variation)[0] ?? null,
    [marche],
  );

  const chargerHistorique = async (symbol: string) => {
    setLoadingHistorique(true);
    try {
      const data = await apiFetch(`/bourse/historique/${symbol}?jours=30`);
      setHistorique(Array.isArray(data) ? data : []);
    } catch {
      setHistorique([]);
    } finally {
      setLoadingHistorique(false);
    }
  };

  useEffect(() => {
    if (tickerActif) void chargerHistorique(tickerActif);
  }, [tickerActif]);

  const chartData = useMemo(
    () =>
      historique.map((item) => ({
        date: item.date.slice(5), // MM-DD
        close: item.close,
        open: item.open,
      })),
    [historique],
  );

  const variationCouleur = (v: number) =>
    v >= 0 ? couleurs.accent : "#fca5a5";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          ...styleCarte({
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(18,24,38,0.92) 0%, rgba(8,12,20,0.88) 100%)",
            border: "1px solid rgba(255,255,255,0.10)",
          }),
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 15% 50%, rgba(232,255,90,0.10), transparent 30%), radial-gradient(circle at 85% 20%, rgba(96,165,250,0.12), transparent 30%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div>
            <p style={etiquette()}>Bourse — Marchés actions</p>
            <h2 style={{ fontSize: 30, fontWeight: 700, color: couleurs.primary, letterSpacing: "-0.03em", marginBottom: 8 }}>
              Données de clôture en temps réel
            </h2>
            <p style={{ fontSize: 12, color: couleurs.secondary, lineHeight: 1.7, maxWidth: 440 }}>
              Cours EOD via Marketstack · NASDAQ & NYSE · Cache 24h
            </p>
            <div className="flex gap-3 mt-5 flex-wrap">
              {[
                { label: "Titres suivis", val: String(marche.filter((t) => t.disponible).length) },
                { label: "Top gaineur", val: topGaineur ? `${topGaineur.symbol} +${topGaineur.variation.toFixed(1)}%` : "—", color: couleurs.accent },
                { label: "Top perdant", val: topPerdant && topPerdant.variation < 0 ? `${topPerdant.symbol} ${topPerdant.variation.toFixed(1)}%` : "—", color: "#fca5a5" },
              ].map((item) => (
                <div key={item.label} style={{ padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: `1px solid ${couleurs.border}` }}>
                  <p style={{ fontSize: 9, color: couleurs.soft, textTransform: "uppercase", letterSpacing: "0.2em" }}>{item.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: item.color ?? couleurs.primary, marginTop: 5 }}>{item.val}</p>
                </div>
              ))}
            </div>
          </div>
          <img src={iconGold} alt="" style={{ width: 80, height: 80, opacity: 0.15, filter: "invert(1)" }} />
        </div>
      </motion.div>

      {/* Cartes tickers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
        {marche.length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: 20, textAlign: "center" }}>
            <Loader2 size={20} className="animate-spin" color={couleurs.muted} style={{ margin: "0 auto 8px" }} />
            <p style={{ fontSize: 12, color: couleurs.soft }}>Chargement des données boursières…</p>
          </div>
        )}
        {marche.map((ticker, i) => {
          const estActif = ticker.symbol === tickerActif;
          return (
            <motion.button
              key={ticker.symbol}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setTickerActif(ticker.symbol)}
              style={{
                padding: 18,
                borderRadius: 18,
                background: estActif
                  ? "linear-gradient(135deg, rgba(232,255,90,0.16), rgba(232,255,90,0.06))"
                  : "rgba(255,255,255,0.04)",
                border: estActif
                  ? "1px solid rgba(232,255,90,0.35)"
                  : `1px solid ${couleurs.border}`,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                boxShadow: estActif ? "0 0 24px rgba(232,255,90,0.10)" : "none",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 13, fontWeight: 700, color: estActif ? couleurs.accent : couleurs.primary }}>{ticker.symbol}</span>
                {ticker.disponible && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                    background: ticker.variation >= 0 ? "rgba(232,255,90,0.12)" : "rgba(252,165,165,0.12)",
                    color: ticker.variation >= 0 ? couleurs.accent : "#fca5a5",
                  }}>
                    {ticker.variation >= 0 ? "+" : ""}{ticker.variation.toFixed(2)}%
                  </span>
                )}
              </div>
              <p style={{ fontSize: 10, color: couleurs.soft, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ticker.nom}</p>
              {ticker.disponible ? (
                <>
                  <p style={{ fontSize: 22, fontWeight: 700, color: couleurs.primary, letterSpacing: "-0.03em" }}>${ticker.close.toFixed(2)}</p>
                  <p style={{ fontSize: 9, color: couleurs.soft, marginTop: 4 }}>{ticker.exchange}</p>
                </>
              ) : (
                <p style={{ fontSize: 11, color: couleurs.soft }}>Données indisponibles</p>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Graphique historique + détails */}
      {tickerInfo && (
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
          {/* Graphique */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styleCarte()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p style={etiquette()}>Historique 30 jours</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: couleurs.primary }}>{tickerInfo.symbol} — {tickerInfo.nom}</p>
              </div>
              {loadingHistorique && <Loader2 size={14} className="animate-spin" color={couleurs.muted} />}
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gBourse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={couleurs.accent} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={couleurs.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: couleurs.soft, fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis
                    tick={{ fill: couleurs.soft, fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<BulleInfo />} />
                  <Area type="monotone" dataKey="close" name="Clôture" stroke={couleurs.accent} strokeWidth={2} fill="url(#gBourse)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: 12, color: couleurs.soft }}>
                  {loadingHistorique ? "Chargement…" : "Aucune donnée disponible"}
                </p>
              </div>
            )}
          </motion.div>

          {/* Détails du ticker sélectionné */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} style={styleCarte()}>
            <p style={etiquette()}>Données de clôture</p>
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(232,255,90,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={iconGold} alt="" style={{ width: 22, height: 22, filter: "invert(1)", opacity: 0.7 }} />
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color: couleurs.primary }}>{tickerInfo.symbol}</p>
                <p style={{ fontSize: 11, color: couleurs.soft }}>{tickerInfo.exchange}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Ouverture", val: tickerInfo.disponible ? `$${tickerInfo.open.toFixed(2)}` : "—" },
                { label: "Clôture", val: tickerInfo.disponible ? `$${tickerInfo.close.toFixed(2)}` : "—", highlight: true },
                { label: "Plus haut", val: tickerInfo.disponible ? `$${tickerInfo.high.toFixed(2)}` : "—" },
                { label: "Plus bas", val: tickerInfo.disponible ? `$${tickerInfo.low.toFixed(2)}` : "—" },
                { label: "Volume", val: tickerInfo.disponible ? new Intl.NumberFormat("fr-FR").format(tickerInfo.volume) : "—" },
                { label: "Variation", val: tickerInfo.disponible ? `${tickerInfo.variation >= 0 ? "+" : ""}${tickerInfo.variation.toFixed(2)}%` : "—", color: tickerInfo.disponible ? variationCouleur(tickerInfo.variation) : undefined },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between" style={{ padding: "10px 14px", borderRadius: 12, background: row.highlight ? "rgba(232,255,90,0.07)" : "rgba(255,255,255,0.04)", border: row.highlight ? "1px solid rgba(232,255,90,0.18)" : `1px solid ${couleurs.border}` }}>
                  <span style={{ fontSize: 11, color: couleurs.soft }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: row.color ?? couleurs.primary }}>{row.val}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 9, color: couleurs.soft, marginTop: 14, textAlign: "center", lineHeight: 1.6 }}>
              Données EOD — Marketstack API<br />Cache 24h · Plan gratuit 100 req/mois
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};


const PageAccueil: React.FC<{
  data: DashboardData;
  onAdvice: () => void;
  onOpenTransactions: () => void;
}> = ({ data, onAdvice, onOpenTransactions }) => (
  <HomePage data={data} onAdvice={onAdvice} onOpenTransactions={onOpenTransactions} />
);

export default function DashboardLive() {
  const navigate = useNavigate();
  const [pageCourante, setPageCourante] = useState<PageKey>("dashboard");
  const [data, setData] = useState<DashboardData>({
    user: null,
    wallet: null,
    transactions: [],
    stats: null,
    objectifs: [],
    tontines: [],
    conseils: [],
    crypto: [],
    bourse: [],
  });
  const [loading, setLoading] = useState(true);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [isConseilModalOpen, setIsConseilModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'tontine' | 'epargne'; date: string }>>([]);

  const pageTitles: Record<PageKey, string> = {
    dashboard: "Bonjour",
    stats: "Statistiques",
    transactions: "Transactions",
    crypto: "Crypto",
    objectifs: "Objectifs d'épargne",
    tontines: "Tontines",
    bourse: "Bourse",
  };

  const loadDashboard = async () => {
    const rawUser = localStorage.getItem("user");
    const authUser = rawUser ? JSON.parse(rawUser) as { id?: number } : null;

    if (!authUser?.id) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [user, wallet, transactions, stats, objectifs, tontines, conseils, crypto, bourse] = await Promise.all([
        apiFetch(`/users/${authUser.id}`),
        apiFetch(`/wallet/moi`),
        apiFetch(`/transactions`),
        apiFetch(`/transactions/stats`),
        apiFetch(`/objectifs`),
        apiFetch(`/tontines`),
        apiFetch(`/ia/historique`),
        apiFetch(`/crypto/prix?coins=bitcoin,ethereum,solana,avalanche-2`),
        apiFetch('/bourse/marche').catch(() => []),
      ]);

      setData({
        user,
        wallet,
        transactions: transactions ?? [],
        stats,
        objectifs: objectifs ?? [],
        tontines: tontines ?? [],
        conseils: conseils ?? [],
        crypto: buildCryptoMarket(crypto),
        bourse: buildBourseMarket(bourse),
      });

      // Vérifier les notifications de tontines et épargne
      verifierNotifications(tontines ?? [], objectifs ?? []);
    } catch (caughtError: any) {
      setError(caughtError?.message || "Impossible de charger le tableau de bord");
    } finally {
      setLoading(false);
    }
  };

  const verifierNotifications = (tontines: BackendTontine[], objectifs: BackendObjectif[]) => {
    const newNotifications: Array<{ id: string; message: string; type: 'tontine' | 'epargne'; date: string }> = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Notifications pour tontines
    tontines.forEach((tontine) => {
      if (tontine.prochainVersement) {
        const paymentDate = new Date(tontine.prochainVersement);
        const daysUntil = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil === 0) {
          newNotifications.push({
            id: `tontine-${tontine.id}-today`,
            message: `Versement tontine "${tontine.nom}" aujourd'hui (${formatMoney(tontine.montantParTour)} F)`,
            type: 'tontine',
            date: tontine.prochainVersement,
          });
        } else if (daysUntil === 1) {
          newNotifications.push({
            id: `tontine-${tontine.id}-tomorrow`,
            message: `Versement tontine "${tontine.nom}" demain (${formatMoney(tontine.montantParTour)} F)`,
            type: 'tontine',
            date: tontine.prochainVersement,
          });
        } else if (daysUntil <= 3) {
          newNotifications.push({
            id: `tontine-${tontine.id}-reminder`,
            message: `Versement tontine "${tontine.nom}" dans ${daysUntil} jours`,
            type: 'tontine',
            date: tontine.prochainVersement,
          });
        }
      }
    });

    // Notifications pour objectifs d'épargne
    objectifs.forEach((objectif) => {
      if (objectif.deadline) {
        const deadline = new Date(objectif.deadline);
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const progress = calcObjectiveProgress(objectif);

        if (daysUntil === 0 && progress < 100) {
          newNotifications.push({
            id: `objectif-${objectif.id}-deadline`,
            message: `Deadline objectif "${objectif.titre}" aujourd'hui (${progress}% atteint)`,
            type: 'epargne',
            date: objectif.deadline,
          });
        } else if (daysUntil <= 7 && progress < 100) {
          newNotifications.push({
            id: `objectif-${objectif.id}-reminder`,
            message: `Deadline objectif "${objectif.titre}" dans ${daysUntil} jours (${progress}% atteint)`,
            type: 'epargne',
            date: objectif.deadline,
          });
        }
      }
    });

    setNotifications(newNotifications);
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const genererConseilIA = async () => {
    if (adviceLoading) return;
    setAdviceLoading(true);
    try {
      const conseil = await apiFetch(`/ia/conseil`, { method: "POST" });
      setData((current) => ({
        ...current,
        conseils: [conseil, ...current.conseils].slice(0, 5),
      }));
    } catch (caughtError: any) {
      setError(caughtError?.message || "Impossible de générer le conseil IA");
    } finally {
      setAdviceLoading(false);
    }
  };

  useEffect(() => {
    document.title = `${pageTitles[pageCourante]} | DEUREUM`;
  }, [pageCourante]);

  const content = useMemo(() => {
    if (pageCourante === "dashboard") {
      return <PageAccueil data={data} onAdvice={genererConseilIA} onOpenTransactions={() => setPageCourante("transactions")} />;
    }
    if (pageCourante === "stats") return <PageStatistiques data={data} />;
    if (pageCourante === "transactions") return <PageTransactions data={data} onRefresh={loadDashboard} />;
    if (pageCourante === "crypto") return <PageCrypto data={data} />;
    if (pageCourante === "objectifs") return <PageObjectifs data={data} onRefresh={loadDashboard} />;
    if (pageCourante === "bourse") return <PageBourse data={data} />;
    return <PageTontines data={data} onRefresh={loadDashboard} />;
  }, [adviceLoading, data, genererConseilIA, pageCourante]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0d1520", color: couleurs.primary, fontFamily: "'Satoshi', sans-serif" }}>
        <div className="flex items-center gap-3" style={{ padding: 24, borderRadius: 18, background: "rgba(30,45,65,0.45)", border: `1px solid ${couleurs.border}` }}>
          <Loader2 className="animate-spin" size={18} />
          <span style={{ fontSize: 13 }}>Chargement du dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Satoshi', sans-serif", color: couleurs.primary, background: "#0d1520" }}>
      <DashboardBackdrop />

      <div className="relative z-10 flex w-full h-full">
        <BarreNavigation actif={pageCourante} setActif={setPageCourante} user={data.user} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <HeaderInfo title={`${pageTitles[pageCourante]}${pageCourante === "dashboard" ? `, ${data.user?.nom ?? "Utilisateur"}` : ""}`} user={data.user} onAdvice={genererConseilIA} adviceLoading={adviceLoading} notifications={notifications} />

          {error && (
            <div style={{ margin: "0 24px 0", padding: "10px 14px", borderRadius: 14, background: "rgba(255,90,90,0.12)", border: "1px solid rgba(255,90,90,0.24)", color: "#fecaca", fontSize: 12 }}>
              {error}
            </div>
          )}

          <main className="flex-1 overflow-y-auto px-8 py-5 pt-4" style={{ scrollbarWidth: "none" }}>
            <AnimatePresence mode="wait">
              <motion.div key={pageCourante} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                {content}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* IBA Assistant - Visible uniquement sur le dashboard */}
      <IBAAssistant onOpenConseil={() => setIsConseilModalOpen(true)} />
      
      {/* Modal de conseil IA */}
      <ConseilIAModal 
        isOpen={isConseilModalOpen} 
        onClose={() => setIsConseilModalOpen(false)} 
      />
    </div>
  );
}