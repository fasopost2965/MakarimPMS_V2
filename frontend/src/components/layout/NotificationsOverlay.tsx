import { useEffect, useState, useRef } from "react";
import { Bell, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listStaysEnCours } from "@/features/checkin/api";
import { listRooms } from "@/features/reservations/api";
import type { Stay } from "@/features/checkin/types";
import type { Room } from "@/features/reservations/types";
import type { Tab } from "@/App";

export function NotificationsOverlay({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const [stays, setStays] = useState<Stay[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [resStays, resRooms] = await Promise.all([
          listStaysEnCours(),
          listRooms(),
        ]);
        setStays(resStays);
        setRooms(resRooms);
      } catch (err) {
        // fail silently on background poll
      }
    }
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const missingPoliceForms = stays.filter(
    (s) => s.statut === "EN_COURS" && !s.policeRecord,
  );
  const urgentHousekeeping = rooms.filter(
    (r) => r.statut === "A_NETTOYER" || r.statut === "EN_NETTOYAGE",
  );

  const totalNotifications =
    missingPoliceForms.length + urgentHousekeeping.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="size-5" />
        {totalNotifications > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2.5 bg-red-500"></span>
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground rounded-md border shadow-md z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <span className="text-xs font-mono bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {totalNotifications}
            </span>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2 bg-background">
            {totalNotifications === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Aucune action en attente
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {missingPoliceForms.map((stay) => (
                  <button
                    key={`police-${stay.id}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate("police");
                    }}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 text-left transition-colors w-full"
                  >
                    <div className="p-1.5 bg-red-100 text-red-600 rounded-md shrink-0 mt-0.5">
                      <ShieldAlert className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">
                        Fiche Police Manquante
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Chambre {stay.room?.numero} - {stay.guest?.nom}{" "}
                        {stay.guest?.prenom}
                      </p>
                    </div>
                  </button>
                ))}

                {urgentHousekeeping.map((room) => (
                  <button
                    key={`room-${room.id}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate("housekeeping");
                    }}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 text-left transition-colors w-full"
                  >
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md shrink-0 mt-0.5">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">Ménage Requis</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Chambre {room.numero} - {room.roomType?.nom}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
