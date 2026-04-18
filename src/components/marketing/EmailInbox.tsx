import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '@/src/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Inbox, 
  Search, 
  Star, 
  Trash2, 
  Send, 
  RefreshCw, 
  MoreVertical,
  Mail,
  Archive,
  AlertCircle,
  Tag,
  Paperclip,
  Reply,
  Forward,
  ChevronLeft,
  Settings as SettingsIcon
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  labels: string[];
}

export function EmailInbox() {
  const { t } = useTranslation();
  const { user } = useDashboardStore();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [isGmailConnected, setIsGmailConnected] = useState(true);

  const fetchMessages = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/gmail/messages?uid=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.messages || []);
        setIsGmailConnected(true);
      } else if (response.status === 401) {
        setIsGmailConnected(false);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user?.uid]);

  const handleRefresh = () => {
    fetchMessages();
    toast.success(t('inbox_synced', 'Inbox synced'));
  };

  const filteredEmails = emails.filter(e => 
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isGmailConnected) {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full bg-card border-border shadow-2xl rounded-3xl p-12 space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t('connect_gmail', 'Connect Gmail')}</h2>
            <p className="text-muted-foreground text-sm">
              {t('gmail_connection_required', 'To use the Inbox feature, you need to connect your Google account in Settings.')}
            </p>
          </div>
          <Button 
            className="w-full h-12 bg-primary hover:bg-primary/80 text-primary-foreground rounded-2xl font-bold"
            onClick={() => window.dispatchEvent(new CustomEvent('NAV_TAB_CHANGE', { detail: 'settings' }))}
          >
            {t('go_to_settings', 'Go to Settings')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Sidebar */}
      <div className="w-64 flex flex-col gap-2">
        <Button 
          className="w-full bg-primary hover:bg-primary/80 text-primary-foreground rounded-2xl h-12 font-bold mb-4 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
        >
          <Send className="w-4 h-4 mr-2" /> {t('compose')}
        </Button>
        
        <nav className="space-y-1">
          {[
            { id: 'inbox', label: 'inbox', icon: Inbox, count: emails.filter(e => !e.read).length },
            { id: 'starred', label: 'starred', icon: Star, count: emails.filter(e => e.starred).length },
            { id: 'sent', label: 'sent', icon: Send, count: 0 },
            { id: 'drafts', label: 'drafts', icon: Mail, count: 0 },
            { id: 'archive', label: 'archive', icon: Archive, count: 0 },
            { id: 'trash', label: 'trash', icon: Trash2, count: 0 },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveFolder(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeFolder === item.id 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {t(item.label)}
              </div>
              {item.count > 0 && (
                <span className="text-[10px] font-bold bg-primary/20 px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main List / Detail */}
      <Card className="flex-1 bg-card border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {!selectedEmail ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder={t('search_emails')} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-none rounded-xl h-10 text-sm"
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={handleRefresh} className={cn("rounded-xl", isLoading && "animate-spin")}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                {filteredEmails.map(email => (
                  <div 
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 border-b border-border/50 cursor-pointer hover:bg-white/5 transition-all group",
                      !email.read && "bg-primary/5 shadow-sm"
                    )}
                  >
                    <button className="text-muted-foreground hover:text-yellow-500 transition-colors">
                      <Star className={cn("w-4 h-4", email.starred && "fill-yellow-500 text-yellow-500")} />
                    </button>
                    <div className="flex-1 min-w-0 font-sans">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-sm truncate", !email.read ? "font-bold text-foreground" : "text-muted-foreground")}>
                          {email.from.split('<')[0]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{email.date}</span>
                      </div>
                      <p className={cn("text-xs truncate", !email.read ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {email.subject}
                      </p>
                    </div>
                  </div>
                ))}
                {filteredEmails.length === 0 && !isLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 mt-20">
                    <Mail className="w-16 h-16 mb-4" />
                    <p>{t('no_emails_found', 'No emails found')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full font-sans"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <Button variant="ghost" onClick={() => setSelectedEmail(null)} className="rounded-xl">
                  <ChevronLeft className="w-4 h-4 mr-2" /> {t('back')}
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="rounded-xl"><Archive className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                <div>
                  <h2 className="text-2xl font-bold mb-4">{selectedEmail.subject}</h2>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                        {selectedEmail.from[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{selectedEmail.from}</p>
                        <p className="text-xs text-muted-foreground">to me</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{selectedEmail.date}</span>
                  </div>
                </div>

                <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-white/5 p-6 rounded-2xl border border-border/50">
                  {selectedEmail.body}
                </div>

                <div className="pt-8 flex gap-4">
                  <Button className="rounded-xl bg-primary text-primary-foreground h-11 px-8 font-bold">
                    <Reply className="w-4 h-4 mr-2" /> {t('reply')}
                  </Button>
                  <Button variant="outline" className="rounded-xl h-11 px-8">
                    <Forward className="w-4 h-4 mr-2" /> {t('forward')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
