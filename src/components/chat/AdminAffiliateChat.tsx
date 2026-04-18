import { FormEvent, useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '@/src/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Send, User, Search, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '@/src/types';

export function AdminAffiliateChat() {
  const { t } = useTranslation();
  const { userRole, user, chatMessages, sendMessage, users } = useDashboardStore();
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>((userRole === 'admin' || userRole === 'superadmin') ? null : 'admin');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  // Filter messages for the selected conversation
  const currentMessages = chatMessages.filter(msg => {
    if (!selectedUserId || !user) return false;
    if (isAdmin) {
      // Admin sees messages between them and the selected affiliate
      return (msg.senderId === user.uid && msg.recipientId === selectedUserId) ||
             (msg.senderId === selectedUserId && msg.recipientId === user.uid);
    } else {
      // Affiliate sees messages between them and admin
      return (msg.senderId === user.uid && msg.recipientId === 'admin') ||
             (msg.senderId === 'admin' && msg.recipientId === user.uid);
    }
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const affiliates = users.filter(u => u.role === 'affiliate');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user) return;

    const message: Omit<ChatMessage, 'id'> = {
      senderId: user.uid,
      senderName: user.displayName || user.email || 'User',
      recipientId: selectedUserId,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    await sendMessage(message);
    setNewMessage('');
  };

  const selectedUser = isAdmin 
    ? affiliates.find(a => a.id === selectedUserId)
    : { name: t('admin_support'), avatar: null };

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Sidebar for Admins */}
      {isAdmin && (
        <Card className="w-80 bg-card border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t('search_affiliates')} 
                className="pl-10 bg-white/5 border-none h-10 rounded-xl text-xs"
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {affiliates.map((aff) => (
                <button
                  key={aff.id}
                  onClick={() => setSelectedUserId(aff.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all",
                    selectedUserId === aff.id ? "bg-primary text-primary-foreground" : "hover:bg-white/5"
                  )}
                >
                  <Avatar className="w-10 h-10 border border-border/50">
                    <AvatarImage src={aff.avatar} />
                    <AvatarFallback>{aff.name?.[0] || aff.email?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-bold">{aff.name || aff.email}</p>
                    <p className={cn("text-[10px]", selectedUserId === aff.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {aff.role}
                    </p>
                  </div>
                </button>
              ))}
              {affiliates.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  {t('no_affiliates_found', 'No affiliates found.')}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Chat Area */}
      <Card className="flex-1 bg-card border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col">
        {selectedUserId ? (
          <>
            <CardHeader className="p-4 border-b border-border flex flex-row items-center gap-4">
              <Avatar className="w-10 h-10 border border-border/50">
                <AvatarImage src={selectedUser?.avatar} />
                <AvatarFallback>
                  {selectedUser?.name?.[0] || 'S'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm font-bold">
                  {selectedUser?.name || t('admin_support')}
                </CardTitle>
                <p className="text-[10px] text-green-500 font-bold">{t('online', 'Online')}</p>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
                <div className="space-y-4">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        msg.senderId === user?.uid
                          ? "ml-auto items-end"
                          : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "p-4 rounded-2xl text-sm",
                          msg.senderId === user?.uid
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-white/5 text-foreground rounded-tl-none border border-border/50"
                        )}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {currentMessages.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-sm">{t('no_messages_yet', 'No messages yet. Start the conversation!')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border bg-white/5">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('type_message')}
                    className="flex-1 bg-white/5 border-none h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <Button type="submit" size="icon" className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-medium">{t('select_chat_to_start')}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
