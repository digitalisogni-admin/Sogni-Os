import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Users,
  FileText,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/src/types';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/src/store';
import { useState, FormEvent } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';

export function ProjectManagement() {
  const { t } = useTranslation();
  const { projects, addProject, updateProject, deleteProject, userRole, users, leads } = useDashboardStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectProgress, setNewProjectProgress] = useState(0);
  const [editProjectProgress, setEditProjectProgress] = useState(0);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  const isAdmin = userRole === 'admin';

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const lead = leads.find(l => l.id === selectedLeadId);
    
    const projectData: Omit<Project, 'id' | 'uid'> = {
      name: formData.get('name') as string,
      client: lead ? lead.name : (formData.get('client') as string),
      status: 'Active',
      progress: newProjectProgress,
      dueDate: formData.get('dueDate') as string,
      documentation: formData.get('documentation') as string,
      leadId: selectedLeadId || undefined,
    };
    await addProject(projectData);
    setIsAddModalOpen(false);
    setNewProjectProgress(0);
    setSelectedLeadId('');
    toast.success(t('project_created'));
  };

  const handleUpdateProgress = async (id: string, progress: number) => {
    await updateProject(id, { progress });
    toast.success(t('progress_updated', { progress }));
  };

  const handleEditProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const lead = leads.find(l => l.id === selectedLeadId);

    const updates: Partial<Project> = {
      name: formData.get('name') as string,
      client: lead ? lead.name : (formData.get('client') as string),
      dueDate: formData.get('dueDate') as string,
      documentation: formData.get('documentation') as string,
      progress: editProjectProgress ?? 0,
      leadId: selectedLeadId || null,
    };
    await updateProject(editingProject.id, updates);
    setIsEditModalOpen(false);
    setEditingProject(null);
    setSelectedLeadId('');
    toast.success(t('project_updated'));
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm(t('confirm_delete_project'))) {
      await deleteProject(id);
      toast.success(t('project_deleted'));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('project_management')}</h1>
          <p className="text-muted-foreground">{t('track_tasks')}</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                <Plus className="w-4 h-4 mr-2" /> {t('new_project')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-card border-border text-foreground rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t('create_new_project')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProject} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('project_name')}</Label>
                      <Input id="name" name="name" placeholder="E-commerce Redesign" required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lead">{t('associated_contact', 'Associated Contact')}</Label>
                      <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                        <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                          <SelectValue placeholder={t('select_contact', 'Select a contact')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('no_contact', 'None (Manual)')}</SelectItem>
                          {leads.map(lead => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.name} ({lead.company})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!selectedLeadId || selectedLeadId === 'none' ? (
                      <div className="space-y-2">
                        <Label htmlFor="client">{t('contact_name')}</Label>
                        <Input id="client" name="client" placeholder="Luxury Brand Inc." required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">{t('due_date')}</Label>
                      <Input id="dueDate" name="dueDate" type="date" required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>{t('initial_progress')}</Label>
                        <span className="text-sm font-bold text-primary">{newProjectProgress}%</span>
                      </div>
                      <Slider 
                        value={[newProjectProgress]} 
                        onValueChange={(v) => setNewProjectProgress(v[0])}
                        max={100}
                        step={1}
                        className="py-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documentation">{t('project_documentation')}</Label>
                      <Textarea 
                        id="documentation" 
                        name="documentation" 
                        placeholder={t('describe_project')}
                        className="rounded-xl bg-white/5 border-none min-h-[120px] focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">{t('create_project')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-2xl rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{projects.filter(p => p.status === 'Active').length}</p>
              <p className="text-xs text-muted-foreground">{t('active_projects')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-2xl rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{projects.filter(p => p.status === 'Completed').length}</p>
              <p className="text-xs text-muted-foreground">{t('completed')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-2xl rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-xs text-muted-foreground">{t('team_members')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-2xl rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{projects.filter(p => p.progress < 20 && p.status === 'Active').length}</p>
              <p className="text-xs text-muted-foreground">{t('critical_status')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="bg-card border-border shadow-2xl rounded-2xl group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{project.name}</h3>
                    <Badge className={cn(
                      "rounded-md border-none px-2 py-0.5 text-[10px] font-bold",
                      project.status === 'Active' ? "bg-primary/10 text-primary" :
                      project.status === 'Completed' ? "bg-green-500/10 text-green-500" :
                      "bg-white/5 text-muted-foreground"
                    )}>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{project.client}</p>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                      <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => {
                          setEditingProject(project);
                          setEditProjectProgress(project.progress ?? 0);
                          setIsEditModalOpen(true);
                        }} 
                        className="gap-2 cursor-pointer"
                      >
                        <Edit className="w-4 h-4" /> {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateProgress(project.id, 100)} 
                        className="gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> {t('mark_completed')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      {isAdmin && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project.id)}
                          className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" /> {t('delete')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{t('progress')}</span>
                    <span className="text-xs font-bold text-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2 bg-white/5" indicatorClassName="bg-primary" />
                  {isAdmin && (
                    <Slider 
                      value={[project.progress]} 
                      onValueChange={(v) => handleUpdateProgress(project.id, v[0])}
                      max={100}
                      step={5}
                      className="mt-4"
                    />
                  )}
                </div>

                {project.documentation && (
                  <div className="p-4 bg-white/5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <FileText className="w-3 h-3" />
                      {t('documentation').toUpperCase()}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {project.documentation}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CalendarIcon className="w-3 h-3" />
                    <span className="text-[10px] font-bold">{project.dueDate}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary font-bold text-xs hover:bg-primary/10">
                    {t('full_report')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[800px] bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('edit_project')}</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <form onSubmit={handleEditProject} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">{t('project_name')}</Label>
                    <Input id="edit-name" name="name" defaultValue={editingProject.name} required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lead">{t('associated_contact', 'Associated Contact')}</Label>
                    <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                      <SelectTrigger className="rounded-xl bg-white/5 border-none h-11">
                        <SelectValue placeholder={t('select_contact', 'Select a contact')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('no_contact', 'None (Manual)')}</SelectItem>
                        {leads.map(lead => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.name} ({lead.company})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!selectedLeadId || selectedLeadId === 'none' ? (
                    <div className="space-y-2">
                      <Label htmlFor="edit-client">{t('contact_name')}</Label>
                      <Input id="edit-client" name="client" defaultValue={editingProject.client} required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="edit-dueDate">{t('due_date')}</Label>
                    <Input id="edit-dueDate" name="dueDate" type="date" defaultValue={editingProject.dueDate} required className="rounded-xl bg-white/5 border-none h-11 focus-visible:ring-1 focus-visible:ring-primary" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>{t('progress')}</Label>
                      <span className="text-sm font-bold text-primary">{editProjectProgress}%</span>
                    </div>
                    <Slider 
                      value={[editProjectProgress]} 
                      onValueChange={(v) => setEditProjectProgress(v[0])}
                      max={100}
                      step={1}
                      className="py-4"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-documentation">{t('project_documentation')}</Label>
                    <Textarea 
                      id="edit-documentation" 
                      name="documentation" 
                      defaultValue={editingProject.documentation}
                      placeholder={t('describe_project')}
                      className="rounded-xl bg-white/5 border-none min-h-[120px] focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)]">{t('save_changes')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
