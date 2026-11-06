import { useEffect, useRef } from "react";
import { CheckCircle2, FileText, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlaylistGroup, PlaylistItem } from "@/lib/viewerPlaylist";

interface ViewerPlaylistProps {
  groups: PlaylistGroup[];
  currentKey: string | null;
  isCompleted: (item: PlaylistItem) => boolean;
  onSelect: (item: PlaylistItem) => void;
  className?: string;
}

/** Lista lateral de los visores: material anterior y siguiente del curso, con el actual resaltado. */
export default function ViewerPlaylist({
  groups,
  currentKey,
  isCompleted,
  onSelect,
  className,
}: ViewerPlaylistProps) {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const allItems = groups.flatMap((group) => group.items);
  const completedCount = allItems.filter(isCompleted).length;

  // Mantener visible el material actual al abrir o al cambiar de material
  useEffect(() => {
    if (!currentKey) return;
    itemRefs.current[currentKey]?.scrollIntoView({ block: "center" });
  }, [currentKey]);

  return (
    <aside
      className={cn(
        "flex w-72 xl:w-80 shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      aria-label="Material del curso"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Material
        </span>
        <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {completedCount} de {allItems.length} vistos
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
        {groups.map((group) => (
          <section key={group.moduloId} className="py-1">
            <p
              className="truncate px-4 pb-1.5 pt-3 text-[13px] font-semibold text-slate-700 dark:text-slate-300 md:pb-1 md:pt-2 md:text-xs"
              title={group.titulo}
            >
              {group.titulo}
            </p>
            <ul>
              {group.items.map((item) => {
                const current = item.key === currentKey;
                const done = isCompleted(item);
                const Icon = !item.enabled
                  ? Lock
                  : done
                    ? CheckCircle2
                    : item.type === "video"
                      ? Play
                      : FileText;
                return (
                  <li key={item.key}>
                    <button
                      ref={(el) => {
                        itemRefs.current[item.key] = el;
                      }}
                      type="button"
                      disabled={!item.enabled}
                      onClick={() => !current && onSelect(item)}
                      aria-current={current ? "true" : undefined}
                      className={cn(
                        // Mobile: filas más altas y letra más grande para tocar cómodo; desktop compacto
                        "flex min-h-[52px] w-full items-center gap-3 border-l-[3px] px-4 py-3 text-left text-[15px] transition-colors md:min-h-0 md:items-start md:gap-2.5 md:border-l-2 md:py-2 md:text-sm",
                        current
                          ? "border-orange-500 bg-orange-50 font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                          : "border-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70",
                        !item.enabled && "cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0 md:mt-0.5 md:h-4 md:w-4",
                          done && item.enabled
                            ? "text-green-600 dark:text-green-400"
                            : current
                              ? "text-orange-500"
                              : "text-slate-400"
                        )}
                      />
                      <span className="line-clamp-2 min-w-0 leading-snug">{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
