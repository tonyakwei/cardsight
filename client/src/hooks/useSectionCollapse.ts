import { useState, useCallback } from "react";

const STORAGE_KEY = "cardsight_collapsed_sections";

function getCollapsedSections(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCollapsedSections(sections: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...sections]));
  } catch {}
}

/**
 * Returns whether a section is open (default: true) and a toggle function.
 * Collapse state is persisted in sessionStorage.
 */
export function useSectionOpen(sectionKey: string): [boolean, () => void] {
  const [open, setOpen] = useState(() => !getCollapsedSections().has(sectionKey));

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      const sections = getCollapsedSections();
      if (next) {
        sections.delete(sectionKey);
      } else {
        sections.add(sectionKey);
      }
      saveCollapsedSections(sections);
      return next;
    });
  }, [sectionKey]);

  return [open, toggle];
}
