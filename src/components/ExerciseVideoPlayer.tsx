import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { VideoSource } from 'expo-video';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { hapticMedium } from '../utils/haptics';

interface ExerciseVideoPlayerProps {
  exerciseName: string;
  videoAsset?: number;
  videoUrl?: string;
  demoUrl?: string;
  variant?: 'standard' | 'compact';
  allowExternalOpen?: boolean;
  style?: StyleProp<ViewStyle>;
}

const DEMO_LOOP_SECONDS = 6;

type PlayerMode =
  | { type: 'native'; source: VideoSource; externalUrl?: string }
  | { type: 'youtube'; videoId: string; externalUrl: string }
  | { type: 'external'; externalUrl: string };

function getYouTubeVideoId(value?: string): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

    if (host === 'youtu.be') {
      return cleanYouTubeId(url.pathname.split('/').filter(Boolean)[0]);
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const watchId = cleanYouTubeId(url.searchParams.get('v'));
      if (watchId) return watchId;

      const segments = url.pathname.split('/').filter(Boolean);
      const idIndex = segments.findIndex((segment) => ['embed', 'shorts', 'live'].includes(segment)) + 1;
      return cleanYouTubeId(idIndex > 0 ? segments[idIndex] : null);
    }
  } catch {
    return null;
  }

  return null;
}

function cleanYouTubeId(value?: string | null): string | null {
  if (!value) return null;
  return /^[a-zA-Z0-9_-]{6,}$/.test(value) ? value : null;
}

function isDirectVideoUrl(value?: string): value is string {
  return !!value && /\.(mp4|m4v|mov|m3u8)(\?|#|$)/i.test(value);
}

function getPlayerMode(videoAsset?: number, videoUrl?: string, demoUrl?: string): PlayerMode | null {
  if (typeof videoAsset === 'number') {
    return { type: 'native', source: videoAsset };
  }

  if (isDirectVideoUrl(videoUrl)) {
    return { type: 'native', source: { uri: videoUrl }, externalUrl: demoUrl ?? videoUrl };
  }

  const videoYouTubeId = getYouTubeVideoId(videoUrl);
  if (videoYouTubeId && videoUrl) {
    return { type: 'youtube', videoId: videoYouTubeId, externalUrl: videoUrl };
  }

  if (isDirectVideoUrl(demoUrl)) {
    return { type: 'native', source: { uri: demoUrl }, externalUrl: demoUrl };
  }

  const youtubeId = getYouTubeVideoId(demoUrl);
  if (youtubeId && demoUrl) {
    return { type: 'youtube', videoId: youtubeId, externalUrl: demoUrl };
  }

  return videoUrl || demoUrl ? { type: 'external', externalUrl: videoUrl ?? demoUrl ?? '' } : null;
}

function getYouTubeHtml(videoId: string, colors: ThemeColors) {
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: ${colors.background};
      }
      #player, iframe {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        border: 0;
        background: ${colors.background};
        pointer-events: none;
      }
    </style>
  </head>
  <body>
    <div id="player"></div>
    <script src="https://www.youtube.com/iframe_api"></script>
    <script>
      var player;
      var YT_ENDED = 0;
      var YT_PLAYING = 1;
      var YT_PAUSED = 2;
      var YT_BUFFERING = 3;
      var YT_CUED = 5;
      var LOOP_SECONDS = ${DEMO_LOOP_SECONDS};
      var segmentStart = 0;
      var segmentEnd = LOOP_SECONDS;
      var segmentConfigured = false;
      var segmentDurationSource = 0;
      var configureAttempts = 0;

      function getSafeDuration() {
        if (!player || !player.getDuration) return 0;
        try {
          return player.getDuration() || 0;
        } catch (error) {
          return 0;
        }
      }

      function configureSegment() {
        var duration = getSafeDuration();
        if (!duration || duration <= 0) return false;

        var loopLength = Math.min(LOOP_SECONDS, Math.max(1, duration - 1));
        if (duration > LOOP_SECONDS + 2) {
          segmentStart = Math.max(0, (duration / 2) - (loopLength / 2));
          segmentEnd = Math.min(duration - 0.25, segmentStart + loopLength);
        } else {
          segmentStart = 0;
          segmentEnd = loopLength;
        }

        segmentConfigured = true;
        segmentDurationSource = duration;
        return true;
      }

      function forcePlaySegment() {
        if (!player || !player.seekTo || !player.playVideo) return;
        if (!segmentConfigured && !configureSegment()) return;

        try {
          player.mute();
          player.seekTo(segmentStart, true);
          player.playVideo();
        } catch (error) {}
      }

      function configureAndStartSegment() {
        if (configureSegment()) {
          forcePlaySegment();
          return;
        }

        configureAttempts += 1;
        if (configureAttempts < 24) {
          setTimeout(configureAndStartSegment, 250);
        } else {
          segmentConfigured = true;
          segmentDurationSource = 0;
          forcePlaySegment();
        }
      }

      function keepPlaying() {
        if (!player || !player.getPlayerState || !player.playVideo) return;
        try {
          var state = player.getPlayerState();
          if (state === YT_ENDED) {
            forcePlaySegment();
            return;
          }
          if (state === YT_PAUSED || state === YT_CUED) {
            player.mute();
            player.playVideo();
          }

          if (!segmentConfigured) {
            configureSegment();
          }

          if (segmentDurationSource === 0 && getSafeDuration() > LOOP_SECONDS + 2) {
            configureSegment();
            forcePlaySegment();
            return;
          }

          if (segmentConfigured && player.getCurrentTime) {
            var currentTime = player.getCurrentTime();
            if (currentTime >= segmentEnd || currentTime < segmentStart - 1) {
              forcePlaySegment();
            }
          }
        } catch (error) {}
      }

      window.onYouTubeIframeAPIReady = function () {
        player = new YT.Player('player', {
          videoId: '${videoId}',
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            loop: 1,
            modestbranding: 1,
            playsinline: 1,
            playlist: '${videoId}',
            rel: 0
          },
          events: {
            onReady: function (event) {
              try {
                event.target.mute();
                event.target.playVideo();
              } catch (error) {}
              configureAndStartSegment();
              setInterval(keepPlaying, 250);
            },
            onStateChange: function (event) {
              if (event.data === YT_ENDED) {
                forcePlaySegment();
              }
            }
          }
        });
      };
    </script>
  </body>
