import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { shortenStay } from "../api";
import type { Stay } from "../types";

interface Props {
  stay: Stay | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShortenStayDialog({ stay, onClose, onSuccess }: Props) {
  const [newDate, setNewDate] = useState(
    stay ? stay.dateCheckoutPrevue.slice(0, 10) : "",
  );
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!stay) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motif.trim().length < 10) {
      setError(
        "Le motif de l’écourtement doit contenir au moins 10 caractères.",
      );
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await shortenStay(stay.id, {
        dateCheckoutPrevue: newDate,
        motif: motif.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as Error)?.message ||
          "Erreur lors de l’écourtement du séjour.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={stay !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Écourter le Séjour #{stay.id}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Actuellement prévu jusqu'au{" "}
            <strong>
              {new Date(stay.dateCheckoutPrevue).toLocaleDateString("fr-FR")}
            </strong>
            . La réduction libérera les nuits excédentaires et journalisera un
            audit.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="newDate" className="text-xs font-semibold">
              Nouvelle Date de Départ Prévue
            </Label>
            <Input
              id="newDate"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              max={stay.dateCheckoutPrevue.slice(0, 10)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motif" className="text-xs font-semibold">
              Motif de l'Écourtement (obligatoire, min. 10 caractères)
            </Label>
            <Textarea
              id="motif"
              placeholder="Ex: Départ anticipé du client pour impératif professionnel..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              {motif.trim().length}/10 caractères minimum
            </p>
          </div>

          {error && (
            <div className="p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || motif.trim().length < 10}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {loading ? "Enregistrement..." : "Confirmer l'Écourtement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
