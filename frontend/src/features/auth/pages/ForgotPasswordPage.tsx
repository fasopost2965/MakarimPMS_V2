import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword, resetPassword } from "../api";
import {
  Building2,
  Mail,
  KeyRound,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

interface Props {
  onBackToLogin: () => void;
}

export function ForgotPasswordPage({ onBackToLogin }: Props) {
  const [step, setStep] = useState<"demande" | "reinitialisation" | "termine">(
    "demande",
  );
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState(
    () => new URLSearchParams(window.location.search).get("resetToken") ?? "",
  );
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestToken(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setStep("reinitialisation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(resetToken, nouveauMotDePasse);
      setStep("termine");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4 sm:p-6 antialiased selection:bg-primary/20">
      <div className="w-full max-w-md space-y-6">
        {/* En-tête avec Marque */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 mb-2">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hôtel Makarim</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Récupération de compte professionnel
          </p>
        </div>

        {/* Indicateur de Progression (Stepper) */}
        <div className="flex items-center justify-center gap-2 p-1.5 rounded-full bg-muted/50 border text-xs">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${
              step === "demande"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <span className="h-4 w-4 rounded-full bg-background/20 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Demande</span>
          </div>
          <span className="text-muted-foreground/40">•</span>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${
              step === "reinitialisation"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <span className="h-4 w-4 rounded-full bg-background/20 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Code & MDP</span>
          </div>
          <span className="text-muted-foreground/40">•</span>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${
              step === "termine"
                ? "bg-emerald-600 text-white font-semibold shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Terminé</span>
          </div>
        </div>

        {/* Carte de Formulaire */}
        <div className="p-6 sm:p-8 rounded-2xl bg-card border shadow-lg space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          {step === "demande" && (
            <form onSubmit={handleRequestToken} className="space-y-5">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold">Mot de passe oublié ?</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Saisissez l'adresse email associée à votre compte
                  professionnel. Nous vous enverrons un code sécurisé de
                  réinitialisation.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Email Professionnel
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nom@makarim-hotel.com"
                    className="pl-10 h-11 text-sm bg-background/50 focus:bg-background"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 font-semibold text-sm gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Envoi en cours…</span>
                  </>
                ) : (
                  <>
                    <span>Envoyer le code de réinitialisation</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={onBackToLogin}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Retour à la page de connexion</span>
              </Button>
            </form>
          )}

          {step === "reinitialisation" && (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold">Nouveau mot de passe</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Si un compte correspond à cette adresse email, un code unique
                  a été transmis (valable 30 minutes).
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="resetToken"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Code de sécurité reçu par email
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="resetToken"
                    placeholder="Ex: 849201"
                    className="pl-10 h-11 text-sm font-mono bg-background/50 focus:bg-background"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="nouveauMotDePasse"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Nouveau mot de passe (min. 8 car.)
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="nouveauMotDePasse"
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    placeholder="••••••••••••"
                    className="pl-10 pr-10 h-11 text-sm bg-background/50 focus:bg-background"
                    value={nouveauMotDePasse}
                    onChange={(e) => setNouveauMotDePasse(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
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
                className="w-full h-11 font-semibold text-sm gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mise à jour en cours…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Valider le nouveau mot de passe</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={onBackToLogin}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Annuler et revenir au login</span>
              </Button>
            </form>
          )}

          {step === "termine" && (
            <div className="text-center space-y-5 py-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold">
                  Mot de passe réinitialisé !
                </h2>
                <p className="text-xs text-muted-foreground">
                  Votre mot de passe a été mis à jour avec succès. Vous pouvez
                  maintenant vous connecter à la console.
                </p>
              </div>

              <Button
                type="button"
                onClick={onBackToLogin}
                className="w-full h-11 font-semibold text-sm"
              >
                Se connecter
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
