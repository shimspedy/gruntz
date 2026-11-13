import { useEffect, useState } from 'react';
import { knownPlanFollowers, planFollowerCounts } from '../services/planFollows';

/** How many athletes follow each plan (three or more only). Empty until known. */
export function usePlanFollowers(): Record<string, number> {
  const [counts, setCounts] = useState(knownPlanFollowers);
  useEffect(() => {
    let live = true;
    void planFollowerCounts().then((next) => { if (live) setCounts(next); });
    return () => { live = false; };
  }, []);
  return counts;
}
