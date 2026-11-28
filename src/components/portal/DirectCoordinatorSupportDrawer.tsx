'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CandidateRecord, DirectCoordinatorMessage } from '@/types';
import { usePortalStore } from '@/context/PortalStoreContext';
import { useToast } from '@/context/ToastContext';
import {
  MessageSquare,
  Send,
  X,
  UserCheck,
  Clock,
  ShieldCheck,
  ChevronRight,
  Headphones,
} from 'lucide-react';

interface DirectCoordinatorSupportDrawerProps {
  candidate: CandidateRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const DirectCoordinatorSupportDrawer: React.FC<DirectCoordinatorSupportDrawerProps> = ({
  candidate,
  isOpen,
  onClose,
}) => {
  const { sendDirectMessage, markMessagesAsRead } = usePortalStore();
  const { showToast } = useToast();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const messages: DirectCoordinatorMessage[] = candidate.processMeta?.messages || [];
  const unreadCount = messages.filter((m) => m.sender === 'coordinator' && !m.read).length;

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markMessagesAsRead(candidate.id, 'candidate').catch(() => {});
    }
  }, [isOpen, unreadCount, candidate.id, markMessagesAsRead]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setIsSending(true);
    try {
      await sendDirectMessage(candidate.id, text, 'candidate', candidate.name);
      setInputText('');
      showToast('Message sent to recruitment coordinator.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to send message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-label="Direct Coordinator Support Thread"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Coordinator Support Desk
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct channel to your assigned SIRI &amp; Employer coordinator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40 dark:bg-slate-950/20">
          {/* Welcome Card */}
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Recruitment Coordination</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
              Questions submitted here are delivered directly to your caseworker&apos;s command desk and archived alongside your Danish immigration dossier.
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                No direct messages yet.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                Need clarification on your contract, embassy date, or required documents? Ask below.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender === 'candidate';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {isMe ? 'You' : msg.senderName || 'Coordinator'}
                    </span>
                    <span>&middot;</span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                      isMe
                        ? 'bg-emerald-700 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Prompts */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Suggested:</span>
          {[
            'What is my next step?',
            'Is my police clearance approved?',
            'When is my interview scheduled?',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleQuickQuestion(prompt)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Input Form */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message to your coordinator..."
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 disabled:opacity-50 transition-colors shadow-sm"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
