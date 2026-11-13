import { workoutAnnouncement } from '../features/teamPost';
import { useReadinessStore } from '../store/useReadinessStore';
import { sendMessage } from './teamChat';
import { fetchMyTeams } from './teams';

/**
 * Posts a finished workout to the athlete's private teams as an ordinary chat line.
 *
 * Only when they switched it on, and never to public communities: a stranger's feed is
 * not where a training log belongs. Failures are silent; the workout is already saved.
 */
export async function announceWorkout(input: Parameters<typeof workoutAnnouncement>[0]): Promise<number> {
  if (!useReadinessStore.getState().shareWorkoutsWithTeams) return 0;
  const body = workoutAnnouncement(input);
  if (!body) return 0;
  const teams = await fetchMyTeams();
  if (!teams.ok) return 0;
  let posted = 0;
  for (const team of teams.value) {
    if (team.isPublic) continue;
    // Re-read each time: switching it off mid-loop stops the rest.
    if (!useReadinessStore.getState().shareWorkoutsWithTeams) break;
    if ((await sendMessage(team.id, body)).ok) posted += 1;
  }
  return posted;
}
