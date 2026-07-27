import { useEffect, useState } from "react";
import {
  Plus,
  Building2,
  Trash2,
  Edit,
  BedDouble,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function RoomsSection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [numero, setNumero] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [typeName, setTypeName] = useState("");
  const [typePrice, setTypePrice] = useState("");
  const [typeCapacity, setTypeCapacity] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [resRooms, resRoomTypes] = await Promise.all([
        listRooms(),
        apiRequest<RoomType[]>("/parameters/room-types"),
      ]);
      setRooms(resRooms);
      setRoomTypes(resRoomTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero || !roomTypeId) return;
    try {
      if (editingRoom) {
        await apiRequest(`/parameters/rooms/${editingRoom.id}`, {
          method: "PATCH",
          body: JSON.stringify({ numero, roomTypeId: Number(roomTypeId) }),
        });
      } else {
        await apiRequest("/parameters/rooms", {
          method: "POST",
          body: JSON.stringify({ numero, roomTypeId: Number(roomTypeId) }),
        });
      }
      setRoomDialogOpen(false);
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
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
    if (!confirm("Attention: vérifier que ce type n'est pas utilisé.")) return;
    try {
      await apiRequest(`/parameters/room-types/${id}`, { method: "DELETE" });
      void loadData();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Erreur de suppression du type",
      );
    }
  };

  if (loading)
    return <p className="text-muted-foreground text-sm">Chargement...</p>;
  if (error) return <p className="text-destructive text-sm">{error}</p>;

  return (
    <div className="rounded-lg border bg-card p-6 shadow-xs flex flex-col gap-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Gestion des Chambres & Tarifs
          </h3>
          <p className="text-muted-foreground text-xs mt-1">
            Gérez vos chambres, statuts et les tarifs de base associés (prix).
          </p>
        </div>
      </div>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList>
          <TabsTrigger value="rooms" className="gap-2">
            <BedDouble className="size-4" /> Chambres
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-2">
            <Building2 className="size-4" /> Types & Tarifs
          </TabsTrigger>
        </TabsList>

        <TabsPanel value="rooms" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Liste des chambres de l'hôtel.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setEditingRoom(null);
                setNumero("");
                setRoomTypeId("");
                setRoomDialogOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Nouvelle Chambre
            </Button>
          </div>
          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Numéro</th>
                  <th className="p-3 text-left font-medium">Type</th>
                  <th className="p-3 text-left font-medium">Statut Actuel</th>
                  <th className="p-3 text-right font-medium">
                    Tarif par défaut
                  </th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="group hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 font-medium">{room.numero}</td>
                    <td className="p-3">{room.roomType?.nom}</td>
                    <td className="p-3">{room.statut}</td>
                    <td className="p-3 text-right font-mono">
                      {Number(room.roomType?.prixBase || 0).toFixed(2)} MAD
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mr-2"
                        onClick={() => {
                          setEditingRoom(room);
                          setNumero(room.numero);
                          setRoomTypeId(String(room.roomTypeId));
                          setRoomDialogOpen(true);
                        }}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Aucune chambre
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsPanel>

        <TabsPanel value="types" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Configurez les types de chambre et leurs tarifs (prix de base).
            </p>
            <Button
              size="sm"
              onClick={() => {
                setEditingType(null);
                setTypeName("");
                setTypePrice("");
                setTypeCapacity("1");
                setTypeDialogOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Nouveau Type
            </Button>
          </div>
          <div className="border rounded-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {roomTypes.map((rt) => (
              <div key={rt.id} className="border p-4 rounded-md shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold">{rt.nom}</h4>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditingType(rt);
                        setTypeName(rt.nom);
                        setTypePrice(String(rt.prixBase));
                        setTypeCapacity(String(rt.capacite));
                        setTypeDialogOpen(true);
                      }}
                    >
                      <Edit className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleDeleteType(rt.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex flex-col gap-1">
                  <p>
                    Tarif Base :{" "}
                    <span className="font-mono text-foreground">
                      {Number(rt.prixBase).toFixed(2)} MAD
                    </span>
                  </p>
                  <p>Capacité : {rt.capacite} pax</p>
                </div>
              </div>
            ))}
          </div>
        </TabsPanel>
      </Tabs>

      {/* Dialog Chambre */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Modifier la chambre" : "Ajouter une chambre"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveRoom} className="space-y-4 py-4 text-sm">
            <div className="space-y-2">
              <Label>Numéro de chambre</Label>
              <Input
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type de chambre (et tarif associé)</Label>
              <Select
                value={roomTypeId}
                onValueChange={(v) => v && setRoomTypeId(v)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.nom} ({Number(type.prixBase).toFixed(2)} MAD)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoomDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Type */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType
                ? "Modifier le type / tarif"
                : "Nouveau type de chambre"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveType} className="space-y-4 py-4 text-sm">
            <div className="space-y-2">
              <Label>Nom (ex: Standard, Suite Royale)</Label>
              <Input
                required
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarif de Base (MAD)</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={typePrice}
                  onChange={(e) => setTypePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacité (personnes)</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={typeCapacity}
                  onChange={(e) => setTypeCapacity(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-xs flex gap-2 items-start mt-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <p>
                Le tarif défini ici sera appliqué par défaut aux réservations.
                Vous pouvez aussi configurer des variations dans les Tarifs
                Saisonniers.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTypeDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
