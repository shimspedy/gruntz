/** ViewShot's iOS renderer accepts points; Android's capture size is in pixels. */
export function activityCaptureSize(layoutWidth: number, layoutHeight: number, platform: string, pixelRatio: number) {
  if (!Number.isFinite(layoutWidth) || !Number.isFinite(layoutHeight) || layoutWidth <= 0 || layoutHeight <= 0) throw new Error('The card is still loading. Please try again.');
  const density = platform === 'ios' && Number.isFinite(pixelRatio) ? Math.max(1, pixelRatio) : 1;
  const width = 1080 / density;
  return { width, height: Math.round(width * layoutHeight / layoutWidth) };
}
