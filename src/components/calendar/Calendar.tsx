import { useState, FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Trash2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useDashboardStore } from '@/src/store';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CalendarEvent } from '@/src/types';
import { useTranslation } from 'react-i18next';

export function Calendar() {
  const { t, i18n } = useTranslation();
  const { events, addEvent, updateEvent, deleteEvent, userRole, user } = useDashboardStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const isAdmin = userRole === 'admin';

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthName = currentDate.toLocaleString(i18n.language, { month: 'long' });

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  const handleDayClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(day);
    if (isAdmin) {
      setIsAddModalOpen(true);
    }
  };

  const handleAddEvent = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const eventData: Omit<CalendarEvent, 'id' | 'uid'> = {
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      type: formData.get('type') as CalendarEvent['type'],
      comments: formData.get('details') ? [{
        text: formData.get('details') as string,
        author: user?.displayName || user?.email || 'System',
        timestamp: new Date().toISOString()
      }] : []
    };
    await addEvent(eventData);
    setIsAddModalOpen(false);
    toast.success('Event scheduled successfully');
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const handleOptimizeSchedule = async () => {
    setIsOptimizing(true);
    // Simulate AI optimization
    setTimeout(() => {
      setIsOptimizing(false);
      toast.success(t('schedule_optimized', 'Schedule optimized by AI!'));
    }, 2000);
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !user) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const commentText = formData.get('comment') as string;
    
    if (!commentText.trim()) return;

    const newComment = {
      text: commentText,
      author: user.displayName || user.email || 'Unknown',
      timestamp: new Date().toISOString()
    };

    const updatedComments = [...(selectedEvent.comments || []), newComment];
    
    await updateEvent(selectedEvent.id, { comments: updatedComments });
    setSelectedEvent({ ...selectedEvent, comments: updatedComments });
    
    (e.target as HTMLFormElement).reset();
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('calendar')}</h1>
          <p className="text-muted-foreground">{t('manage_schedule')}</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl h-14 px-8 shadow-[0_0_20px_rgba(0,255,255,0.3)] text-lg">
                <Plus className="w-6 h-6 mr-2" />
                {t('add_event')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t('schedule_new_event')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEvent} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('event_title')}</Label>
                  <Input id="title" name="title" placeholder="Client Meeting" required className="rounded-xl bg-white/5 border-none h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">{t('date')}</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      defaultValue={selectedDay ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}` : ''}
                      required 
                      className="rounded-xl bg-white/5 border-none h-11" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">{t('time')}</Label>
                    <Input id="time" name="time" type="time" className="rounded-xl bg-white/5 border-none h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">{t('event_type')}</Label>
                  <select id="type" name="type" className="w-full rounded-xl bg-white/5 border-none h-11 px-3 text-sm focus-visible:ring-1 focus-visible:ring-primary outline-none">
                    <option value="Meeting">{t('meeting')}</option>
                    <option value="Call">{t('call')}</option>
                    <option value="Deadline">{t('deadline')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">{t('comments', 'Comments')}</Label>
                  <textarea 
                    id="details" 
                    name="details" 
                    className="w-full rounded-xl bg-white/5 border-none p-3 text-sm min-h-[80px] focus:ring-1 focus:ring-primary outline-none" 
                    placeholder={t('add_details', 'Add any additional details or notes...')}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold">{t('schedule_event')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card rounded-3xl border border-border p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-foreground capitalize">{monthName} {currentDate.getFullYear()}</h2>
          <div className="flex gap-4">
            <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl border-border hover:bg-white/5 w-12 h-12">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl border-border hover:bg-white/5 w-12 h-12">
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
            {padding.map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            {days.map(day => {
              const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
              const dayEvents = getEventsForDay(day);
              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "aspect-square rounded-2xl border border-border p-2 cursor-pointer transition-colors relative group",
                    isToday ? "bg-primary/5 border-primary/20" : "hover:bg-white/5",
                    selectedDay === day && "border-primary"
                  )}
                >
                  <span className={cn(
                    "text-sm font-semibold",
                    isToday ? "text-primary" : "text-foreground"
                  )}>
                    {day}
                  </span>
                  <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 justify-center">
                    {dayEvents.map((e, idx) => {
                      const Icon = e.type === 'Meeting' ? Users : e.type === 'Call' ? Phone : Clock;
                      return (
                        <div key={idx} className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center p-0.5 shadow-sm border border-white/5",
                          e.type === 'Meeting' ? "bg-primary/20 text-primary" : e.type === 'Call' ? "bg-cyan-500/20 text-cyan-500" : "bg-destructive/20 text-destructive"
                        )}>
                          <Icon className="w-3 h-3" />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-6">
          <div className="bg-card rounded-3xl border border-border p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-6 text-foreground">
              {selectedDay ? t('events_for', { date: `${monthName} ${selectedDay}` }) : t('upcoming_events')}
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
              {(selectedDay ? getEventsForDay(selectedDay) : events).map(event => (
                <div 
                  key={event.id} 
                  onClick={() => handleEventClick(event)}
                  className="flex gap-4 p-4 rounded-2xl border border-border hover:border-primary/20 transition-colors cursor-pointer group relative"
                >
                  <div className={cn(
                    "w-1 shrink-0 rounded-full",
                    event.type === 'Meeting' ? "bg-primary" : event.type === 'Call' ? "bg-cyan-500" : "bg-destructive"
                  )} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{event.title}</h4>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time || 'All Day'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[8px] px-1 py-0">{t(event.type.toLowerCase())}</Badge>
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button 
                      variant="ghost" size="icon" 
                      onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
              {(selectedDay ? getEventsForDay(selectedDay) : events).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">{t('no_events_scheduled')}</p>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 text-foreground relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">{t('ai_assistant')}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t('you_have_events', { count: events.length })}</p>
              <Button 
                onClick={handleOptimizeSchedule}
                disabled={isOptimizing}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl border-none shadow-[0_0_20px_rgba(0,255,255,0.3)]"
              >
                {isOptimizing ? t('optimizing', 'Optimizing...') : t('optimize_schedule')}
              </Button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary blur-[60px] opacity-20" />
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                selectedEvent?.type === 'Meeting' ? "bg-primary" : selectedEvent?.type === 'Call' ? "bg-cyan-500" : "bg-destructive"
              )} />
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedEvent?.date} {selectedEvent?.time && `at ${selectedEvent.time}`}
              </span>
              <Badge variant="outline">{selectedEvent?.type && t(selectedEvent.type.toLowerCase())}</Badge>
            </div>

            {selectedEvent?.details && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t('details', 'Details')}</h4>
                <p className="text-sm text-muted-foreground">{selectedEvent.details}</p>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-semibold text-sm">{t('comments', 'Comments')}</h4>
              <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
                {selectedEvent?.comments?.map((comment, idx) => (
                  <div key={idx} className="bg-white/5 p-3 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold">{comment.author}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                  </div>
                ))}
                {(!selectedEvent?.comments || selectedEvent.comments.length === 0) && (
                  <p className="text-xs text-muted-foreground italic">{t('no_comments', 'No comments yet.')}</p>
                )}
              </div>
              
              <form onSubmit={handleAddComment} className="flex gap-2 mt-4">
                <Input 
                  name="comment" 
                  placeholder={t('add_comment', 'Add a comment...')} 
                  className="flex-1 bg-white/5 border-none rounded-xl h-10 text-sm"
                />
                <Button type="submit" size="sm" className="rounded-xl h-10 px-4 bg-primary hover:bg-primary/80">
                  {t('post', 'Post')}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
