import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { login, rolesActifs } from "../api";
import { setCsrfToken, setLoggedInHint } from "@/lib/token-storage";
import type { RoleActif } from "../types";
import { ConnectivityDiagnosticModal } from "@/components/ConnectivityDiagnosticModal";
import { EnvironmentDiagnosticCard } from "@/components/EnvironmentDiagnosticCard";
import {
  
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  
  BedDouble,
  BarChart3,
  Users,
  KeyRound,
  Wrench,
  Terminal,
} from "lucide-react";

interface Props {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
}

function getRoleIcon(roleName: string) {
  const nameLower = roleName.toLowerCase();
  if (nameLower.includes("admin") || nameLower.includes("direction"))
    return ShieldCheck;
  if (nameLower.includes("récept") || nameLower.includes("check"))
    return KeyRound;
  if (nameLower.includes("gouvern") || nameLower.includes("house"))
    return BedDouble;
  if (nameLower.includes("maint")) return Wrench;
  if (nameLower.includes("analyt") || nameLower.includes("report"))
    return BarChart3;
  return Users;
}

export function LoginPage({ onLoginSuccess, onForgotPassword }: Props) {
  const [roles, setRoles] = useState<RoleActif[]>([]);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const loadRoles = useCallback(async () => {
    try {
      setRoles(await rolesActifs());
    } catch {
      // Non bloquant : la connexion reste possible même si cet appel échoue.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRoles();
  }, [loadRoles]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { csrfToken } = await login(email, motDePasse);
      setCsrfToken(csrfToken);
      setLoggedInHint();
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  const fillQuickPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setMotDePasse("Password123!");
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground antialiased selection:bg-primary/20">
      {/* SECTION GAUCHE : Showcase Brand & Expérience Hôtelière (Grand écran) */}
      <div className="relative hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 bg-[#003b95] text-white overflow-hidden border-r border-[#002b70]">
        {/* En-tête de Marque */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo-makarim.jpg" alt="Logo Makarim" className="h-12 w-auto rounded-md shadow-md" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Hôtel Makarim
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ffb700] text-[#1a1a1a]">
                3★ PMS
              </span>
            </h2>
            <p className="text-xs text-blue-100/80">
              Système de Gestion Hôtelière & Conciergerie
            </p>
          </div>
        </div>

        {/* Message d'Accueil Simplifié */}
        <div className="relative z-10 my-auto py-12 space-y-8 flex flex-col items-center justify-center text-center">
          <img src="/logo-makarim.jpg" alt="Hôtel Makarim" className="w-48 h-auto rounded-xl shadow-2xl mb-6" />
          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-snug">
            Bienvenue sur le Portail Makarim
          </h1>
          <p className="text-sm text-blue-100/90 max-w-lg leading-relaxed">
            Console d'administration sécurisée
          </p>
        </div>
        {/* Pied de Page Gauche */}
        <div className="relative z-10 pt-6 border-t border-[#002b70] flex items-center justify-between text-xs text-blue-100/80">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Serveurs PMS en ligne</span>
          </div>
          <span className="text-blue-100/80">v2.4 • Support 24/7</span>
        </div>
      </div>

      {/* SECTION DROITE : Formulaire de Connexion */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl lg:max-w-none mx-auto w-full">
        {/* En-tête Mobile */}
        <div className="flex lg:hidden items-center justify-between pb-6 border-b">
          <div className="flex items-center gap-3">
            <img src="/logo-makarim.jpg" alt="Logo Makarim" className="h-10 w-auto rounded-md shadow" />
            <div>
              <h1 className="text-lg font-bold">Hôtel Makarim</h1>
              <p className="text-xs text-muted-foreground">
                Système de gestion hôtelière
              </p>
            </div>
          </div>
        </div>

        <div className="my-auto py-6 sm:py-10 space-y-8 w-full max-w-md mx-auto">
          {/* Titre du Formulaire */}
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Espace Connexion
            </h2>
            <p className="text-sm text-muted-foreground">
              Veuillez saisir vos identifiants professionnels pour accéder à la
              console.
            </p>
          </div>

          {/* Rôles Actifs Détectés */}
          {roles.length > 0 && (
            <div className="space-y-2 p-3 rounded-xl bg-muted/40 border text-xs">
              <div className="flex items-center justify-between text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Profils d'accès disponibles sur cette instance
                </span>
                <span className="font-mono text-[10px] bg-background px-1.5 py-0.5 rounded border">
                  {roles.length} rôles
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {roles.map((role) => {
                  const Icon = getRoleIcon(role.nom);
                  return (
                    <Badge
                      key={role.id}
                      variant="secondary"
                      className="gap-1 py-1 px-2.5 hover:bg-secondary/80 transition-colors cursor-default"
                    >
                      <Icon className="h-3 w-3 text-primary" />
                      <span>{role.nom}</span>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alert Message en cas d'erreur */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in-50 duration-200">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Échec de la connexion</p>
                <p className="text-xs opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Formulaire Principal */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Adresse Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="nom@makarim-hotel.com"
                  className="pl-10 h-11 text-sm bg-background/50 focus:bg-background transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="motDePasse"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Mot de passe
                </Label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-medium text-primary hover:underline focus:outline-none"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="motDePasse"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="pl-10 pr-10 h-11 text-sm bg-background/50 focus:bg-background transition-colors"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 font-semibold text-sm shadow-md transition-all gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authentification en cours…</span>
                </>
              ) : (
                <>
                  <span>Se connecter à la console</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Raccourcis de Test Rapide / Démo */}
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>Comptes de test rapide :</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillQuickPreset("admin@makarim.test")}
                className="text-xs px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted border transition-colors flex items-center gap-1.5 font-mono"
              >
                <ShieldCheck className="h-3 w-3 text-amber-500" />
                <span>admin@makarim.test</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickPreset("reception@makarim.test")}
                className="text-xs px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted border transition-colors flex items-center gap-1.5 font-mono"
              >
                <KeyRound className="h-3 w-3 text-blue-500" />
                <span>reception@makarim.test</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pied de Page & Diagnostics Réseau */}
        <div className="pt-6 border-t flex flex-col gap-3 w-full max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Connexion sécurisée SSL / CSRF
            </span>

            <div className="flex items-center gap-3">
              <ConnectivityDiagnosticModal
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 font-medium transition-colors"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>{showDiagnostics ? "Masquer Diag" : "Diagnostic"}</span>
              </button>
            </div>
          </div>

          {/* Accordéon pour le Diagnostic d'Environnement */}
          {showDiagnostics && (
            <div className="pt-2 animate-in fade-in-50 duration-200">
              <EnvironmentDiagnosticCard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
