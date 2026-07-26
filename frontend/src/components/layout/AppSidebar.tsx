import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_CATEGORIES, NAV_ITEMS, type NavCategoryKey } from "./nav-items";
import type { Tab } from "@/App";

interface Props {
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  permissions: string[] | null;
}

export function AppSidebar({
  activeTab,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onMobileClose,
  permissions,
}: Props) {
  const visibleItems =
    permissions === null
      ? []
      : NAV_ITEMS.filter((item) => permissions.includes(item.permission));

  const showLabels = !collapsed || mobileOpen;

  // Catégories masquées/repliées (Set des keys de catégories fermées par l'utilisateur)
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<NavCategoryKey>
  >(new Set());

  // Catégorie de l'onglet courant (toujours gardée dépliée à l'affichage)
  const activeCategory = NAV_ITEMS.find((i) => i.tab === activeTab)?.category;

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onMobileClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  function toggleCategory(catKey: NavCategoryKey) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catKey)) {
        next.delete(catKey);
      } else {
        next.add(catKey);
      }
      return next;
    });
  }

  function handleNavigate(tab: Tab) {
    onNavigate(tab);
    onMobileClose();
  }

  return (
    <>
      {mobileOpen && (
        <div
          data-slot="sidebar-backdrop"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex h-full w-60 flex-col border-r border-sidebar-border transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:static md:z-auto md:translate-x-0 md:transition-[width] md:duration-150",
          collapsed ? "md:w-16" : "md:w-60",
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4",
            !showLabels && "justify-center px-0",
          )}
        >
          <img src="/logo-makarim.jpg" alt="Logo Makarim" className="size-8 object-contain rounded-sm" />
          {showLabels && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                Makarim
              </span>
              <span className="text-sidebar-foreground/60 block truncate text-[10px] tracking-wide">
                PMS Hôtel · Tétouan
              </span>
            </span>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          {NAV_CATEGORIES.map((category) => {
            const categoryItems = visibleItems.filter(
              (item) => item.category === category.key,
            );
            if (categoryItems.length === 0) return null;

            const isCollapsed =
              collapsedCategories.has(category.key) &&
              category.key !== activeCategory;
            const hasActiveItem = categoryItems.some(
              (item) => item.tab === activeTab,
            );

            return (
              <div key={category.key} className="flex flex-col gap-0.5">
                {showLabels ? (
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.key)}
                    className={cn(
                      "flex items-center justify-between w-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors rounded-sm",
                      hasActiveItem && "text-sidebar-primary font-extrabold",
                    )}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span>{category.label}</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-sidebar-foreground/10 text-sidebar-foreground/70 font-normal">
                        {categoryItems.length}
                      </span>
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="size-3 shrink-0 opacity-70" />
                    ) : (
                      <ChevronDown className="size-3 shrink-0 opacity-70" />
                    )}
                  </button>
                ) : (
                  <div className="mx-2 my-1 border-t border-sidebar-border/50" />
                )}

                {(!isCollapsed || !showLabels) && (
                  <div className="flex flex-col gap-0.5 pl-0.5">
                    {categoryItems.map(({ tab, label, icon: Icon }) => {
                      const active = tab === activeTab;
                      return (
                        <button
                          key={tab}
                          id={`nav-${tab}`}
                          type="button"
                          title={showLabels ? undefined : label}
                          aria-current={active ? "page" : undefined}
                          onClick={() => handleNavigate(tab)}
                          className={cn(
                            "flex min-h-9 items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-all",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-[inset_3px_0_0_var(--sidebar-primary)]"
                              : "text-sidebar-foreground/80",
                            !showLabels && "justify-center px-0",
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          {showLabels && (
                            <span className="truncate">{label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="hidden border-t border-sidebar-border p-2 md:block">
          <button
            id="nav-toggle-collapse"
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? "Déplier le menu" : "Replier le menu"}
            className={cn(
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <ChevronsRight className="size-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="size-4 shrink-0" />
                <span>Replier</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
