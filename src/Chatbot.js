// src/Chatbot.js

import React, { useEffect, useRef, useState } from 'react';
import './Chatbot.css';
import { sendMessageToOpenAI } from './openaiService';
import {
  ArrowUpIcon,
  CloseIcon,
  ComposeIcon,
  GearIcon,
  MenuIcon,
  SearchIcon,
  SparkIcon,
} from './icons';

const MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o mini — fast' },
  { id: 'gpt-4o', label: 'GPT-4o — smart' },
];

const TONE_PROMPTS = {
  Balanced: 'Be helpful and clear. Keep replies under 150 words.',
  Concise: 'Answer in 1-3 short sentences.',
  Friendly: 'Be warm and conversational. Keep replies under 150 words.',
};
const PLAIN_TEXT_RULE =
  ' Reply in plain text only — no markdown, no asterisks, no headers, no bullet symbols.';

const SUGGESTIONS = ['Summarise a doc', 'Draft an email', 'Explain some code', 'Brainstorm ideas'];

const STORAGE_KEYS = {
  conversations: 'chatbot.conversations',
  darkMode: 'chatbot.darkMode',
};

const readStored = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeStored = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (e.g. private browsing) — the app keeps working in memory.
  }
};

// Stored data may be corrupt or from an older shape — never let it crash the app.
const loadConversations = () => {
  const raw = readStored(STORAGE_KEYS.conversations, []);
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => ({
    title: typeof c?.title === 'string' ? c.title : 'Untitled',
    messages: Array.isArray(c?.messages)
      ? c.messages.filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
      : [],
    updatedAt: typeof c?.updatedAt === 'number' ? c.updatedAt : 0,
  }));
};

