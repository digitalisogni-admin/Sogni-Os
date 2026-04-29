import { FileText, Folder, MoreVertical, Plus, Search, Download, Share2, Trash2, Clock, HardDrive, Upload, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useDashboardStore } from '@/src/store';
import React, { useState, useRef, useEffect } from 'react';
// removed firebase imports
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface DocumentFile {
  id: string;
  name: string;
  size: string;
  url: string;
  type: string;
  createdAt: string;
  uid: string;
  storagePath?: string;
  folderId?: string;
}

interface DocumentFolder {
  id: string;
  name: string;
  color?: string;
  uid: string;
  createdAt: string;
}

export function Documents() {
  const { t } = useTranslation();
  const { user, userRole } = useDashboardStore();
  const isAdmin = userRole === 'admin';
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('text-primary');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setFiles([
      {
        id: '1',
        name: 'Project_Proposal_Final.pdf',
        size: '2.4 MB',
        url: '#',
        type: 'pdf',
        createdAt: new Date().toISOString(),
        uid: user.uid,
        folderId: '1'
      }
    ]);
    setFolders([
      {
        id: '1',
        name: 'Proposals',
        color: 'text-primary',
        uid: user.uid,
        createdAt: new Date().toISOString()
      }
    ]);
  }, [user]);

  const handleCreateOrUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingFolder) {
      setFolders(prev => prev.map(f => f.id === editingFolder.id ? { ...f, name: folderName, color: folderColor } : f));
      toast.success(t('folder_updated'));
    } else {
      setFolders(prev => [...prev, {
        id: Math.random().toString(),
        name: folderName,
        color: folderColor,
        uid: user.uid,
        createdAt: new Date().toISOString()
      }]);
      toast.success(t('folder_created'));
    }
    setIsFolderModalOpen(false);
    setEditingFolder(null);
    setFolderName('');
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm(t('confirm_delete_folder'))) return;
    setFolders(prev => prev.filter(f => f.id !== id));
    toast.success(t('folder_deleted'));
  };

  const openEditFolder = (folder: DocumentFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color || 'text-primary');
    setIsFolderModalOpen(true);
  };

  const openCreateFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderColor('text-primary');
    setIsFolderModalOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setTimeout(() => {
      setFiles(prev => [...prev, {
        id: Math.random().toString(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        url: '#',
        type: file.type.split('/')[1] || 'file',
        createdAt: new Date().toISOString(),
        uid: user.uid
      }]);
      toast.success('File uploaded successfully');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  const handleDelete = async (file: DocumentFile) => {
    if (!confirm(t('confirm_delete_file'))) return;
    setFiles(prev => prev.filter(f => f.id !== file.id));
    toast.success(t('file_deleted'));
  };

  const totalStorageUsed = files.reduce((sum, file) => {
    const sizeMatch = file.size.match(/([\d.]+)\s*(MB|GB|KB)/i);
    if (!sizeMatch) return sum;
    const value = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toUpperCase();
    if (unit === 'GB') return sum + value;
    if (unit === 'MB') return sum + value / 1024;
    if (unit === 'KB') return sum + value / (1024 * 1024);
    return sum;
  }, 0);

  const storageLimit = 50; // GB
  const storagePercentage = Math.min((totalStorageUsed / storageLimit) * 100, 100);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('documents')}</h1>
          <p className="text-muted-foreground">{t('manage_documents')}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUpload} 
              className="hidden" 
            />
            <Button variant="outline" onClick={openCreateFolder} className="rounded-xl border-border hover:bg-white/5">
              <Folder className="w-4 h-4 mr-2" />
              {t('new_folder')}
            </Button>
            <Button 
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl px-6 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            >
              {isUploading ? (
                <Upload className="w-4 h-4 mr-2 animate-bounce" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {isUploading ? t('uploading') : t('upload_file')}
            </Button>
          </div>
        )}
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-3xl border border-border p-6 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('total_storage', 'Total Storage')}</p>
              <p className="text-lg font-bold text-foreground">{totalStorageUsed.toFixed(2)} GB / {storageLimit} GB</p>
            </div>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${storagePercentage}%` }} />
          </div>
        </div>
        {folders.map(folder => (
          <motion.div
            key={folder.id}
            whileHover={{ y: -4 }}
            className="bg-card rounded-3xl border border-border p-6 shadow-2xl cursor-pointer group hover:border-primary/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <Folder className={cn("w-8 h-8", folder.color || 'text-primary')} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border text-foreground rounded-xl shadow-2xl">
                  <DropdownMenuItem onClick={() => openEditFolder(folder)} className="gap-2 cursor-pointer">
                    <Edit className="w-4 h-4" /> {t('edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="w-4 h-4" /> {t('delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{folder.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{files.filter(f => f.folderId === folder.id).length} {t('files')}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Files */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{t('recent_files')}</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={t('search_files')} 
              className="pl-10 bg-white/5 border-none rounded-xl h-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="px-6 py-4">{t('file_name')}</th>
                <th className="px-6 py-4">{t('size')}</th>
                <th className="px-6 py-4">{t('last_modified')}</th>
                <th className="px-6 py-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{file.size}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(file.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" size="icon" className="rounded-lg hover:bg-white/10"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-lg hover:bg-white/10">
                        <Share2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button 
                        variant="ghost" size="icon" className="rounded-lg hover:bg-white/10 hover:text-destructive"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    {t('no_documents_found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingFolder ? t('edit_folder') : t('new_folder')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdateFolder} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">{t('folder_name')}</Label>
              <Input 
                id="folderName" 
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                required 
                className="rounded-xl bg-white/5 border-none h-11" 
              />
            </div>
            <div className="space-y-2">
              <Label>{t('folder_color')}</Label>
              <div className="flex gap-2">
                {['text-primary', 'text-purple-500', 'text-orange-500', 'text-emerald-500', 'text-blue-500', 'text-pink-500'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFolderColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      color.replace('text-', 'bg-') + '/20',
                      folderColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                    )}
                  >
                    <Folder className={cn("w-4 h-4", color)} />
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl w-full h-11 font-bold">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
