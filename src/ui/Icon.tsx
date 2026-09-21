import React from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { SymbolView, type SymbolViewProps, type SFSymbol } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import { color as palette } from './tokens';

type IonName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * One icon family: SF Symbols on iOS, Ionicons outlines as the Android fallback.
 */
const icons = {
  back: ['arrow.left', 'arrow-back'],
  close: ['xmark', 'close'],
  chevronRight: ['chevron.right', 'chevron-forward'],
  chevronLeft: ['chevron.left', 'chevron-back'],
  chevronDown: ['chevron.down', 'chevron-down'],
  chevronUp: ['chevron.up', 'chevron-up'],
  arrowRight: ['arrow.right', 'arrow-forward'],
  plus: ['plus', 'add'],
  minus: ['minus', 'remove'],
  gear: ['gearshape', 'settings-outline'],
  flame: ['flame.fill', 'flame'],
  dumbbell: ['dumbbell', 'barbell-outline'],
  dumbbellFill: ['dumbbell.fill', 'barbell'],
  person: ['person', 'person-outline'],
  personFill: ['person.fill', 'person'],
  personEdit: ['person.crop.circle.badge.checkmark', 'create-outline'],
  test: ['list.clipboard', 'clipboard-outline'],
  testFill: ['list.clipboard.fill', 'clipboard'],
  sparkles: ['sparkles', 'sparkles'],
  play: ['play.fill', 'play'],
  pause: ['pause.fill', 'pause'],
  stop: ['stop.fill', 'stop'],
  stopwatch: ['stopwatch', 'stopwatch-outline'],
  timer: ['timer', 'timer-outline'],
  info: ['info.circle', 'information-circle-outline'],
  more: ['ellipsis', 'ellipsis-horizontal'],
  check: ['checkmark', 'checkmark'],
  swap: ['arrow.left.arrow.right', 'swap-horizontal'],
  replace: ['arrow.triangle.2.circlepath', 'repeat'],
  trash: ['trash', 'trash-outline'],
  calendar: ['calendar', 'calendar-outline'],
  run: ['figure.run', 'walk-outline'],
  ruck: ['backpack', 'bag-handle-outline'],
  swim: ['figure.pool.swim', 'water-outline'],
  strength: ['figure.strengthtraining.traditional', 'barbell-outline'],
  core: ['figure.core.training', 'body-outline'],
  mobility: ['figure.flexibility', 'body-outline'],
  heart: ['heart', 'heart-outline'],
  bolt: ['bolt', 'flash-outline'],
  moon: ['moon.fill', 'moon'],
  bell: ['bell', 'notifications-outline'],
  shield: ['shield', 'shield-outline'],
  shieldCheck: ['checkmark.shield', 'shield-checkmark-outline'],
  globe: ['globe', 'globe-outline'],
  star: ['star', 'star-outline'],
  starFill: ['star.fill', 'star'],
  send: ['paperplane', 'paper-plane-outline'],
  alert: ['exclamationmark.circle', 'alert-circle-outline'],
  doc: ['doc.text', 'document-text-outline'],
  book: ['book.closed', 'book-outline'],
  lock: ['lock.fill', 'lock-closed'],
  mail: ['envelope', 'mail-outline'],
  share: ['square.and.arrow.up', 'share-outline'],
  pencil: ['pencil', 'pencil'],
  chart: ['chart.bar', 'stats-chart-outline'],
  trophy: ['trophy', 'trophy-outline'],
  medal: ['medal', 'medal-outline'],
  body: ['figure.stand', 'body-outline'],
  pulse: ['waveform.path.ecg', 'pulse-outline'],
  sleep: ['bed.double', 'bed-outline'],
  drop: ['drop', 'water-outline'],
  brain: ['brain.head.profile', 'happy-outline'],
  battery: ['battery.75percent', 'battery-half-outline'],
  location: ['location', 'navigate-outline'],
  elevation: ['mountain.2', 'trending-up-outline'],
  steps: ['shoeprints.fill', 'footsteps-outline'],
  people: ['person.2', 'people-outline'],
  peopleFill: ['person.2.fill', 'people'],
  grid: ['square.grid.2x2', 'grid-outline'],
  list: ['list.bullet', 'list-outline'],
  flag: ['flag', 'flag-outline'],
  scope: ['scope', 'locate-outline'],
  gift: ['gift', 'gift-outline'],
  external: ['arrow.up.right', 'open-outline'],
  speaker: ['speaker.wave.2', 'volume-medium-outline'],
  sun: ['sun.max', 'sunny-outline'],
  eye: ['eye', 'eye-outline'],
  home: ['house', 'home-outline'],
  mapPin: ['mappin.and.ellipse', 'location-outline'],
  bandage: ['bandage', 'medkit-outline'],
  joint: ['figure.walk.motion', 'accessibility-outline'],
  restart: ['arrow.counterclockwise', 'refresh'],
  gauge: ['gauge.with.dots.needle.67percent', 'speedometer-outline'],
} as const satisfies Record<string, readonly [string, IonName]>;

export type IconName = keyof typeof icons;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  weight?: SymbolViewProps['weight'];
  style?: StyleProp<ViewStyle>;
}

export function Icon({ name, size = 22, color = palette.text, weight = 'regular', style }: IconProps) {
  const [sf, ion] = icons[name];
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={sf as SFSymbol}
        size={size}
        tintColor={color}
        weight={weight}
        resizeMode="scaleAspectFit"
        style={[{ width: size, height: size }, style]}
        fallback={<Ionicons name={ion} size={size} color={color} />}
      />
    );
  }
  return (
    <View style={style}>
      <Ionicons name={ion} size={size} color={color} />
    </View>
  );
}
