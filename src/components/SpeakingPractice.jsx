import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Mic, RefreshCw, Sparkles } from 'lucide-react';
import { sendMessage, generateUserId, resetConversation } from '../utils/voiceflow';
import { useTheme } from '../contexts/ThemeContext';

const SpeakingPractice = ({ level }) => {
  const { t } = useTranslation();
  const { getThemeForLevel } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const theme = getThemeForLevel(level);
  const userId = generateUserId();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      setIsLoading(true);
      try {
        const response = await sendMessage('start', userId);
        if (response && response.length > 0) {
          const botMessages = response.map((r, i) => ({
            id: `init-${i}`,
            type: 'bot',
            content: r.message || r.payload?.message || 'Hallo! Wie kann ich dir helfen?',
          }));
          setMessages(botMessages);
        } else {
          setMessages([
            {
              id: 'welcome',
              type: 'bot',
              content: 'Hallo! Ich bin dein Deutsch-Lernassistent. Wie kann ich dir heute helfen?',
            },
          ]);
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
        setMessages([
          {
            id: 'welcome',
            type: 'bot',
            content: 'Hallo! Ich bin dein Deutsch-Lernassistent. Wie kann ich dir heute helfen?',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initConversation();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(input.trim(), userId);
      if (response && response.length > 0) {
        const botMessages = response.map((r, i) => ({
          id: `bot-${Date.now()}-${i}`,
          type: 'bot',
          content: r.message || r.payload?.message || 'Ich verstehe. Kannst du das wiederholen?',
        }));
        setMessages((prev) => [...prev, ...botMessages]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: 'bot',
          content: 'Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.',
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleReset = async () => {
    await resetConversation(userId);
    setMessages([
      {
        id: 'reset',
        type: 'bot',
        content: 'Hallo! Lass uns von vorne beginnen. Was möchtest du üben?',
      },
    ]);
  };

  const handleSuggestion = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 bg-gradient-to-r ${theme.gradient} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{t('speaking.title')}</h3>
              <p className="text-white/80 text-sm">{t('speaking.voiceflowNote')}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="Reset conversation"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-start gap-3 ${
                message.type === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user'
                    ? `bg-${theme.primary} text-white`
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {message.type === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? `bg-${theme.primary} text-white rounded-tr-sm`
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                }`}
              >
                <p className="leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-slate-600" />
            </div>
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-sm text-slate-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            {t('speaking.suggestions.title')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSuggestion('Hallo, wie geht es dir?')}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              {t('speaking.suggestions.greeting')}
            </button>
            <button
              onClick={() => handleSuggestion('Ich heiße...')}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              {t('speaking.suggestions.introduce')}
            </button>
            <button
              onClick={() => handleSuggestion('Was machst du gerne?')}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              {t('speaking.suggestions.ask')}
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('speaking.placeholder')}
            className="flex-1 px-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-xl transition-colors ${
              input.trim() && !isLoading
                ? `bg-${theme.primary} text-white hover:opacity-90`
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakingPractice;
