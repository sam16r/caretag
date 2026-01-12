import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Search, ScanLine, Keyboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/shortcuts/KeyboardShortcutsModal';

export function AppHeader() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const shortcuts = useKeyboardShortcuts(() => setShortcutsOpen(true));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patients?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const notifications = [
    { id: 1, title: 'Critical Alert', message: 'Patient vitals below threshold', type: 'emergency', time: '2m ago' },
    { id: 2, title: 'Appointment', message: 'Dr. appointment in 15 minutes', type: 'info', time: '10m ago' },
    { id: 3, title: 'Lab Results', message: 'New lab results available', type: 'success', time: '1h ago' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-xl px-4 lg:px-6">
      <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:text-foreground" />

      {/* Divider */}
      <div className="h-6 w-px bg-border hidden md:block" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search patients, records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-secondary/50 border-transparent rounded-xl text-sm placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </form>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Scan Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/patients?scan=true')}
          className="gap-2 hidden lg:flex h-9 rounded-lg border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <ScanLine className="h-4 w-4 text-primary" />
          <span className="text-sm">Scan CareTag</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-secondary">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Notifications</h4>
                <Badge variant="secondary" className="text-xs">3 new</Badge>
              </div>
            </div>
            <div className="py-2">
              {notifications.map((notification, idx) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer focus:bg-secondary/50"
                >
                  <div
                    className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                      notification.type === 'emergency'
                        ? 'bg-destructive'
                        : notification.type === 'success'
                        ? 'bg-success'
                        : 'bg-primary'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">{notification.time}</span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" className="w-full h-9 text-sm text-primary hover:text-primary hover:bg-primary/5">
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Keyboard Shortcuts */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShortcutsOpen(true)}
          className="h-10 w-10 rounded-xl hidden md:flex hover:bg-secondary"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="h-[18px] w-[18px]" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-10 w-10 rounded-xl hover:bg-secondary"
        >
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </Button>
      </div>

      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={shortcuts}
      />
    </header>
  );
}
