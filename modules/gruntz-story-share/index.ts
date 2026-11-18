import { requireOptionalNativeModule } from 'expo';

type NativeStoryShare = {
  isAvailable(): boolean;
  shareBackground(fileUri: string, appId: string, topColor: string, bottomColor: string): Promise<boolean>;
};

// iOS only; absent on Android, web and Expo Go, where sharing falls back to the system sheet.
const native = requireOptionalNativeModule<NativeStoryShare>('GruntzStoryShare');

/** Meta app the story is credited to (the same one install measurement uses). */
const META_APP_ID = '1742670326812925';

/** Whether Instagram is installed and can open its story composer. */
export function canShareToInstagramStory(): boolean {
  try { return native?.isAvailable() ?? false; } catch { return false; }
}

/** Opens Instagram's story composer with this PNG as the background. False when it couldn't. */
export async function shareToInstagramStory(fileUri: string, topColor = '#000000', bottomColor = '#1C1C1E'): Promise<boolean> {
  if (!native) return false;
  try { return await native.shareBackground(fileUri, META_APP_ID, topColor, bottomColor); } catch { return false; }
}
