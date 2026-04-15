import physicalCards from "../../../shared/physical-cards.json";

const pcMap = new Map(physicalCards.map((pc) => [pc.id, pc]));

export function pcGet(id: string) {
  return pcMap.get(id);
}

export function pcName(id: string): string {
  return pcMap.get(id)?.name ?? id.slice(0, 8);
}

export function pcColor(id: string): string {
  return pcMap.get(id)?.color ?? "gray";
}

export function pcShort(id: string): string {
  const pc = pcMap.get(id);
  return pc ? `${pc.color[0].toUpperCase()}${pc.number}` : id.slice(0, 4);
}

export function pcLabel(id: string): string {
  const pc = pcMap.get(id);
  return pc ? `${pc.color[0].toUpperCase()}${pc.number}` : id.slice(0, 8);
}

/** Grouped select options for physical card pickers */
export const physicalCardOptions = (() => {
  const groups = new Map<string, { value: string; label: string }[]>();
  for (const pc of physicalCards) {
    const group = pc.color.charAt(0).toUpperCase() + pc.color.slice(1);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({
      value: pc.id,
      label: `${group} ${pc.number} — ${pc.name}`,
    });
  }
  return [...groups.entries()].map(([group, items]) => ({ group, items }));
})();
