/**
 * Which measurement system to start someone on.
 *
 * Profile creation hard-coded 'imperial', so every athlete outside the handful of
 * countries that use it had to find Settings and change it before a single number
 * on screen made sense. The device locale already knows.
 */
const IMPERIAL_REGIONS = ['US', 'LR', 'MM'];

export function defaultUnits(): 'imperial' | 'metric' {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    // "en-US" -> US; "en-US-u-ca-gregory" -> US; bare "en" -> unknown.
    const region = locale.split('-').find((part) => /^[A-Z]{2}$/.test(part));
    return region && IMPERIAL_REGIONS.includes(region) ? 'imperial' : 'metric';
  } catch {
    // Intl missing or locale unreadable: keep the previous behaviour rather than
    // silently flipping existing expectations.
    return 'imperial';
  }
}
