/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Overview } from './components/dashboard/Overview';
import { CRM } from './components/crm/CRM';
import { Kanban } from './components/kanban/Kanban';
import { ProjectManagement } from './components/projects/ProjectManagement';
import { Inventory } from './components/inventory/Inventory';
import { SocialMedia } from './components/social/SocialMedia';
import { Reporting } from './components/reporting/Reporting';
import { Calendar } from './components/calendar/Calendar';
import { Documents } from './components/documents/Documents';
import { SecurityPage } from './components/admin/SecurityPage';
import { AffiliateManagement } from './components/admin/AffiliateManagement';
import { EmailMarketing } from './components/marketing/EmailMarketing';
import { EmailInbox } from './components/marketing/EmailInbox';
import { WhatsAppChat } from './components/social/WhatsAppChat';
import { PasswordManager } from './components/passwords/PasswordManager';
import { AdminAffiliateChat } from './components/chat/AdminAffiliateChat';
import { Intelligence } from './components/intelligence/Intelligence';

import { Toaster } from '@/components/ui/sonner';
import { Settings } from './components/settings/Settings';
import { useDashboardStore } from './store';
import { Button } from '@/components/ui/button';
import { AIAssistant } from './components/ai/AIAssistant';
import { AuthScreen } from './components/auth/AuthScreen';
import { cn } from '@/lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const { theme, accentColor, fontTheme, isGlassMode, user, isAuthReady, initAuth, login, logout, userRole } = useDashboardStore();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-accent', accentColor);
    document.documentElement.setAttribute('data-font', fontTheme || 'inter');
    if (isGlassMode) {
      document.documentElement.classList.add('glass-mode');
    } else {
      document.documentElement.classList.remove('glass-mode');
    }
  }, [theme, accentColor, isGlassMode]);

  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

    if (!user) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'crm':
        return <CRM />;
      case 'kanban':
        return <Kanban />;
      case 'projects':
        return <ProjectManagement />;
      case 'inventory':
        return <Inventory />;
      case 'social':
        return <SocialMedia />;
      case 'marketing':
        return <EmailMarketing />;
      case 'inbox':
        return <EmailInbox />;
      case 'whatsapp':
        return <WhatsAppChat />;
      case 'reporting':
        return <Reporting />;
      case 'calendar':
        return <Calendar />;
      case 'documents':
        return <Documents />;
      case 'passwords':
        return <PasswordManager />;
      case 'settings':
        return <Settings />;
      case 'security':
        return <SecurityPage />;
      case 'affiliates':
        return <AffiliateManagement />;
      case 'chat':
        return <AdminAffiliateChat />;
      case 'intelligence':
        return <Intelligence />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className={cn("min-h-screen relative", isGlassMode && "glass-mode")}>
      <div className="liquid-bg dark:block hidden">
        <div className="liquid-blob" style={{ left: '10%', top: '20%' }} />
        <div className="liquid-blob" style={{ right: '15%', bottom: '20%', animationDelay: '5s' }} />
      </div>

      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </DashboardLayout>
      <AIAssistant />
      <Toaster position="top-right" />
    </div>
  );
}
