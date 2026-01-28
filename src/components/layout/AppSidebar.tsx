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
  PieChart,
  Sparkles,
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
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, emoji: '🏠' },
  { title: 'Patients', url: '/patients', icon: Search, emoji: '👥' },
  { title: 'Appointments', url: '/appointments', icon: Calendar, emoji: '📅' },
  { title: 'Emergency', url: '/emergency', icon: AlertTriangle, emoji: '🚨' },
  { title: 'Records', url: '/records', icon: FileText, emoji: '📋' },
  { title: 'Prescriptions', url: '/prescriptions', icon: Pill, emoji: '💊' },
  { title: 'Analytics', url: '/analytics', icon: PieChart, emoji: '📊' },
  { title: 'Reports', url: '/reports', icon: BarChart3, emoji: '📈' },
  { title: 'Devices', url: '/devices', icon: Smartphone, emoji: '📱' },
  { title: 'Settings', url: '/settings', icon: Settings, emoji: '⚙️' },
];

const adminNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, emoji: '🏠' },
  { title: 'Patients', url: '/patients', icon: Search, emoji: '👥' },
  { title: 'Appointments', url: '/appointments', icon: Calendar, emoji: '📅' },
  { title: 'Emergency', url: '/emergency', icon: AlertTriangle, emoji: '🚨' },
  { title: 'Analytics', url: '/analytics', icon: PieChart, emoji: '📊' },
  { title: 'Reports', url: '/reports', icon: BarChart3, emoji: '📈' },
  { title: 'Settings', url: '/settings', icon: Settings, emoji: '⚙️' },
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
      {/* Logo - Playful */}
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent flex-shrink-0 shadow-lg hover:scale-105 transition-transform">
            <Activity className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-sidebar-foreground flex items-center gap-1">
                CareTag <Sparkles className="h-4 w-4 text-primary" />
              </span>
              <span className="text-[11px] text-sidebar-foreground/50 font-medium">Healthcare Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation - Playful */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 mb-3 text-[11px] font-bold text-sidebar-foreground/40 uppercase tracking-wider">
              Menu
            </p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.url;
                const isEmergency = item.title === 'Emergency';
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        'group transition-all duration-200 rounded-2xl h-11',
                        isActive && !isEmergency && 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary hover:text-primary-foreground',
                        isEmergency && !isActive && 'text-destructive hover:text-destructive hover:bg-destructive/10',
                        isActive && isEmergency && 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30 hover:bg-destructive',
                        !isActive && !isEmergency && 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <button
                        onClick={() => navigate(item.url)}
                        className="flex items-center gap-3 w-full px-3"
                      >
                        {collapsed ? (
                          <item.icon className={cn(
                            "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                            "group-hover:scale-110"
                          )} />
                        ) : (
                          <span className="text-base">{item.emoji}</span>
                        )}
                        <span className="text-sm font-semibold">{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Section - Playful */}
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-2xl hover:bg-sidebar-accent transition-all duration-200',
          collapsed && 'justify-center'
        )}>
          <Avatar className="h-10 w-10 ring-2 ring-primary/30">
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-bold">
              {getInitials(user?.email || '')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-sm font-bold text-sidebar-foreground truncate">
                  {user?.email?.split('@')[0]}
                </span>
                <span className="text-[11px] text-sidebar-foreground/50 font-medium capitalize flex items-center gap-1">
                  {role === 'admin' ? '👑' : '🩺'} {role || 'User'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 hover:scale-105"
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