const dateGroup = (timestamp) => {
  if (!timestamp) return 'Earlier';
  const day = new Date(timestamp).toDateString();
  const now = new Date();
  if (day === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return day === yesterday.toDateString() ? 'Yesterday' : 'Earlier';
};

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState(loadConversations);
  const [currentIndex, setCurrentIndex] = useState(() => loadConversations().length);
  const [pendingIndex, setPendingIndex] = useState(null); // conversation awaiting a reply
  const [darkMode, setDarkMode] = useState(() => readStored(STORAGE_KEYS.darkMode, false));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [model, setModel] = useState(MODELS[0].id);
  const [tone, setTone] = useState('Balanced');
  const [isMobile, setIsMobile] = useState(() =>
    typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 768px)').matches : false
  );

  const loading = pendingIndex !== null;
  const threadRef = useRef(null);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const pendingMessagesRef = useRef(null); // in-flight thread, so re-selecting it mid-reply keeps the sent message
  const historyTriggerRef = useRef(null);
  const settingsTriggerRef = useRef(null);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (!historyOpen && !settingsOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setHistoryOpen(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [historyOpen, settingsOpen]);

  useEffect(() => {
    if (!historyOpen && historyTriggerRef.current) {
      historyTriggerRef.current.focus?.();
      historyTriggerRef.current = null;
    }
  }, [historyOpen]);

  useEffect(() => {
    if (!settingsOpen && settingsTriggerRef.current) {
      settingsTriggerRef.current.focus?.();
      settingsTriggerRef.current = null;
    }
  }, [settingsOpen]);

  useEffect(() => {
    writeStored(STORAGE_KEYS.conversations, conversations);
  }, [conversations]);

  useEffect(() => {
    writeStored(STORAGE_KEYS.darkMode, darkMode);
  }, [darkMode]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pendingIndex]);

  const sendText = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const sendIndex = currentIndex;
    const sent = [...messages, { role: 'user', content: trimmed }];
    pendingMessagesRef.current = sent;
    setMessages(sent);
    setInput('');
    setPendingIndex(sendIndex);

    let reply;
    try {
      reply = await sendMessageToOpenAI(sent, {
        model,
        system: TONE_PROMPTS[tone] + PLAIN_TEXT_RULE,
      });
    } catch (error) {
      reply = "(Couldn't reach the AI — try again in a moment.)";
    }
    reply = String(reply).replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#+\s*/gm, '');

    const done = [...sent, { role: 'assistant', content: reply }];
    setConversations((prev) => {
      const next = [...prev];
      const chars = Array.from(trimmed); // slice by code points so emoji at the cut don't break
      const title =
        next[sendIndex]?.title ?? chars.slice(0, 32).join('') + (chars.length > 32 ? '…' : '');
      next[sendIndex] = { title, messages: done, updatedAt: Date.now() };
      return next;
    });
    if (currentIndexRef.current === sendIndex) setMessages(done);
    pendingMessagesRef.current = null;
    setPendingIndex(null);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    // An in-flight first reply will save into slot pendingIndex, so a new chat
    // started meanwhile must reserve the slot after it.
    setCurrentIndex(
      pendingIndex !== null && pendingIndex >= conversations.length
        ? pendingIndex + 1
        : conversations.length
    );
    setHistoryOpen(false);
  };

  const handleSelectConversation = (index) => {
    setMessages(
      index === pendingIndex && pendingMessagesRef.current
        ? pendingMessagesRef.current
        : conversations[index].messages
    );
    setCurrentIndex(index);
    setHistoryOpen(false);
  };

  const title = conversations[currentIndex]?.title ?? 'New conversation';

  const query = search.trim().toLowerCase();
  const historyEntries = conversations
    .map((conv, index) => ({ conv, index }))
    .filter(({ conv }) => !query || conv.title.toLowerCase().includes(query))
    .sort((a, b) => (b.conv.updatedAt ?? 0) - (a.conv.updatedAt ?? 0));
  const groupedEntries = historyEntries.reduce((groups, entry) => {
    const label = dateGroup(entry.conv.updatedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.entries.push(entry);
    } else {
      groups.push({ label, entries: [entry] });
    }
    return groups;
  }, []);

  return (
    <div className="app" data-theme={darkMode ? 'dark' : 'light'}>
      <nav className="rail">
        <button
          className={`rail-btn${historyOpen ? ' active' : ''}`}
          title="History"
          aria-label="History"
          aria-expanded={historyOpen}
          aria-controls="history-panel"
          onClick={() => {
            if (!historyOpen) historyTriggerRef.current = document.activeElement;
            setHistoryOpen(!historyOpen);
          }}
        >
          <MenuIcon />
        </button>
        <button className="rail-btn" title="New chat" aria-label="New chat" onClick={handleNewChat}>
          <ComposeIcon />
        </button>
        <div className="rail-avatar">Y</div>
      </nav>

      {(historyOpen || settingsOpen) && (
        <div
          className="scrim"
          onClick={() => {
            setHistoryOpen(false);
            setSettingsOpen(false);
          }}
        />
      )}

      <aside
        id="history-panel"
        className={`history${historyOpen ? ' open' : ''}`}
        aria-label="Conversations"
        role={isMobile && historyOpen ? 'dialog' : undefined}
        aria-modal={isMobile && historyOpen ? 'true' : undefined}
      >
        <div className="history-header">
          <span className="history-title">Conversations</span>
          <button className="icon-btn" aria-label="Close history" onClick={() => setHistoryOpen(false)}>
            <CloseIcon size={15} />
          </button>
        </div>
        <div className="history-search">
          <SearchIcon size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search conversations"
          />
        </div>
        <button className="history-new" onClick={handleNewChat}>
          + New conversation
        </button>
        <div className="history-list">
          {groupedEntries.map((group) => (
            <React.Fragment key={group.label}>
              <span className="history-group">{group.label}</span>
              {group.entries.map(({ conv, index }) => (
                <button
                  key={index}
                  className={`history-item${index === currentIndex ? ' active' : ''}`}
                  aria-current={index === currentIndex ? 'true' : undefined}
                  onClick={() => handleSelectConversation(index)}
                >
                  {conv.title}
                </button>
              ))}
            </React.Fragment>
          ))}
          {conversations.length === 0 && (
            <span className="history-empty">Nothing saved yet — start chatting.</span>
          )}
        </div>
        <div className="history-account">
          <div className="history-avatar">Y</div>
          <span className="history-name">You</span>
          <button
            className="icon-btn"
            aria-label="Settings"
            onClick={() => {
              settingsTriggerRef.current = document.activeElement;
              setSettingsOpen(true);
              setHistoryOpen(false);
            }}
          >
            <GearIcon size={17} />
          </button>
        </div>
      </aside>

      <main className="main" inert={isMobile && (historyOpen || settingsOpen) ? '' : undefined}>
        <header className="mobile-header">
          <button
            className="icon-btn"
            aria-label="History"
            aria-expanded={historyOpen}
            aria-controls="history-panel"
            onClick={() => {
              historyTriggerRef.current = document.activeElement;
              setHistoryOpen(true);
            }}
          >
            <MenuIcon size={20} />
          </button>
          <span className="mobile-title">{title}</span>
          <button className="icon-btn" aria-label="New chat" onClick={handleNewChat}>
            <ComposeIcon size={18} />
          </button>
        </header>
        <div className="thread-title">{title}</div>

        {messages.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <SparkIcon size={26} />
            </div>
            <h1 className="empty-heading">What can I help with?</h1>
            <div className="chips">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} className="chip" onClick={() => sendText(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="thread" ref={threadRef}>
            <div className="messages" role="log" aria-live="polite">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`msg ${msg.role === 'user' ? 'user' : 'assistant'}`}
                >
                  <span className="sr-only">{msg.role === 'user' ? 'You: ' : 'Assistant: '}</span>
                  {msg.content}
                </div>
              ))}
              {pendingIndex === currentIndex && (
                <div className="typing">
                  <span className="sr-only">Assistant is typing</span>
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="composer">
          <div className="composer-inner">
            <input
              className="composer-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) sendText(input);
              }}
              placeholder="Ask me anything…"
              aria-label="Message"
            />
            <button
              className="send-btn"
              aria-label="Send"
              disabled={loading}
              onClick={() => sendText(input)}
            >
              <ArrowUpIcon size={20} />
            </button>
          </div>
        </div>
      </main>

      <aside
        className={`inspector${settingsOpen ? ' open' : ''}`}
        aria-label="Settings"
        role={isMobile && settingsOpen ? 'dialog' : undefined}
        aria-modal={isMobile && settingsOpen ? 'true' : undefined}
      >
        <div className="inspector-header">
          <span className="inspector-title">Settings</span>
          <button
            className="icon-btn inspector-close"
            aria-label="Close settings"
            onClick={() => setSettingsOpen(false)}
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="inspector-section">
          <span className="section-label">Model</span>
          <select
            className="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            aria-label="Model"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="inspector-section">
          <span className="section-label">Tone</span>
          <div className="tone-list">
            {Object.keys(TONE_PROMPTS).map((t) => (
              <button
                key={t}
                className={`tone-item${tone === t ? ' active' : ''}`}
                aria-pressed={tone === t}
                onClick={() => setTone(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="inspector-row">
          <span className="switch-label">Dark mode</span>
          <button
            className={`switch${darkMode ? ' on' : ''}`}
            role="switch"
            aria-checked={darkMode}
            aria-label="Dark mode"
            onClick={() => setDarkMode(!darkMode)}
          >
            <span className="knob" />
          </button>
        </div>
        <span className="inspector-footer">
          Replies are generated live by OpenAI. Conversations are saved in this browser.
        </span>
      </aside>
    </div>
  );
};

export default Chatbot;
