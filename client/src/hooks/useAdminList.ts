import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import { fetchGame, type GameDetail } from "../api/admin";

interface UseAdminListOptions<T> {
  /** Fetch the list items for a given gameId */
  fetchItems: (gameId: string) => Promise<T[]>;
  /** Additional parallel fetches to run alongside game + items (e.g., fetchCardSets, fetchHouses) */
  extraFetches?: Record<string, (gameId: string) => Promise<any>>;
  /** Auto-refresh interval in ms (0 = disabled) */
  pollInterval?: number;
}

interface UseAdminListResult<T> {
  gameId: string | undefined;
  game: GameDetail | null;
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  extras: Record<string, any>;
  loading: boolean;
  loadData: () => Promise<void>;
  handleUpdated: (updated: T) => void;
  handleDeleted: (id: string) => void;
}

export function useAdminList<T extends { id: string }>(
  options: UseAdminListOptions<T>,
): UseAdminListResult<T> {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [extras, setExtras] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);

    const extraKeys = Object.keys(options.extraFetches ?? {});
    const extraFns = Object.values(options.extraFetches ?? {});

    const [g, itemList, ...extraResults] = await Promise.all([
      fetchGame(gameId),
      options.fetchItems(gameId),
      ...extraFns.map((fn) => fn(gameId)),
    ]);

    setGame(g);
    setItems(itemList);

    const newExtras: Record<string, any> = {};
    extraKeys.forEach((key, i) => {
      newExtras[key] = extraResults[i];
    });
    setExtras(newExtras);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Optional polling
  useEffect(() => {
    if (!gameId || !options.pollInterval) return;
    const id = setInterval(async () => {
      const updated = await options.fetchItems(gameId);
      setItems(updated);
    }, options.pollInterval);
    return () => clearInterval(id);
  }, [gameId, options.pollInterval]);

  const handleUpdated = useCallback((updated: T) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    gameId,
    game,
    items,
    setItems,
    extras,
    loading,
    loadData,
    handleUpdated,
    handleDeleted,
  };
}