</html>`;
}

function openExternal(url: string) {
  hapticMedium();
  Linking.openURL(url).catch(() => {});
}

function getMiddleLoopSegment(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  const loopLength = Math.min(DEMO_LOOP_SECONDS, Math.max(1, duration - 1));
  const start = duration > DEMO_LOOP_SECONDS + 2
    ? Math.max(0, duration / 2 - loopLength / 2)
    : 0;
  const end = Math.min(duration - 0.25, start + loopLength);

  return { start, end };
}

function NativeVideoSurface({ source }: { source: VideoSource }) {
  const hasStartedSegment = useRef(false);
  const player = useVideoPlayer(source, (setupPlayer) => {
    setupPlayer.loop = false;
    setupPlayer.muted = true;
    setupPlayer.audioMixingMode = 'auto';
    setupPlayer.showNowPlayingNotification = false;
    setupPlayer.timeUpdateEventInterval = 0.25;
    setupPlayer.play();
  });
  const status = useEvent(player, 'statusChange', { status: player.status });

  const playing = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const timeUpdate = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });

  useEffect(() => {
    if (status.status !== 'readyToPlay') {
      return;
    }

    const segment = getMiddleLoopSegment(player.duration);
    if (!hasStartedSegment.current && segment) {
      player.currentTime = segment.start;
      hasStartedSegment.current = true;
    }

    if (!playing.isPlaying) {
      player.muted = true;
      player.play();
    }
  }, [player, playing.isPlaying, status.status]);

  useEffect(() => {
    if (status.status !== 'readyToPlay' || !hasStartedSegment.current) {
      const initialSegment = getMiddleLoopSegment(player.duration);
      if (status.status === 'readyToPlay' && initialSegment) {
        player.currentTime = initialSegment.start;
        player.muted = true;
        player.play();
        hasStartedSegment.current = true;
      }
      return;
    }

    const segment = getMiddleLoopSegment(player.duration);
    if (!segment) return;

    if (timeUpdate.currentTime >= segment.end || timeUpdate.currentTime < segment.start - 1) {
      player.currentTime = segment.start;
      player.muted = true;
      player.play();
    }
  }, [player, status.status, timeUpdate.currentTime]);

  return (
    <>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        playsInline
      />
      {status.status === 'loading' && (
        <View pointerEvents="none" style={stylesShared.centerOverlay}>
          <ActivityIndicator color="#AAFF00" />
        </View>
      )}
      {status.status === 'error' && (
        <View pointerEvents="none" style={stylesShared.centerOverlay}>
          <Ionicons name="alert-circle-outline" size={22} color="#FF3B5C" />
        </View>
      )}
    </>
  );
}

function YouTubeEmbedSurface({ videoId, colors }: { videoId: string; colors: ThemeColors }) {
  const [loading, setLoading] = useState(true);
  const html = useMemo(() => getYouTubeHtml(videoId, colors), [videoId, colors]);

  return (
    <>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <WebView
          source={{ html, baseUrl: 'https://www.youtube-nocookie.com' }}
          style={StyleSheet.absoluteFill}
          containerStyle={StyleSheet.absoluteFill}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          allowsInlineMediaPlayback
          allowsFullscreenVideo={false}
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={false}
          originWhitelist={['*']}
        />
      </View>
      {loading && (
        <View pointerEvents="none" style={stylesShared.centerOverlay}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </>
  );
}

export function ExerciseVideoPlayer({
  exerciseName,
  videoAsset,
  videoUrl,
  demoUrl,
  variant = 'standard',
  allowExternalOpen = true,
  style,
}: ExerciseVideoPlayerProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const mode = useMemo(() => getPlayerMode(videoAsset, videoUrl, demoUrl), [demoUrl, videoAsset, videoUrl]);
  const isCompact = variant === 'compact';

  if (!mode) return null;

  if (mode.type === 'external') {
    if (!allowExternalOpen) return null;

    return (
      <View style={[styles.fallbackCard, isCompact && styles.fallbackCardCompact, style]}>
        <View style={styles.fallbackIcon}>
          <Ionicons name="play" size={18} color={colors.accent} />
        </View>
        <View style={styles.fallbackCopy}>
          <Text style={styles.fallbackTitle} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>Demo available</Text>
          <Text style={styles.fallbackText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
            Open the exercise demo in your browser.
          </Text>
        </View>
        <Pressable
          onPress={() => openExternal(mode.externalUrl)}
          style={styles.fallbackButton}
          accessibilityRole="link"
          accessibilityLabel={`Open demo for ${exerciseName}`}
        >
          <Ionicons name="open-outline" size={15} color={colors.background} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.playerCard, isCompact && styles.playerCardCompact, style]}>
      <View pointerEvents="none" style={[styles.stage, isCompact && styles.stageCompact]}>
        {mode.type === 'native' ? (
          <NativeVideoSurface source={mode.source} />
        ) : (
          <YouTubeEmbedSurface videoId={mode.videoId} colors={colors} />
        )}
      </View>
    </View>
  );
}

const stylesShared = StyleSheet.create({
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,10,0.42)',
  },
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  playerCard: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  playerCardCompact: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  stage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  stageCompact: {
    aspectRatio: 1.72,
  },
  fallbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  fallbackCardCompact: {
    marginBottom: spacing.md,
  },
  fallbackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}1A`,
  },
  fallbackCopy: {
    flex: 1,
    minWidth: 0,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  fallbackText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  fallbackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
