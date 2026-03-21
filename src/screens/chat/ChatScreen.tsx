import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../../types';
import { Colors } from '../../constants/colors';
import { useProfile } from '../../context/ProfileContext';
import { callBoussoleAI } from '../../services/ai';
import { useTranslation } from '../../i18n';

const DAILY_LIMIT = 20;
const STORAGE_KEY = '@boussole/ai_usage';

function getTodayStr() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

async function getDailyUsage(): Promise<{ count: number; date: string }> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, date: getTodayStr() };
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayStr()) return { count: 0, date: getTodayStr() };
    return parsed;
  } catch {
    return { count: 0, date: getTodayStr() };
  }
}

async function incrementDailyUsage(): Promise<number> {
  const usage = await getDailyUsage();
  const updated = { count: usage.count + 1, date: getTodayStr() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.count;
}

export default function ChatScreen() {
  const { profile } = useProfile();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: t('chat.welcome'),
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getDailyUsage().then(u => setUsageCount(u.count));
  }, []);

  const limitReached = usageCount >= DAILY_LIMIT;

  const suggestions = [
    t('chat.suggestion.1'),
    t('chat.suggestion.2'),
    t('chat.suggestion.3'),
    t('chat.suggestion.4'),
    t('chat.suggestion.5'),
  ];

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    if (limitReached) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: t('chat.limitReached'),
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const loadingMsg: ChatMessage = {
      id: 'loading',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const reply = await callBoussoleAI(content, messages, profile);
      const newCount = await incrementDailyUsage();
      setUsageCount(newCount);
      setMessages(prev =>
        prev
          .filter(m => m.id !== 'loading')
          .concat({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: reply,
            timestamp: new Date().toISOString(),
          })
      );
    } catch (e: any) {
      const errorContent = e.message === 'API_NOT_CONFIGURED'
        ? t('ai.notConfigured')
        : t('chat.error');
      setMessages(prev =>
        prev
          .filter(m => m.id !== 'loading')
          .concat({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: errorContent,
            timestamp: new Date().toISOString(),
          })
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <View style={styles.aiAvatar}>
          <Ionicons name="compass" size={18} color={Colors.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.headerTitle}>{t('chat.headerTitle')}</Text>
          <Text style={styles.headerSub}>{t('chat.headerSub')}</Text>
        </View>
        <View style={[styles.usageBadge, limitReached && styles.usageBadgeLimit]}>
          <Ionicons name="flash" size={11} color={limitReached ? '#ff6b6b' : Colors.accent} />
          <Text style={[styles.usageText, limitReached && styles.usageTextLimit]}>
            {usageCount}/{DAILY_LIMIT}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <MessageBubble message={item} />}
          ListFooterComponent={
            showSuggestions ? (
              <View style={styles.suggestions}>
                <Text style={styles.suggestionsTitle}>{t('chat.suggestionsTitle')}</Text>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                    <Ionicons name="arrow-forward-circle-outline" size={16} color={Colors.primaryLight} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
        />

        <View style={styles.inputBar}>
          {limitReached ? (
            <View style={styles.limitBar}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.limitBarText}>{t('chat.limitReachedBar')}</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder={t('chat.placeholder')}
                placeholderTextColor={Colors.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
                onSubmitEditing={() => sendMessage()}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
                onPress={() => sendMessage()}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Ionicons name="send" size={18} color={Colors.white} />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  if (message.isLoading) {
    return (
      <View style={[styles.bubble, styles.bubbleAI]}>
        <View style={styles.typing}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.typingDot, { opacity: 0.3 + i * 0.25 }]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
      {!isUser && (
        <View style={styles.aiBadge}>
          <Ionicons name="compass" size={12} color={Colors.accent} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(245,166,35,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.white },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  messageList: { padding: 16, gap: 10 },
  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  aiBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%', borderRadius: 18, padding: 12,
  },
  bubbleUser: {
    backgroundColor: Colors.primaryLight,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: Colors.white },
  typing: { flexDirection: 'row', gap: 4, padding: 4 },
  typingDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primaryLight,
  },
  suggestions: { marginTop: 16, gap: 8 },
  suggestionsTitle: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginBottom: 4 },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    gap: 8,
  },
  suggestionText: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  usageBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,166,35,0.15)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  usageBadgeLimit: { backgroundColor: 'rgba(255,107,107,0.15)' },
  usageText: { fontSize: 11, fontWeight: '700', color: Colors.accent },
  usageTextLimit: { color: '#ff6b6b' },
  limitBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 10,
  },
  limitBarText: { fontSize: 13, color: Colors.textMuted },
});
