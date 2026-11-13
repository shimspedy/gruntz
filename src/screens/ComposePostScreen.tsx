import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FEED_FAILURE, createPost, recentWorkout, type Audience, type WorkoutSummary } from '../services/feed';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Segmented } from '../ui/Segmented';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';
import { useContentSize } from '../ui/useContentSize';

const AUDIENCES: { value: Audience; label: string }[] = [{ value: 'everyone', label: 'Everyone' }, { value: 'followers', label: 'Followers' }];
/** Long edge of an uploaded photo. Enough for a phone screen, small enough to send on a gym connection. */
const PHOTO_WIDTH = 1440;

/** Write a post: words, today's workout, or a photo. */
export default function ComposePostScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useContentSize();
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('everyone');
  const [workout, setWorkout] = useState<WorkoutSummary | null>(null);
  const [attach, setAttach] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    void recentWorkout().then((found) => { if (alive.current && found) { setWorkout(found); setAttach(true); } });
    return () => { alive.current = false; };
  }, []);

  const pickPhoto = async () => {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsMultipleSelection: false });
      const asset = picked.canceled ? null : picked.assets[0];
      if (!asset) return;
      const shrunk = await ImageManipulator.manipulateAsync(
        asset.uri,
        asset.width > PHOTO_WIDTH ? [{ resize: { width: PHOTO_WIDTH } }] : [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      if (!alive.current) return;
      setPhoto(shrunk.uri);
      // A post is one thing: a photo replaces the workout card.
      setAttach(false);
    } catch {
      toast('Couldn’t open that photo. Try another one.', { tone: 'error', icon: 'alert' });
    }
  };

  const sharingWorkout = attach && !!workout && !photo;
  const ready = !!body.trim() || sharingWorkout || !!photo;

  const publish = async () => {
    if (!ready || busy) return;
    setBusy(true);
    const result = await createPost({ body, audience, workout: sharingWorkout ? workout : null, photoUri: photo });
    if (!alive.current) return;
    setBusy(false);
    if (!result.ok) { haptic.warning(); toast(FEED_FAILURE[result.reason], { tone: 'error', icon: 'alert' }); return; }
    haptic.success();
    toast('Posted');
    navigation.goBack();
  };

  const close = () => {
    if (!body.trim() && !photo) { navigation.goBack(); return; }
    Alert.alert('Discard this post?', undefined, [{ text: 'Keep writing', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }]);
  };

  const photoWidth = width - space.md * 2;
  return (
    <View style={styles.screen}>
      <NavHeader title="New post" icon="close" onBack={close} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: space.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={sharingWorkout ? 'Add a line about the session' : 'What did you train today?'}
            placeholderTextColor={color.textTertiary}
            style={styles.input}
            multiline
            autoFocus
            maxLength={500}
            maxFontSizeMultiplier={1.6}
            selectionColor={color.accent}
            accessibilityLabel="Post text"
          />

          {workout && !photo ? (
            <Tap feedback="opacity" onPress={() => { haptic.selection(); setAttach((on) => !on); }} style={[styles.attach, attach && styles.attachOn]} accessibilityRole="switch" accessibilityState={{ checked: attach }} accessibilityLabel={`Share today's workout, ${workout.title}`}>
              <View style={styles.attachIcon}><Icon name="dumbbellFill" size={18} color={color.text} /></View>
              <View style={{ flex: 1 }}>
                <Text variant="headline" numberOfLines={1}>{workout.title}</Text>
                <Text variant="footnote" tone="secondary" tabular>
                  {[workout.minutes ? `${workout.minutes} min` : '', workout.sets ? `${workout.sets} sets` : '', workout.records ? `${workout.records} records` : ''].filter(Boolean).join(' · ') || 'Finished today'}
                </Text>
              </View>
              <Icon name={attach ? 'check' : 'plus'} size={18} color={attach ? color.accent : color.textSecondary} weight="bold" />
            </Tap>
          ) : null}

          {photo ? (
            <View style={{ marginBottom: space.md }}>
              <Image source={{ uri: photo }} style={{ width: photoWidth, height: Math.round(photoWidth * 1.1), borderRadius: radius.md }} contentFit="cover" accessibilityLabel="Photo for this post" />
              <Tap feedback="opacity" hitSlop={8} onPress={() => setPhoto(null)} style={styles.removePhoto} accessibilityRole="button" accessibilityLabel="Remove photo">
                <Icon name="close" size={16} color="#FFFFFF" weight="bold" />
              </Tap>
            </View>
          ) : (
            <Tap feedback="opacity" onPress={() => { void pickPhoto(); }} style={styles.addPhoto} accessibilityRole="button" accessibilityLabel="Add a photo">
              <Icon name="camera" size={18} color={color.textSecondary} />
              <Text variant="callout" tone="secondary" style={{ fontFamily: font.semibold }}>Add a photo</Text>
            </Tap>
          )}

          <Text variant="footnote" tone="tertiary" style={styles.label}>Who can see this</Text>
          <Segmented options={AUDIENCES} value={audience} onChange={setAudience} />
          <Text variant="footnote" tone="tertiary" style={styles.note}>
            {audience === 'everyone' ? 'Any signed-in athlete can see this post.' : 'Only athletes who follow you can see this post.'} Your name, photo, level and rank are shown with it. Weights and reps are never included.
          </Text>
        </ScrollView>
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
          <Button title="Post" onPress={() => { void publish(); }} loading={busy} disabled={!ready} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  input: { minHeight: 120, color: color.text, fontFamily: font.regular, fontSize: 19, lineHeight: 27, textAlignVertical: 'top', marginBottom: space.md },
  attach: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: color.surface, marginBottom: space.sm, opacity: 0.7 },
  attachOn: { opacity: 1 },
  attachIcon: { width: 40, height: 40, borderRadius: 12, borderCurve: 'continuous', backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  addPhoto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: color.surface, marginBottom: space.md },
  removePhoto: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  label: { marginBottom: 6 },
  note: { marginTop: space.sm, lineHeight: 18 },
  bar: { paddingHorizontal: space.md, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
});
