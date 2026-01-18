'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { ChatAvatar, ChatTypingIndicator } from './ChatAvatar';
import type { Id } from '../../../convex/_generated/dataModel';

type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CollectionChatProps {
  /** The game context for the chat */
  gameSlug?: GameSlug;
  /** Callback when chat is closed */
  onClose?: () => void;
  /** Additional className for the container */
  className?: string;
}

// Game-specific suggested questions for kids to get started
// Includes both "Your Collection" and "Building Your Collection" suggestions
const SUGGESTED_QUESTIONS: Record<GameSlug, string[]> = {
  pokemon: [
    // Your Collection
    "What's my rarest Pokémon card?",
    "Which Pokémon types am I missing?",
    // Building Your Collection
    "Help me complete my Charizard collection",
    "What Trainer cards should I look for?",
  ],
  yugioh: [
    // Your Collection
    "What archetypes do I have cards for?",
    "Which monsters have the highest ATK?",
    // Building Your Collection
    "Help me build a Blue-Eyes deck",
    "What Spell cards should I look for?",
  ],
  onepiece: [
    // Your Collection
    "Which Leaders do I have?",
    "What colors am I strongest in?",
    // Building Your Collection
    "Help me build a Luffy deck",
    "Which starter decks should I get?",
  ],
  lorcana: [
    // Your Collection
    "Which ink colors do I collect?",
    "What's my highest lore character?",
    // Building Your Collection
    "Help me build an Amber/Steel deck",
    "What songs and actions do I have?",
  ],
};

export function CollectionChat({
  gameSlug = 'pokemon',
  onClose,
  className,
}: CollectionChatProps) {
  const { profileId, family } = useCurrentProfile();
  const chat = useAction(api.ai.chatbot.chat);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !profileId || !family?.id || isTyping) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setError(null);
      setIsTyping(true);

      try {
        const result = await chat({
          profileId: profileId as Id<'profiles'>,
          familyId: family.id as Id<'families'>,
          message: text.trim(),
          gameSlug,
        });

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.response,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (result.error === 'rate_limited') {
          setError('rate_limited');
        }
      } catch (err) {
        console.error('Chat error:', err);
        const errorMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: 'Oops! Something went wrong. Please try again!',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setError('error');
      } finally {
        setIsTyping(false);
      }
    },
    [profileId, family?.id, isTyping, chat, gameSlug]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(inputValue);
    },
    [inputValue, sendMessage]
  );

  // Handle suggested question click
  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      sendMessage(question);
    },
    [sendMessage]
  );

  // Handle key down for input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputValue);
      }
    },
    [inputValue, sendMessage]
  );

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl',
        className
      )}
      role="region"
      aria-label="Collection Chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-kid-primary to-kid-secondary px-4 py-3">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
          <h2 className="font-semibold text-white">Ask About Your Collection</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Close chat"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: '300px', maxHeight: '400px' }}>
        {/* Welcome message when no messages */}
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4">
              <ChatAvatar size="lg" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Hi there! I&apos;m Dexy, your collection helper!
            </h3>
            <p className="mb-6 max-w-sm text-sm text-gray-600">
              Ask me anything about your card collection. I can tell you about your rarest cards,
              collection progress, and more!
            </p>

            {/* Suggested questions */}
            <div className="w-full space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Try asking:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS[gameSlug].map((question) => (
                  <button
                    key={question}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-kid-primary/10 hover:text-kid-primary"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message bubbles */}
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="mr-2 flex-shrink-0">
                  <ChatAvatar size="sm" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2',
                  message.role === 'user'
                    ? 'bg-kid-primary text-white'
                    : 'bg-gray-100 text-gray-900'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="mb-1 flex items-center gap-1">
                    <SparklesIcon className="h-3 w-3 text-kid-primary" />
                    <span className="text-xs font-medium text-kid-primary">Dexy</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && <ChatTypingIndicator />}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your collection..."
            className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-kid-primary focus:outline-none focus:ring-1 focus:ring-kid-primary"
            disabled={isTyping || !profileId}
            aria-label="Chat message input"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping || !profileId}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition',
              inputValue.trim() && !isTyping && profileId
                ? 'bg-kid-primary text-white hover:bg-kid-primary/90'
                : 'bg-gray-200 text-gray-400'
            )}
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>

        {/* Error or status message */}
        {error === 'rate_limited' && (
          <p className="mt-2 text-center text-xs text-orange-600">
            You&apos;ve been chatting a lot! Take a short break and come back soon.
          </p>
        )}

        {!profileId && (
          <p className="mt-2 text-center text-xs text-gray-500">
            Please select a profile to start chatting.
          </p>
        )}
      </div>
    </div>
  );
}
