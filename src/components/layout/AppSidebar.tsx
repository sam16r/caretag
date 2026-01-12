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
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarHeader className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary flex-shrink-0">
            <Activity className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">CareTag</span>
              <span className="text-xs text-muted-foreground capitalize">{role || 'User'}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
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
                        'transition-colors duration-100 rounded-lg h-9',
                        isActive && !isEmergency && 'bg-primary/8 text-primary font-medium',
                        isEmergency && 'text-emergency hover:text-emergency',
                        isActive && isEmergency && 'bg-emergency/8 text-emergency font-medium',
                        !isActive && !isEmergency && 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <button
                        onClick={() => navigate(item.url)}
                        className="flex items-center gap-2.5 w-full"
                      >
                        <item.icon className={cn(
                          'h-4 w-4',
                          isEmergency && 'text-emergency',
                          isActive && !isEmergency && 'text-primary'
                        )} />
                        <span className="text-sm">{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <div className={cn(
          'flex items-center gap-2.5 p-2 rounded-lg bg-muted/50',
          collapsed && 'justify-center p-1.5'
        )}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-medium">
              {getInitials(user?.email || '')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">
                {user?.email?.split('@')[0]}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {role || 'User'}
              </span>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
