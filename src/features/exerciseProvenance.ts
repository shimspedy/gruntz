/** The movement actually performed, separate from a shared demonstration/history key. */
export interface LoggedMovement {
  exerciseId: string;
  /** Present when a plan prescribed a different movement from its demonstration. */
  prescribedName?: string;
}

export function isLoggedMovement(value: unknown): value is LoggedMovement {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const movement = value as Record<string, unknown>;
  return typeof movement.exerciseId === 'string' && movement.exerciseId.trim().length > 0 && movement.exerciseId.length <= 200
    && (movement.prescribedName === undefined || (typeof movement.prescribedName === 'string' && movement.prescribedName.trim().length > 0 && movement.prescribedName.length <= 300));
}

/** Legacy/imported logs remain useful history; unknown equivalence cannot support a gain claim. */
export function isSameCanonicalMovement(value: unknown, exerciseId: string): boolean {
  return isLoggedMovement(value) && value.exerciseId === exerciseId && value.prescribedName === undefined;
}
