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
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const doctorNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Patient Search', url: '/patients', icon: Search },
  { title: 'Appointments', url: '/appointments', icon: Calendar },
  { title: 'Emergency', url: '/emergency', icon: AlertTriangle },
  { title: 'Medical Records', url: '/records', icon: FileText },
  { title: 'Prescriptions', url: '/prescriptions', icon: Pill },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Devices', url: '/devices', icon: Smartphone },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const adminNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Patient Search', url: '/patients', icon: Search },
  { title: 'Appointments', url: '/appointments', icon: Calendar },
  { title: 'Emergency', url: '/emergency', icon: AlertTriangle },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
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
    <Sidebar collapsible="icon" className="border-r-0 shadow-xl">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-lg shadow-sidebar-primary/30 flex-shrink-0">
            <Activity className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground tracking-tight">CareTag</span>
              <span className="text-xs text-sidebar-foreground/50 capitalize font-medium">{role || 'User'} Portal</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
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
                        'transition-all duration-200 rounded-xl h-11',
                        isActive && !isEmergency && 'bg-sidebar-primary/15 text-sidebar-primary shadow-sm',
                        isEmergency && 'text-emergency hover:text-emergency',
                        isActive && isEmergency && 'bg-emergency/15 text-emergency',
                        !isActive && !isEmergency && 'hover:bg-sidebar-accent/60'
                      )}
                    >
                      <button
                        onClick={() => navigate(item.url)}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className={cn(
                          'h-5 w-5 transition-colors',
                          isEmergency && 'text-emergency',
                          isActive && !isEmergency && 'text-sidebar-primary'
                        )} />
                        <span className="font-medium">{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <div className={cn(
          'flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/40',
          collapsed && 'justify-center p-2'
        )}>
          <Avatar className="h-9 w-9 ring-2 ring-sidebar-border">
            <AvatarFallback className="bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground text-sm font-semibold">
              {getInitials(user?.email || '')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground truncate">
                {user?.email?.split('@')[0]}
              </span>
              <span className="text-xs text-sidebar-foreground/50 capitalize font-medium">
                {role || 'User'}
              </span>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
