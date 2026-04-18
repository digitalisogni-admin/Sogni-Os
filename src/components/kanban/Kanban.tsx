import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Lead, LeadStatus } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MoreVertical, 
  DollarSign, 
  Calendar,
  Edit,
  Trash2,
  ExternalLink,
  ArrowRight,
  Globe
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/src/store';

const columns: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed'];

export function Kanban() {
  const { t } = useTranslation();
  const { leads, updateLeadStatus, updateLead, deleteLead, userRole } = useDashboardStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const isAdmin = userRole === 'admin';

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    updateLeadStatus(draggableId, destination.droppableId as LeadStatus);
  };

  const handleEditLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const updates: Partial<Lead> = {
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      value: isAdmin ? Number(formData.get('value')) : editingLead.value,
    };
    updateLead(editingLead.id, updates);
    setIsEditModalOpen(false);
    setEditingLead(null);
    toast.success(t('lead_updated'));
  };

  const handleDeleteLead = (id: string) => {
    if (confirm(t('confirm_delete_lead'))) {
      deleteLead(id);
      toast.success(t('lead_deleted'));
    }
  };

  const moveLeadNext = (lead: Lead) => {
    const currentIndex = columns.indexOf(lead.status);
    if (currentIndex < columns.length - 1) {
      updateLeadStatus(lead.id, columns[currentIndex + 1]);
      toast.success(t('lead_moved_to', { status: columns[currentIndex + 1] }));
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Pipeline</h1>
          <p className="text-muted-foreground">Qualify and manage your sales leads with drag and drop</p>
        </div>
        <Button className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.3)]">
          <Plus className="w-4 h-4 mr-2" /> New Lead
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6 flex-1 min-h-0 no-scrollbar">
          {columns.map((column) => (
            <div key={column} className="flex flex-col min-w-[300px] w-[300px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">{column}</h3>
                  <Badge variant="secondary" className="bg-white/5 text-muted-foreground rounded-md font-bold border-none">
                    {leads.filter(l => l.status === column).length}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success(`Sorting ${column}`)}>
                      <ArrowRight className="w-4 h-4" /> {t('sort_by', 'Sort by')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.success(`Clearing ${column}`)}>
                      <Trash2 className="w-4 h-4" /> {t('clear_column', 'Clear Column')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Droppable droppableId={column}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "flex-1 rounded-2xl p-2 transition-colors space-y-4 min-h-[200px]",
                      snapshot.isDraggingOver ? "bg-primary/5" : "bg-white/5"
                    )}
                  >
                    {leads
                      .filter((lead) => lead.status === column)
                      .map((lead, index) => (
                        // @ts-expect-error - library type mismatch with React 19
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-card border-border shadow-sm rounded-xl transition-all",
                                snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/20" : "hover:shadow-md"
                              )}
                            >
                              <CardContent className="p-4 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8 border border-border">
                                      <AvatarImage src={lead.avatar} />
                                      <AvatarFallback>{lead.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-bold text-foreground">{lead.name}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <p className="text-[10px] text-muted-foreground">{lead.company}</p>
                                        {lead.source === 'Website' && (
                                          <Globe className="w-2.5 h-2.5 text-primary" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                                      <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                      <DropdownMenuItem 
                                        onClick={() => moveLeadNext(lead)} 
                                        disabled={lead.status === 'Closed'}
                                        className="gap-2 cursor-pointer"
                                      >
                                        <ArrowRight className="w-4 h-4" /> {t('move_next')}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setEditingLead(lead);
                                          setIsEditModalOpen(true);
                                        }} 
                                        className="gap-2 cursor-pointer"
                                      >
                                        <Edit className="w-4 h-4" /> {t('edit')}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-border" />
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteLead(lead.id)}
                                        className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                      >
                                        <Trash2 className="w-4 h-4" /> {t('delete')}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                  {isAdmin && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <DollarSign className="w-3 h-3" />
                                      <span className="text-xs font-bold text-foreground">
                                        {lead.value.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    <span className="text-[10px] font-medium">
                                      {lead.lastContacted}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('edit_lead')}</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <form onSubmit={handleEditLead} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('full_name')}</Label>
                <Input id="edit-name" name="name" defaultValue={editingLead.name} required className="rounded-xl bg-white/5 border-none h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">{t('company_name')}</Label>
                <Input id="edit-company" name="company" defaultValue={editingLead.company} required className="rounded-xl bg-white/5 border-none h-11" />
              </div>
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="edit-value">{t('estimated_value')} (€)</Label>
                  <Input id="edit-value" name="value" type="number" defaultValue={editingLead.value} required className="rounded-xl bg-white/5 border-none h-11" />
                </div>
              )}
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold">{t('save_changes')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
