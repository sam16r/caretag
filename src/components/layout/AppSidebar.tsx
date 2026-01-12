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
  ChevronRight,
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Logo Section */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm flex-shrink-0">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-semibold text-sidebar-foreground tracking-tight">CareTag</span>
              <span className="text-xs text-muted-foreground">Healthcare Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 py-2">
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Menu
            </p>
          )}
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
                        'group relative transition-all duration-200 rounded-lg h-10',
                        isActive && !isEmergency && 'bg-sidebar-accent text-sidebar-accent-foreground',
                        isEmergency && 'text-destructive hover:text-destructive',
                        isActive && isEmergency && 'bg-destructive/10 text-destructive',
                        !isActive && !isEmergency && 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )}
                    >
                      <button
                        onClick={() => navigate(item.url)}
                        className="flex items-center gap-3 w-full px-3"
                      >
                        <item.icon className={cn(
                          'h-[18px] w-[18px] flex-shrink-0',
                          isEmergency && 'text-destructive',
                          isActive && !isEmergency && 'text-primary'
                        )} />
                        <span className="text-[13px] font-medium flex-1">{item.title}</span>
                        {isActive && !collapsed && (
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Section */}
      <SidebarFooter className="p-3">
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border transition-colors hover:bg-sidebar-accent',
          collapsed && 'justify-center p-2'
        )}>
          <Avatar className="h-9 w-9 ring-2 ring-background">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials(user?.email || '')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.email?.split('@')[0]}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {role || 'User'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
