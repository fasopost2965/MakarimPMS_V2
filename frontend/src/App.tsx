import { Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toast";
import { LogoutGuardDialog } from "@/features/hr/components/LogoutGuardDialog";
import { statutCourant } from "@/features/hr/api";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { me as fetchMe } from "@/features/auth/api";

import { ReservationsCalendarPage } from "@/features/reservations/pages/ReservationsCalendarPage";
import { CheckinPage } from "@/features/checkin/pages/CheckinPage";
import { HousekeepingPage } from "@/features/housekeeping/pages/HousekeepingPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { MaintenancePage } from "@/features/maintenance/pages/MaintenancePage";
import { GuestsPage } from "@/features/guests/pages/GuestsPage";
import { CompaniesPage } from "@/features/companies/pages/CompaniesPage";
import { ParametersPage } from "@/features/parameters/pages/ParametersPage";
import { HrPage } from "@/features/hr/pages/HrPage";
import { StockPage } from "@/features/stock/pages/StockPage";
import { ReportingPage } from "@/features/reporting/pages/ReportingPage";
import { BillingPage } from "@/features/billing/pages/BillingPage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";
import { AuditPage } from "@/features/audit/pages/AuditPage";
import { DocumentOcrPage } from "@/features/document-ocr/pages/DocumentOcrPage";
import { PolicePage } from "@/features/police/pages/PolicePage";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { logoutRequest, onAuthFailure } from "@/lib/api-client";
import {
  clearLoggedInHint,
  hasLoggedInHint,
  setCsrfToken,
} from "@/lib/token-storage";

export type Tab =
  | "dashboard"
  | "reservations"
  | "checkin"
  | "police"
  | "housekeeping"
  | "maintenance"
  | "guests"
  | "companies"
  | "parameters"
  | "hr"
  | "stock"
  | "reporting"
  | "billing"
  | "notifications"
  | "audit"
  | "document-ocr";
type AuthScreen = "login" | "forgot-password";

// Coquille applicative : sidebar repliable (navigation principale) + topbar
// (titre de page, pointage self-service, déconnexion). Pas de routeur —
// sera introduit avec le module core (layout/routing), voir
// docs/plan-execution-claude-code.md §1 ; un simple switch d'onglet suffit
// tant qu'il n'y a pas d'URL profonde à adresser.
function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // CH-034 — tiroir de navigation mobile (docs/audits/PHASE_11_FRONTEND_QUALITE.md
  // §4.7), distinct de `sidebarCollapsed` (mode icônes seules, desktop
  // uniquement) — voir AppSidebar.tsx pour le détail de la séparation des
  // deux concepts.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // CH-026(e) — les jetons vivent dans des cookies httpOnly, invisibles au
  // JS : hasLoggedInHint() est un simple indicateur non sensible (jamais
  // une décision de sécurité) pour l'hypothèse d'authentification
  // optimiste au premier rendu, évitant un flash de l'écran de connexion.
  // Si la session est en réalité expirée/invalide, le premier appel API
  // échouera en 401, déclenchera une tentative de refresh (voir
  // lib/api-client.ts), et onAuthFailure() nous ramènera ici si le refresh
  // échoue aussi.
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    hasLoggedInHint(),
  );
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [logoutGuardOpen, setLogoutGuardOpen] = useState(false);
  // CH-011 — permissions effectives de l'utilisateur courant, `null` tant
  // qu'elles n'ont pas encore été chargées (voir AppSidebar).
  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    onAuthFailure(() => {
      clearLoggedInHint();
      setCsrfToken(null);
      setIsAuthenticated(false);
      setAuthScreen("login");
      setPermissions(null);
    });
  }, []);

  // CH-011 — recharge les permissions à chaque (re)connexion. Pas de
  // rafraîchissement périodique : un retrait de permission en cours de
  // session ne se reflète qu'au prochain login, cohérent avec le caractère
  // cosmétique/UX de ce chantier (le vrai contrôle reste PermissionsGuard,
  // vérifié en base à chaque requête serveur, jamais affaibli par ce délai
  // frontend).
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMe()
      .then((user) => {
        // CH-026(e) — seul moyen de récupérer le jeton CSRF après un
        // rechargement de page (perdu avec le contexte JS précédent, voir
        // lib/token-storage.ts) ; sans lui, la première requête mutante
        // après un F5 échouerait à tort en 403.
        setCsrfToken(user.csrfToken);
        setPermissions(user.permissions);
      })
      .catch(() => setPermissions([]));
  }, [isAuthenticated]);

  // Si l'onglet actif devient invisible (permissions chargées, ex. rôle
  // Gouvernante sans dashboard:read) bascule sur le premier onglet
  // réellement accessible plutôt que de laisser un écran vide sans onglet
  // actif dans la sidebar. Ajustement pendant le rendu (pas un useEffect) —
  // pattern recommandé par React pour "adjuster un state à partir d'un
  // autre state qui change" : évite un rendu intermédiaire avec l'ancien
  // onglet actif inexistant dans une sidebar déjà filtrée.
  const [permissionsAppliedTo, setPermissionsAppliedTo] = useState<
    string[] | null
  >(null);
  if (permissions !== permissionsAppliedTo) {
    setPermissionsAppliedTo(permissions);
    if (permissions !== null) {
      const activeItem = NAV_ITEMS.find((item) => item.tab === tab);
      const activeVisible = activeItem
        ? permissions.includes(activeItem.permission)
        : false;
      if (!activeVisible) {
        const firstVisible = NAV_ITEMS.find((item) =>
          permissions.includes(item.permission),
        );
        if (firstVisible) setTab(firstVisible.tab);
      }
    }
  }

  function doLogout() {
    // CH-026(f) — best-effort, ne bloque jamais la déconnexion locale (voir
    // logoutRequest) : révoque le refresh token côté serveur en tâche de
    // fond pendant que l'UI bascule immédiatement sur l'écran de connexion.
    void logoutRequest();
    clearLoggedInHint();
    setCsrfToken(null);
    setIsAuthenticated(false);
    setAuthScreen("login");
    setLogoutGuardOpen(false);
    setPermissions(null);
  }

  // BR-RH-004 (ADR-007) : une déconnexion pendant un service de pointage
  // actif est bloquée tant que l'employé n'a pas explicitement clôturé ou
  // mis en pause son service.
  async function handleLogout() {
    try {
      const statut = await statutCourant();
      if (statut.bloqueDeconnexion) {
        setLogoutGuardOpen(true);
        return;
      }
    } catch {
      // Pas de fiche employé associée à ce compte (ex. Administrateur) —
      // rien ne bloque la déconnexion.
    }
    doLogout();
  }

  if (!isAuthenticated) {
    if (authScreen === "forgot-password") {
      return (
        <ForgotPasswordPage onBackToLogin={() => setAuthScreen("login")} />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={() => setIsAuthenticated(true)}
        onForgotPassword={() => setAuthScreen("forgot-password")}
      />
    );
  }

  return (
    <div className="flex h-screen">
      <AppSidebar
        activeTab={tab}
        onNavigate={setTab}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        permissions={permissions}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          activeTab={tab}
          onNavigate={setTab}
          onLogout={handleLogout}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <div className="flex-1 overflow-auto">
          {/* CH-031 — une erreur de rendu dans l'onglet actif ne doit plus
              jamais faire tomber toute l'application (docs/audits/
              PHASE_11_FRONTEND_QUALITE.md §4.5). resetKey=tab : changer
              d'onglet réarme automatiquement la limite, même sans passer
              par le bouton « Revenir au tableau de bord ». */}
          <ErrorBoundary resetKey={tab} onReset={() => setTab("dashboard")}>
            {/* CH-030 — état de chargement explicite pendant le
                téléchargement du chunk de l'onglet (EXIGENCES_UX.md :
                jamais un écran blanc), même patron textuel que les états
                `loading` déjà en place dans chaque écran (ex.
                HousekeepingPage). */}
            <Suspense
              fallback={
                <p className="text-muted-foreground p-6 text-sm">Chargement…</p>
              }
            >
              {tab === "dashboard" && <DashboardPage onNavigate={setTab} />}
              {tab === "reservations" && <ReservationsCalendarPage />}
              {tab === "checkin" && <CheckinPage />}
              {tab === "police" && <PolicePage />}
              {tab === "housekeeping" && <HousekeepingPage />}
              {tab === "maintenance" && <MaintenancePage />}
              {tab === "guests" && <GuestsPage />}
              {tab === "companies" && <CompaniesPage />}
              {tab === "parameters" && <ParametersPage />}
              {tab === "hr" && <HrPage />}
              {tab === "stock" && <StockPage />}
              {tab === "reporting" && <ReportingPage />}
              {tab === "billing" && <BillingPage />}
              {tab === "notifications" && <NotificationsPage />}
              {tab === "audit" && <AuditPage />}
              {tab === "document-ocr" && <DocumentOcrPage />}
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
      <Toaster />
      <LogoutGuardDialog
        open={logoutGuardOpen}
        onCancel={() => setLogoutGuardOpen(false)}
        onResolved={doLogout}
      />
    </div>
  );
}

export default App;
