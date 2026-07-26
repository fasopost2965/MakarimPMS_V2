import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listStaysEnCours, listDepartsDuJour } from "@/features/checkin/api";
import type { Stay } from "@/features/checkin/types";
import { downloadPoliceRecordPdf } from "../api";
import { PoliceRecordForm } from "../components/PoliceRecordForm";

export function PolicePage() {
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "pending"
  >("all");

  // Selected stay for Police Form modal
  const [selectedStayForForm, setSelectedStayForForm] = useState<Stay | null>(
    null,
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [enCours, departs] = await Promise.all([
        listStaysEnCours(),
        listDepartsDuJour(),
      ]);
      // Merge unique stays by id
      const stayMap = new Map<number, Stay>();
      enCours.forEach((s) => stayMap.set(s.id, s));
      departs.forEach((s) => stayMap.set(s.id, s));
      setStays(Array.from(stayMap.values()));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur de chargement des fiches de police",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  // Filtered stays
  const filteredStays = useMemo(() => {
    return stays.filter((s) => {
      const guestName =
        `${s.guest?.nom ?? ""} ${s.guest?.prenom ?? ""}`.toLowerCase();
      const roomNum = (s.room?.numero ?? "").toLowerCase();
      const pieceNum = (s.policeRecord?.numeroPiece ?? "").toLowerCase();
      const matchesSearch =
        guestName.includes(searchQuery.toLowerCase()) ||
        roomNum.includes(searchQuery.toLowerCase()) ||
        pieceNum.includes(searchQuery.toLowerCase());

      const isCompleted = s.policeRecord !== null;
      if (statusFilter === "completed" && !isCompleted) return false;
      if (statusFilter === "pending" && isCompleted) return false;

      return matchesSearch;
    });
  }, [stays, searchQuery, statusFilter]);

  // Statistics
  const totalCount = stays.length;
  const completedCount = stays.filter((s) => s.policeRecord !== null).length;
  const pendingCount = totalCount - completedCount;
  const complianceRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  // Export teletransmission CSV
  const handleExportTeletransmission = () => {
    const csvRows = [
      [
        "N° Séjour",
        "Chambre",
        "Nom Client",
        "Prénom",
        "Nationalité",
        "Type Pièce",
        "N° Pièce",
        "Date Naissance",
        "Provenance",
        "Destination",
        "Date Arrivée",
        "Date Départ Prévue",
      ].join(";"),
    ];

    stays.forEach((s) => {
      const p = s.policeRecord;
      if (p) {
        csvRows.push(
          [
            s.id,
            s.room?.numero ?? "",
            s.guest?.nom ?? "",
            s.guest?.prenom ?? "",
            p.nationalite,
            p.typePiece,
            p.numeroPiece,
            p.dateNaissance ? p.dateNaissance.slice(0, 10) : "",
            `${p.villeProvenance ?? ""} (${p.paysProvenance ?? ""})`,
            `${p.villeDestination ?? ""} (${p.paysDestination ?? ""})`,
            s.dateCheckin ? s.dateCheckin.slice(0, 10) : "",
            s.dateCheckoutPrevue ? s.dateCheckoutPrevue.slice(0, 10) : "",
          ].join(";"),
        );
      }
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `teletransmission-dgsn-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = async (stayId: number) => {
    try {
      await downloadPoliceRecordPdf(stayId);
    } catch {
      alert(
        "Impossible de télécharger le fichier PDF. Assurez-vous que la fiche existe.",
      );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
            Registre & Fiches de Police (DGSN)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion du registre légal de la DGSN et du Ministère du Tourisme
            pour les séjours.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportTeletransmission}
            className="flex items-center gap-2 border-slate-300"
            disabled={completedCount === 0}
          >
            <Download className="h-4 w-4" />
            Export Télétransmission DGSN (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Séjours Actifs
            </span>
            <Building className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {totalCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Clients hébergés en cours
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fiches Conformes
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {completedCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Saisies et prêtes à la télétransmission
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              À Compléter
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            {pendingCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fiches manquantes ou incomplètes
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Conformité DGSN
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {complianceRate}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Taux de fiches complétées
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par client, chambre, CIN, passeport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-slate-600">Statut:</span>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) =>
              setStatusFilter(val as "all" | "completed" | "pending")
            }
          >
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les fiches</SelectItem>
              <SelectItem value="completed">Conformes (Complétées)</SelectItem>
              <SelectItem value="pending">Incomplètes / Manquantes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            Chargement des fiches de police...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 text-sm">{error}</div>
        ) : filteredStays.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm space-y-2">
            <Clock className="h-8 w-8 mx-auto text-slate-300" />
            <p>Aucun séjour correspondant aux critères de recherche.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-[100px] font-semibold text-slate-700">
                  Chambre
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Client
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Pièce / N°
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Nationalité
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Dates du séjour
                </TableHead>
                <TableHead className="font-semibold text-slate-700">
                  Statut DGSN
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStays.map((stay) => {
                const p = stay.policeRecord;
                const isCompleted = p !== null;

                return (
                  <TableRow
                    key={stay.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <TableCell className="font-bold text-slate-900">
                      Ch. {stay.room?.numero ?? stay.roomId}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {stay.guest
                          ? `${stay.guest.nom} ${stay.guest.prenom}`
                          : "Client inconnu"}
                      </div>
                      {stay.guest?.telephone && (
                        <div className="text-xs text-muted-foreground">
                          {stay.guest.telephone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isCompleted ? (
                        <div className="text-sm">
                          <span className="font-semibold text-slate-800">
                            {p.typePiece}:{" "}
                          </span>
                          <span className="font-mono text-slate-600">
                            {p.numeroPiece}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 italic">
                          Pièce non renseignée
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isCompleted ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-slate-300 font-normal"
                        >
                          {p.nationalite}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div>
                        Du{" "}
                        {stay.dateCheckin
                          ? new Date(stay.dateCheckin).toLocaleDateString(
                              "fr-FR",
                            )
                          : "-"}
                      </div>
                      <div>
                        Au{" "}
                        {stay.dateCheckoutPrevue
                          ? new Date(
                              stay.dateCheckoutPrevue,
                            ).toLocaleDateString("fr-FR")
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isCompleted ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Conforme
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1">
                          <AlertTriangle className="h-3 w-3" /> À compléter
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant={isCompleted ? "outline" : "default"}
                          className={
                            !isCompleted
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : ""
                          }
                          onClick={() => setSelectedStayForForm(stay)}
                        >
                          {isCompleted ? "Modifier" : "Saisir la fiche"}
                        </Button>

                        {isCompleted && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Télécharger PDF DGSN"
                            onClick={() => void handleDownloadPdf(stay.id)}
                          >
                            <FileText className="h-4 w-4 text-slate-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Police Record Form Modal */}
      {selectedStayForForm && (
        <Dialog
          open={selectedStayForForm !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedStayForForm(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Fiche de Police — Chambre{" "}
                {selectedStayForForm.room?.numero ?? selectedStayForForm.roomId}
              </DialogTitle>
            </DialogHeader>
            <PoliceRecordForm
              stayId={selectedStayForForm.id}
              reservationId={selectedStayForForm.reservationId}
              onSaved={() => {
                setSelectedStayForForm(null);
                void loadData();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
