"use client";

import { useEffect, useState } from "react";

/**
 * Restituisce un Date che si aggiorna periodicamente.
 * Usato per countdown live (deadline urgent, ora).
 *
 * @param intervalMs frequenza di aggiornamento (default 60s)
 * @returns Date corrente (state, causa re-render)
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
