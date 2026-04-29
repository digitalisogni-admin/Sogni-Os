import React, { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/src/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageCircle, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  Send,
  Check,
  CheckCheck,
  Clock,
  User,
  Image as ImageIcon,
  FileText,
  Mic,
  ChevronLeft,
  Settings,
  Users,
  Info,
  Trash2,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  text: string;
  time: string;
  sentByMe: boolean;
  status: 'sent' | 'delivered' | 'read';
}

export function WhatsAppChat() {
  const { t } = useTranslation();
  const { user } = useDashboardStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mockChats: Chat[] = [
      {
        id: '1',
        name: 'Luca Bianchi',
        avatar: 'https://picsum.photos/seed/luca/100/100',
        lastMessage: 'Perfetto, ci sentiamo domani per il rdv.',
        time: '11:45 AM',
        unread: 2,
        online: true
      },
      {
        id: '2',
        name: 'Elena Verdi',
        avatar: 'https://picsum.photos/seed/elena/100/100',
        lastMessage: 'Hai ricevuto il file del logo?',
        time: '10:15 AM',
        unread: 0,
        online: false
      },
      {
        id: '3',
        name: 'Nexus Agency Support',
        avatar: '/logo_sd.png',
        lastMessage: 'Il tuo account è stato verificato.',
        time: 'Yesterday',
        unread: 0,
        online: true
      }
    ];
    setChats(mockChats);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      const mockMessages: Message[] = [
        { id: '1', text: 'Ciao Luca, come va?', time: '10:00 AM', sentByMe: true, status: 'read' },
        { id: '2', text: 'Tutto bene grazie! Tu?', time: '10:05 AM', sentByMe: false, status: 'read' },
        { id: '3', text: 'Volevo confermare l\'appuntamento per domani alle 15:00.', time: '10:10 AM', sentByMe: true, status: 'read' },
        { id: '4', text: 'Perfetto, ci sentiamo domani per il rdv.', time: '11:45 AM', sentByMe: false, status: 'read' },
      ];
      setMessages(mockMessages);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sentByMe: true,
      status: 'sent'
    };

    setMessages([...messages, msg]);
    setNewMessage('');
    
    // Mock auto-reply
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
    }, 2000);
  };

  const filteredChats = chats.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const handleBulkBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Broadcast sent to all active contacts!');
    setIsBulkModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-0 bg-card border border-border shadow-2xl rounded-3xl overflow-hidden">
      {/* Chat List */}
      <div className="w-96 border-r border-border flex flex-col bg-[#0A0A0A]">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Chats</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsBulkModalOpen(true)} className="rounded-xl h-9 text-xs gap-2">
                <Users className="w-4 h-4" /> Broadcast
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="w-5 h-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('New group created')}>
                    <Users className="w-4 h-4" /> {t('new_group', 'New Group')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('All chats marked as read')}>
                    <CheckCheck className="w-4 h-4" /> {t('mark_all_read', 'Mark all as read')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Settings opened')}>
                    <Settings className="w-4 h-4" /> {t('settings', 'Settings')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search or start new chat" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-none rounded-xl h-10 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredChats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-white/5 transition-all border-b border-border/30",
                selectedChat?.id === chat.id && "bg-white/10"
              )}
            >
              <div className="relative shrink-0">
                <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover border border-border" />
                {chat.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0A0A0A] rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold truncate">{chat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-[#050505] relative">
        <AnimatePresence mode="wait">
          {selectedChat ? (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="p-4 border-b border-border bg-[#0A0A0A] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedChat(null)}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <img src={selectedChat.avatar} alt={selectedChat.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h3 className="text-sm font-bold">{selectedChat.name}</h3>
                    <p className="text-[10px] text-green-500 font-medium">{selectedChat.online ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="rounded-xl"><Video className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl"><Phone className="w-5 h-5" /></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="w-5 h-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Contact info opened')}>
                        <Info className="w-4 h-4" /> {t('contact_info', 'Contact Info')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success('Chat cleared')}>
                        <Ban className="w-4 h-4" /> {t('clear_chat', 'Clear Chat')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => toast.success('Chat deleted')}>
                        <Trash2 className="w-4 h-4" /> {t('delete_chat', 'Delete Chat')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-80"
              >
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[70%] rounded-2xl p-3 text-sm relative shadow-lg",
                      msg.sentByMe 
                        ? "ml-auto bg-primary text-primary-foreground rounded-tr-none" 
                        : "mr-auto bg-[#202329] text-foreground rounded-tl-none"
                    )}
                  >
                    <p>{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[9px] opacity-70">{msg.time}</span>
                      {msg.sentByMe && (
                        <span className="text-[9px]">
                          {msg.status === 'sent' && <Check className="w-3 h-3" />}
                          {msg.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                          {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-400" />}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-[#0A0A0A] border-t border-border flex items-center gap-4 shrink-0">
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="icon" className="rounded-xl"><Smile className="w-5 h-5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="rounded-xl"><Paperclip className="w-5 h-5" /></Button>
                </div>
                <Input 
                  placeholder="Type a message" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-white/5 border-none rounded-xl h-12 text-sm"
                />
                <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-full w-12 h-12 p-0 shadow-lg">
                  {newMessage.trim() ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              </form>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Nexus Hub WhatsApp</h2>
              <p className="text-muted-foreground max-w-sm">
                Select a chat to start messaging your clients in real-time. All conversations are synced with your WhatsApp Business account.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground rounded-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Broadcast</DialogTitle>
            <CardDescription>Send a message to all your contacts at once. Use templates to avoid being blocked.</CardDescription>
          </DialogHeader>
          <form onSubmit={handleBulkBroadcast} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message Template</Label>
              <Select defaultValue="update">
                <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">New Service Update</SelectItem>
                  <SelectItem value="offer">Special Limited Offer</SelectItem>
                  <SelectItem value="event">Upcoming Event Invitation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <textarea 
                className="w-full min-h-[100px] bg-white/5 border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-primary outline-none"
                placeholder="Write your broadcast message here..."
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl h-12 font-bold shadow-lg">
              Send Broadcast to {chats.length} Contacts
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
