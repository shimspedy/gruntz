import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { sendChatMessage, ChatMessage } from '../services/aiEngine';
import { hapticLight, hapticMedium } from '../utils/haptics';

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "I'm your Gruntz Coach. Ask me about training, nutrition, recovery, or your progress. I'll give you straight answers — no fluff.",
  timestamp: Date.now(),
};

const QUICK_PROMPTS = [
  '💪 How do I get better at push-ups?',
  '🏃 Help me run faster',
  '🧘 Recovery tips',
  '🍗 What should I eat?',
  '📊 How am I doing?',
];

export default function CoachChatScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progress = useUserStore((s) => s.progress);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    hapticLight();
    const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(trimmed, messages, progress);
      hapticMedium();
      const assistantMsg: ChatMessage = { role: 'assistant', content: response, timestamp: Date.now() };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'Connection issue. Try again — a good operator adapts.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, progress]);

  const handleQuickPrompt = (prompt: string) => {
    // Strip emoji prefix
    const text = prompt.replace(/^.{1,2}\s/, '');
    sendMessage(text);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && <Text style={styles.coachLabel}>🎯 COACH</Text>}
        <Text style={[styles.messageText, isUser && styles.userText]}>{item.content}</Text>
      </View>
    );
  };

  const showQuickPrompts = messages.length <= 1;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={showQuickPrompts ? (
            <View style={styles.quickPrompts}>
              <Text style={styles.quickPromptsTitle}>SUGGESTED QUESTIONS</Text>
              {QUICK_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={styles.quickPromptChip}
                  onPress={() => handleQuickPrompt(prompt)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickPromptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach..."
            placeholderTextColor={colors.textMuted}
            maxLength={500}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons name="send" size={20} color={colors.background} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  messageList: {
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  coachLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  userText: {
    color: colors.background,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  quickPrompts: {
    marginBottom: spacing.lg,
  },
  quickPromptsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  quickPromptChip: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickPromptText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
