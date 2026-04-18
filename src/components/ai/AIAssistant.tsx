import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Trash2, Headphones } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useDashboardStore } from '@/src/store';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function AIAssistant() {
  const { t, i18n } = useTranslation();
  const { user, userRole, chatMessages, sendMessage, users } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'chat'>('ai');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = userRole === 'admin';

  // Filter messages for the current chat
  const filteredChatMessages = chatMessages.filter(msg => {
    if (!user) return false;
    if (isAdmin) {
      if (!selectedRecipientId) return false;
      return (msg.senderId === user.uid && msg.recipientId === selectedRecipientId) ||
             (msg.senderId === selectedRecipientId && msg.recipientId === user.uid);
    } else {
      return (msg.senderId === user.uid && msg.recipientId === 'admin') ||
             (msg.senderId === 'admin' && msg.recipientId === user.uid);
    }
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const affiliates = users.filter(u => u.role === 'affiliate');

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = i18n.language === 'it' 
        ? 'Ciao! Sono il tuo assistente Sogni AI. Come posso aiutarti oggi?' 
        : i18n.language === 'fr'
        ? 'Bonjour ! Je suis votre assistant Sogni AI. Comment puis-je vous aider aujourd\'hui ?'
        : 'Hello! I am your Sogni AI Assistant. How can I help you manage your agency today?';
      
      setMessages([{ role: 'model', text: welcomeMessage }]);
    }
  }, [i18n.language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, filteredChatMessages, isOpen, activeTab, selectedRecipientId]);

  const clearChat = () => {
    if (activeTab === 'ai') {
      const welcomeMessage = i18n.language === 'it' 
        ? 'Chat pulita. Come posso aiutarti ora?' 
        : i18n.language === 'fr'
        ? 'Chat effacé. Comment puis-je vous aider maintenant ?'
        : 'Chat cleared. How can I help you now?';
      setMessages([{ role: 'model', text: welcomeMessage }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (activeTab === 'ai') {
      if (isLoading) return;
      const userMessage = input.trim();
      setInput('');
      setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
      setIsLoading(true);

      try {
        const { leads, tasks, projects, users } = useDashboardStore.getState();
        const stats = {
          totalLeads: leads.length,
          activeProjects: projects.filter(p => p.status === 'Active').length,
          pendingTasks: tasks.filter(t => t.status !== 'Done').length,
          totalAffiliates: users.filter(u => u.role === 'affiliate').length,
          role: userRole,
          userName: user?.displayName || user?.email
        };

        const modelInstructions = `You are a highly intelligent, empathetic, and professional AI assistant for Sogni CRM, a luxury digital agency management platform. 
          Your tone is "Cyber-Luxury": sophisticated, efficient, and warm. You speak like a high-end concierge or a senior partner in a digital agency.
          
          CRITICAL: You must respond in the user's current language: ${i18n.language === 'it' ? 'Italian' : i18n.language === 'fr' ? 'French' : 'English'}.
          
          Current Platform Context:
          - User: ${stats.userName} (Role: ${stats.role})
          - Total Leads: ${stats.totalLeads}
          - Active Projects: ${stats.activeProjects}
          - Pending Tasks: ${stats.pendingTasks}
          - Total Affiliates: ${stats.totalAffiliates}

          You help with CRM tasks, project management, social media strategy, and general business questions. 
          Be proactive, offer suggestions, and maintain a human-like conversational flow. Avoid robotic or overly formal language. 
          Use the context of a 'Cyber-Luxury' agency - think neon, luxury, high-tech, and premium service.
          
          When the user asks about the CRM, you can explain that it's a complete tool for managing leads, projects, inventory, and social media.
          If they ask about security, mention the administrative controls and encrypted database.
          If they ask about affiliates, explain how they can invite partners and manage their profiles.
          
          Always be helpful and try to anticipate their next needs. If they seem stuck, offer a few options for what they could do next.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [...messages, { role: 'user', text: userMessage }].map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          config: {
            systemInstruction: modelInstructions
          }
        });

        const botResponse = response.text || "I'm sorry, I couldn't process that.";
        setMessages(prev => [...prev, { role: 'model', text: botResponse }]);
      } catch (error) {
        console.error("AI Error:", error);
        const errorMessage = i18n.language === 'it'
          ? "Scusa, ho riscontrato un errore. Riprova più tardi."
          : i18n.language === 'fr'
          ? "Désolé, j'ai rencontré une erreur. Veuillez réessayer plus tard."
          : "Sorry, I encountered an error. Please check your connection or try again later.";
        setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Support Chat
      if (!user) return;
      const recipientId = isAdmin ? selectedRecipientId : 'admin';
      if (!recipientId) return;

      const message = {
        senderId: user.uid,
        senderName: user.displayName || user.email || 'User',
        recipientId: recipientId,
        text: input.trim(),
        timestamp: new Date().toISOString(),
      };

      await sendMessage(message);
      setInput('');
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.4)] flex items-center justify-center hover:scale-110 transition-transform z-50 group"
          >
            <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, x: 20 }}
            className="fixed bottom-6 right-6 w-[380px] sm:w-[400px] h-[550px] max-h-[80vh] bg-card/95 backdrop-blur-xl border border-border rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="border-b border-border bg-primary/5">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shadow-inner">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">{t('ai_assistant')}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{t('online_ready')}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {activeTab === 'ai' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={clearChat} 
                      className="rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground h-9 w-9"
                      title="Clear Chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)} 
                    className="rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground h-9 w-9"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex px-5 pb-2 gap-4">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={cn(
                    "text-[10px] uppercase tracking-widest font-bold pb-2 border-b-2 transition-all",
                    activeTab === 'ai' ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
                  )}
                >
                  Sogni AI
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "text-[10px] uppercase tracking-widest font-bold pb-2 border-b-2 transition-all flex items-center gap-2",
                    activeTab === 'chat' ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
                  )}
                >
                  {isAdmin ? t('affiliates') : t('admin_support')}
                  {!isAdmin && chatMessages.some(m => m.recipientId === user?.uid && !m.read) && (
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
              {activeTab === 'ai' ? (
                <>
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                        m.role === 'user' ? "bg-primary/20" : "bg-white/5"
                      )}>
                        {m.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className={cn(
                        "p-3.5 rounded-2xl text-sm max-w-[85%] leading-relaxed shadow-sm",
                        m.role === 'user' 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-white/5 text-foreground border border-white/5 rounded-tl-none"
                      )}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 flex gap-1.5 items-center rounded-tl-none">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {isAdmin && !selectedRecipientId ? (
                    <div className="space-y-4 py-4">
                      <p className="text-xs text-muted-foreground text-center uppercase tracking-widest font-bold opacity-70">
                        {t('select_affiliate_to_chat', 'Select an affiliate to chat')}
                      </p>
                      <div className="grid gap-2">
                        {affiliates.map(aff => (
                          <button
                            key={aff.id}
                            onClick={() => setSelectedRecipientId(aff.id)}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                          >
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary">
                              {aff.name?.[0] || aff.email?.[0]}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold">{aff.name || aff.email}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{t('affiliate')}</p>
                            </div>
                          </button>
                        ))}
                        {affiliates.length === 0 && (
                          <p className="text-xs text-center text-muted-foreground py-8">
                            {t('no_affiliates_found')}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {isAdmin && (
                        <button 
                          onClick={() => setSelectedRecipientId(null)}
                          className="text-[10px] uppercase tracking-widest font-bold text-primary hover:underline mb-4"
                        >
                          ← {t('back_to_list', 'Back to affiliate list')}
                        </button>
                      )}
                      
                      {filteredChatMessages.map((msg, i) => (
                        <div key={i} className={cn("flex gap-3", msg.senderId === user?.uid ? "flex-row-reverse" : "flex-row")}>
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                            msg.senderId === user?.uid ? "bg-primary/20" : "bg-white/5"
                          )}>
                            {msg.senderId === user?.uid ? <User className="w-4 h-4 text-primary" /> : <Headphones className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="flex flex-col gap-1 max-w-[85%]">
                            <div className={cn(
                              "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                              msg.senderId === user?.uid 
                                ? "bg-primary text-primary-foreground rounded-tr-none" 
                                : "bg-white/5 text-foreground border border-white/5 rounded-tl-none"
                            )}>
                              {msg.text}
                            </div>
                            <span className={cn(
                              "text-[8px] uppercase tracking-tight text-muted-foreground font-medium",
                              msg.senderId === user?.uid ? "text-right" : "text-left"
                            )}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {filteredChatMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-50">
                          <MessageSquare className="w-12 h-12 text-primary/20" />
                          <p className="text-xs font-bold uppercase tracking-widest italic">
                            {t('start_conversation', 'Inizia la conversazione')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-5 border-t border-border bg-white/5">
              {activeTab === 'chat' && isAdmin && !selectedRecipientId ? (
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold opacity-50 h-10 flex items-center justify-center">
                  {t('select_to_message', 'Seleziona un affiliato per inviare un messaggio')}
                </p>
              ) : (
                <div className="relative group">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={activeTab === 'ai' ? t('ask_anything') : t('type_message')}
                    className="pr-14 bg-white/5 border-white/10 h-14 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary transition-all group-focus-within:bg-white/10"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim() || (activeTab === 'chat' && isAdmin && !selectedRecipientId)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/80 transition-all disabled:opacity-50 disabled:grayscale shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-[9px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-bold opacity-50">
                {activeTab === 'ai' ? 'Powered by Sogni AI • Gemini 3.0' : 'Sogni Support Network • Encrypted'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
