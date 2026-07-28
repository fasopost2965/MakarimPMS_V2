import { useEffect, useState } from "react";
import {
  Plus,
  Building2,
  Trash2,
  Edit,
  BedDouble,
  Layers,
  CalendarRange,
  Tag,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsPanel } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api-client";
import type { Room, RoomType } from "@/features/reservations/types";
import { listRooms } from "@/features/reservations/api";
import { createSeasonRate, listSeasonRates } from "@/features/parameters/api";
import type { SeasonRate } from "@/features/parameters/types";

export function RoomsSection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [seasonRates, setSeasonRates] = useState<SeasonRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre d'étage
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>("ALL");

  // Dialogs
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [numero, setNumero] = useState("");
  const [etage, setEtage] = useState<number>(1);
  const [roomTypeId, setRoomTypeId] = useState("");

  // Sub-dialog Nouveau Tarif Saisonnier
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [seasonLibelle, setSeasonLibelle] = useState("");
  const [seasonDateDebut, setSeasonDateDebut] = useState("2026-07-01");
  const [seasonDateFin, setSeasonDateFin] = useState("2026-08-31");
  const [seasonPrixNuit, setSeasonPrixNuit] = useState("");
  const [seasonRoomTypeId, setSeasonRoomTypeId] = useState("");

  // Dialog Type
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [typeName, setTypeName] = useState("");
  const [typePrice, setTypePrice] = useState("");
  const [typeCapacity, setTypeCapacity] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [resRooms, resRoomTypes, resSeasons] = await Promise.all([
        listRooms(),
        apiRequest<RoomType[]>("/parameters/room-types"),
        listSeasonRates(),
      ]);
      setRooms(resRooms);
      setRoomTypes(resRoomTypes);
      setSeasonRates(resSeasons);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  // Inférence automatique de l'étage depuis le numéro (ex. 201 -> Étage 2)
  const handleNumeroChange = (val: string) => {
    setNumero(val);
    const trimmed = val.trim();
    if (trimmed.length >= 3 && /^[1-9]/.test(trimmed)) {
      const parsedFloor = parseInt(trimmed[0], 10);
      if (parsedFloor >= 1 && parsedFloor <= 5) {
        setEtage(parsedFloor);
      }
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero || !roomTypeId) return;
    try {
      const payload = {
        numero: numero.trim(),
        etage: Number(etage),
        roomTypeId: Number(roomTypeId),
      };

      if (editingRoom) {
        await apiRequest(`/parameters/rooms/${editingRoom.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/parameters/rooms", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setRoomDialogOpen(false);
      void loadData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
      );
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette chambre ?")) return;
    try {
      await apiRequest(`/parameters/rooms/${id}`, { method: "DELETE" });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName || !typePrice || !typeCapacity) return;
    try {
      const body = {
        nom: typeName,
        prixBase: Number(typePrice),
        capacite: Number(typeCapacity),
      };
      if (editingType) {
        await apiRequest(`/parameters/room-types/${editingType.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiRequest("/parameters/room-types", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setTypeDialogOpen(false);
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDeleteType = async (id: number) => {
    if (
      !confirm(
        "Attention: vérifier que ce type n'est pas utilisé par des chambres.",
      )
    )
      return;
    try {
      await apiRequest(`/parameters/room-types/${id}`, { method: "DELETE" });
      void loadData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Erreur de suppression du type",
      );
    }
  };

  const handleSaveSeasonRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonLibelle || !seasonPrixNuit || !seasonRoomTypeId) return;
    try {
      await createSeasonRate({
        libelle: seasonLibelle,
        dateDebut: seasonDateDebut,
        dateFin: seasonDateFin,
        prixNuit: String(seasonPrixNuit),
        roomTypeId: Number(seasonRoomTypeId),
        motif:
          "Création tarif saisonnier via interface de gestion des chambres",
      });
      setSeasonDialogOpen(false);
      setSeasonLibelle("");
      setSeasonPrixNuit("");
      void loadData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Erreur création tarif saisonnier",
      );
    }
  };

  // Filtrage des chambres par étage
  const filteredRooms = rooms.filter((r) => {
    if (selectedFloorFilter === "ALL") return true;
    const rFloor = r.etage ?? (r.numero ? parseInt(r.numero[0], 10) : 1);
    return rFloor === Number(selectedFloorFilter);
  });

  // Obtenir les tarifs pour un type de chambre sélectionné
  const selectedTypeObj = roomTypes.find((t) => String(t.id) === roomTypeId);
  const selectedTypeSeasons = seasonRates.filter(
    (s) => String(s.roomTypeId) === roomTypeId,
  );

  if (loading)
    return (
      <p className="text-muted-foreground text-sm">
        Chargement des données du parc chambres...
      </p>
    );
  if (error) return <p className="text-destructive text-sm">{error}</p>;

  return (
    <div className="rounded-lg border bg-card p-6 shadow-xs flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Gestion des Chambres, Étages & Tarification
          </h3>
          <p className="text-muted-foreground text-xs mt-1">
            Création et configuration du parc de 24 chambres de l'Hôtel Makarim,
            répartition par étage, types et grille de tarifs.
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-1 border-primary/20 text-primary bg-primary/5 text-xs"
        >
          <Layers className="size-3.5" /> 3 Étages — 24 Chambres
        </Badge>
      </div>

      <Tabs defaultValue="rooms" className="w-full space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="rooms" className="gap-2 text-xs">
            <BedDouble className="size-4" /> Inventaire des Chambres (
            {rooms.length})
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-2 text-xs">
            <Building2 className="size-4" /> Catégories & Grille Tarifaire (
            {roomTypes.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CHAMBRES */}
        <TabsPanel value="rooms" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/20 p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold shrink-0">
                Filtrer par étage :
              </Label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  variant={
                    selectedFloorFilter === "ALL" ? "default" : "outline"
                  }
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setSelectedFloorFilter("ALL")}
                >
                  Tous les étages ({rooms.length})
                </Button>
                {[1, 2, 3].map((f) => {
                  const count = rooms.filter(
                    (r) => (r.etage ?? parseInt(r.numero[0], 10)) === f,
                  ).length;
                  return (
                    <Button
                      key={f}
                      variant={
                        selectedFloorFilter === String(f)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => setSelectedFloorFilter(String(f))}
                    >
                      {f === 1 ? "1er étage" : `${f}e étage`} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>

            <Button
              size="sm"
              className="gap-1.5 text-xs self-end sm:self-auto"
              onClick={() => {
                setEditingRoom(null);
                setNumero("");
                setEtage(1);
                setRoomTypeId(roomTypes[0] ? String(roomTypes[0].id) : "");
                setRoomDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Créer une chambre
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden bg-background shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="p-3">Numéro</th>
                  <th className="p-3">Étage</th>
                  <th className="p-3">Type / Catégorie</th>
                  <th className="p-3">Statut Opérationnel</th>
                  <th className="p-3 text-right">Tarif de Base</th>
                  <th className="p-3 text-right">
                    Tarifs Saisonniers Appliqués
                  </th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRooms.map((room) => {
                  const roomFloor =
                    room.etage ??
                    (room.numero ? parseInt(room.numero[0], 10) : 1);
                  const applicableSeasons = seasonRates.filter(
                    (s) => s.roomTypeId === room.roomTypeId,
                  );

                  return (
                    <tr
                      key={room.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3 font-bold text-sm text-foreground">
                        Chambre {room.numero}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-medium"
                        >
                          {roomFloor === 1
                            ? "1er Étage"
                            : `${roomFloor}e Étage`}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground">
                          {room.roomType?.nom || "Non spécifié"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Capacité : {room.roomType?.capacite || 1} pers.
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            room.statut === "LIBRE_PROPRE"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : room.statut === "OCCUPEE"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                          }
                        >
                          {room.statut}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        {Number(room.roomType?.prixBase || 0).toFixed(2)} MAD
                      </td>
                      <td className="p-3 text-right">
                        {applicableSeasons.length > 0 ? (
                          <div className="flex flex-col items-end gap-0.5">
                            {applicableSeasons.map((s) => (
                              <span
                                key={s.id}
                                className="text-[10px] text-muted-foreground"
                              >
                                <span className="font-medium text-foreground">
                                  {s.libelle}
                                </span>{" "}
                                :{" "}
                                <span className="font-mono text-primary font-semibold">
                                  {Number(s.prixNuit).toFixed(2)} MAD
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            Tarif de base seul
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => {
                              setEditingRoom(room);
                              setNumero(room.numero);
                              setEtage(roomFloor);
                              setRoomTypeId(String(room.roomTypeId));
                              setRoomDialogOpen(true);
                            }}
                          >
                            <Edit className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRooms.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground italic"
                    >
                      Aucune chambre trouvée pour ce filtre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsPanel>

        {/* TAB 2: TYPES & TARIFS */}
        <TabsPanel value="types" className="space-y-4">
          <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Catégories de Chambres & Grilles Tarifaires
              </h4>
              <p className="text-xs text-muted-foreground">
                Définissez les tarifs de base et les variations saisonnières
                rattachées à chaque catégorie.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setSeasonLibelle("");
                  setSeasonPrixNuit("");
                  setSeasonRoomTypeId(
                    roomTypes[0] ? String(roomTypes[0].id) : "",
                  );
                  setSeasonDialogOpen(true);
                }}
              >
                <Plus className="size-3.5 text-primary" /> Nouveau Tarif
                Saisonnier
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setEditingType(null);
                  setTypeName("");
                  setTypePrice("");
                  setTypeCapacity("2");
                  setTypeDialogOpen(true);
                }}
              >
                <Plus className="size-3.5" /> Nouvelle Catégorie
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomTypes.map((rt) => {
              const countRooms = rooms.filter(
                (r) => r.roomTypeId === rt.id,
              ).length;
              const typeSeasons = seasonRates.filter(
                (s) => s.roomTypeId === rt.id,
              );

              return (
                <div
                  key={rt.id}
                  className="rounded-lg border bg-background p-4 shadow-2xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start border-b pb-2">
                      <div>
                        <h4 className="font-bold text-base text-foreground">
                          {rt.nom}
                        </h4>
                        <span className="text-[10px] text-muted-foreground">
                          {countRooms} chambre(s) associée(s)
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            setEditingType(rt);
                            setTypeName(rt.nom);
                            setTypePrice(String(rt.prixBase));
                            setTypeCapacity(String(rt.capacite));
                            setTypeDialogOpen(true);
                          }}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => handleDeleteType(rt.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/20 p-2.5 rounded border">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">
                          Tarif de Base
                        </span>
                        <span className="font-mono font-bold text-primary text-sm">
                          {Number(rt.prixBase).toFixed(2)} MAD
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">
                          Capacité Max
                        </span>
                        <span className="font-bold text-foreground">
                          {rt.capacite} personne(s)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                        Tarifs Saisonniers ({typeSeasons.length})
                      </span>
                      {typeSeasons.length > 0 ? (
                        <div className="space-y-1.5">
                          {typeSeasons.map((s) => (
                            <div
                              key={s.id}
                              className="p-2 rounded border bg-card text-xs flex justify-between items-center"
                            >
                              <div>
                                <span className="font-semibold text-foreground block">
                                  {s.libelle}
                                </span>
                                <span className="text-[10px] text-muted-foreground block">
                                  Du{" "}
                                  {new Date(s.dateDebut).toLocaleDateString(
                                    "fr-FR",
                                  )}{" "}
                                  au{" "}
                                  {new Date(s.dateFin).toLocaleDateString(
                                    "fr-FR",
                                  )}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-foreground">
                                {Number(s.prixNuit).toFixed(2)} MAD
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic">
                          Aucun tarif saisonnier configuré pour cette catégorie.
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1"
                    onClick={() => {
                      setSeasonLibelle(`Haute Saison - ${rt.nom}`);
                      setSeasonPrixNuit(String(Number(rt.prixBase) * 1.25));
                      setSeasonRoomTypeId(String(rt.id));
                      setSeasonDialogOpen(true);
                    }}
                  >
                    <Plus className="size-3" /> Ajouter un tarif saisonnier
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsPanel>
      </Tabs>

      {/* DIALOG CREATION / MODIFICATION CHAMBRE */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BedDouble className="size-5 text-primary" />
              {editingRoom
                ? `Modifier la Chambre ${editingRoom.numero}`
                : "Créer une Nouvelle Chambre"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveRoom} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="numero">Numéro Logique de Chambre</Label>
                <Input
                  id="numero"
                  required
                  placeholder="Ex. 101, 201, 305"
                  value={numero}
                  onChange={(e) => handleNumeroChange(e.target.value)}
                />
                <span className="text-[10px] text-muted-foreground">
                  Unique dans l'établissement.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="etage">Étage de l'Hôtel</Label>
                <Select
                  value={String(etage)}
                  onValueChange={(v) => v && setEtage(Number(v))}
                >
                  <SelectTrigger id="etage" className="w-full">
                    <SelectValue placeholder="Choisir l'étage">
                      {etage
                        ? `${etage}${etage === 1 ? "er" : "e"} Étage`
                        : "Choisir l'étage"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1er Étage</SelectItem>
                    <SelectItem value="2">2e Étage</SelectItem>
                    <SelectItem value="3">3e Étage</SelectItem>
                    <SelectItem value="4">4e Étage</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground">
                  Déduit automatiquement ou modifiable.
                </span>
              </div>
            </div>

            <div className="space-y-1.5 border-t pt-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="roomType">Catégorie / Type de Chambre</Label>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={() => {
                    setEditingType(null);
                    setTypeName("");
                    setTypePrice("");
                    setTypeCapacity("2");
                    setTypeDialogOpen(true);
                  }}
                >
                  ＋ Nouveau type
                </Button>
              </div>
              <Select
                value={roomTypeId}
                onValueChange={(v) => v && setRoomTypeId(v)}
                required
              >
                <SelectTrigger id="roomType" className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie">
                    {roomTypes.find((t) => String(t.id) === roomTypeId)?.nom ??
                      "Sélectionner une catégorie"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.nom} — Tarif de base :{" "}
                      {Number(type.prixBase).toFixed(2)} MAD ({type.capacite}{" "}
                      pax)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* LISTE ET SELECTION DE TARIFS EXISTANTS RATTACHÉS */}
            {selectedTypeObj && (
              <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="size-3.5 text-primary" />
                    Tarifs & Grilles applicables pour {selectedTypeObj.nom}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-primary px-1.5 gap-1"
                    onClick={() => {
                      setSeasonLibelle(`Haute Saison - ${selectedTypeObj.nom}`);
                      setSeasonPrixNuit(
                        String(Number(selectedTypeObj.prixBase) * 1.2),
                      );
                      setSeasonRoomTypeId(String(selectedTypeObj.id));
                      setSeasonDialogOpen(true);
                    }}
                  >
                    <Plus className="size-3" /> Ajouter un tarif
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {/* Tarif de base */}
                  <div className="flex items-center justify-between p-2 rounded bg-background border">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked
                        readOnly
                        className="rounded h-4 w-4 accent-primary"
                      />
                      <div>
                        <span className="font-semibold text-foreground block">
                          Tarif Standard de Base
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Appliqué par défaut toute l'année
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-primary">
                      {Number(selectedTypeObj.prixBase).toFixed(2)} MAD
                    </span>
                  </div>

                  {/* Tarifs saisonniers */}
                  {selectedTypeSeasons.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded bg-background border"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked
                          readOnly
                          className="rounded h-4 w-4 accent-primary"
                        />
                        <div>
                          <span className="font-semibold text-foreground block">
                            {s.libelle}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            Période :{" "}
                            {new Date(s.dateDebut).toLocaleDateString("fr-FR")}{" "}
                            au {new Date(s.dateFin).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-700">
                        {Number(s.prixNuit).toFixed(2)} MAD
                      </span>
                    </div>
                  ))}

                  {selectedTypeSeasons.length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic px-1">
                      Cette catégorie utilise actuellement uniquement son tarif
                      de base.
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoomDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingRoom
                  ? "Enregistrer les modifications"
                  : "Créer la chambre"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG CREATION TARIF SAISONNIER INLINE */}
      <Dialog open={seasonDialogOpen} onOpenChange={setSeasonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarRange className="size-5 text-primary" />
              Créer un Nouveau Tarif Saisonnier
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveSeasonRate}
            className="space-y-3 py-2 text-xs"
          >
            <div className="space-y-1.5">
              <Label htmlFor="seasonRoomType">Catégorie Cible</Label>
              <Select
                value={seasonRoomTypeId}
                onValueChange={(v) => v && setSeasonRoomTypeId(v)}
                required
              >
                <SelectTrigger id="seasonRoomType">
                  <SelectValue placeholder="Choisir la catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nom} (Base : {Number(t.prixBase).toFixed(2)} MAD)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seasonLibelle">Libellé du Tarif / Saison</Label>
              <Input
                id="seasonLibelle"
                required
                placeholder="Ex. Haute Saison Été 2026, Férié / Événement"
                value={seasonLibelle}
                onChange={(e) => setSeasonLibelle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateDebut">Date de Début</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  required
                  value={seasonDateDebut}
                  onChange={(e) => setSeasonDateDebut(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dateFin">Date de Fin</Label>
                <Input
                  id="dateFin"
                  type="date"
                  required
                  value={seasonDateFin}
                  onChange={(e) => setSeasonDateFin(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seasonPrixNuit">Prix de la nuitée (MAD)</Label>
              <Input
                id="seasonPrixNuit"
                type="number"
                step="0.01"
                required
                placeholder="Ex. 750"
                value={seasonPrixNuit}
                onChange={(e) => setSeasonPrixNuit(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSeasonDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Créer le tarif saisonnier</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG CREATION / MODIFICATION CATEGORIE */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingType
                ? "Modifier la catégorie / tarif"
                : "Nouvelle Catégorie de Chambre"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveType} className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="typeName">Nom de la Catégorie</Label>
              <Input
                id="typeName"
                required
                placeholder="Ex. Single, Double, Suite Deluxe"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="typePrice">Tarif de Base (MAD)</Label>
                <Input
                  id="typePrice"
                  required
                  type="number"
                  step="0.01"
                  placeholder="Ex. 500"
                  value={typePrice}
                  onChange={(e) => setTypePrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="typeCapacity">Capacité (personnes)</Label>
                <Input
                  id="typeCapacity"
                  required
                  type="number"
                  min="1"
                  value={typeCapacity}
                  onChange={(e) => setTypeCapacity(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 p-2.5 rounded border border-blue-200 text-[11px] flex gap-2 items-start mt-1">
              <Info className="size-4 shrink-0 text-blue-600 mt-0.5" />
              <p>
                Ce tarif de base sera appliqué automatiquement aux réservations
                en dehors des périodes de haute saison.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTypeDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Enregistrer la catégorie</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
