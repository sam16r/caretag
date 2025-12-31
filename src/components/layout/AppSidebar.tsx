import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Search,
  Calendar,
  AlertTriangle,
  FileText,
  Pill,
  BarChart3,
  Smartphone,
  Settings,
  LogOut,
  Activity,
  ChevronLeft,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const doctorNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Patient Search', url: '/patients', icon: Search },
  { title: 'OPD / Appointments', url: '/appointments', icon: Calendar },
  { title: 'Emergency', url: '/emergency', icon: AlertTriangle },
  { title: 'Medical Records', url: '/records', icon: FileText },
  { title: 'Prescriptions', url: '/prescriptions', icon: Pill },
  { title: 'Reports & Analytics', url: '/reports', icon: BarChart3 },
  { title: 'Devices & Wearables', url: '/devices', icon: Smartphone },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const adminNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Patient Search', url: '/patients', icon: Search },
  { title: 'OPD / Appointments', url: '/appointments', icon: Calendar },
  { title: 'Emergency', url: '/emergency', icon: AlertTriangle },
  { title: 'Reports & Analytics', url: '/reports', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const navItems = role === 'admin' ? adminNavItems : doctorNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (email: string) => {
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary flex-shrink-0">
            <Activity className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">CareTag</span>
              <span className="text-xs text-sidebar-foreground/60 capitalize">{role || 'User'}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                const isEmergency = item.title === 'Emergency';
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        'transition-colors',
                        isEmergency && 'text-emergency hover:text-emergency hover:bg-emergency/10',
                        isActive && isEmergency && 'bg-emergency/10'
                      )}
                    >
                      <button
                        onClick={() => navigate(item.url)}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className={cn('h-5 w-5', isEmergency && 'text-emergency')} />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm">
              {getInitials(user?.email || '')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 flex-col min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email}
              </span>
              <span className="text-xs text-sidebar-foreground/60 capitalize">
                {role || 'User'}
              </span>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
