import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Search, ScanLine, Keyboard, Command } from 'lucide-react';
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
    { id: 2, title: 'Appointment', message: 'Upcoming appointment in 15 minutes', type: 'info', time: '10m ago' },
    { id: 3, title: 'Lab Results', message: 'New lab results available', type: 'success', time: '1h ago' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground" />

      {/* Divider */}
      <div className="h-5 w-px bg-border hidden md:block" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-20 h-9 bg-secondary border-0 rounded-md text-sm placeholder:text-muted-foreground/60 focus:bg-background focus:ring-1 focus:ring-primary"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
            <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-medium">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-medium">K</kbd>
          </div>
        </div>
      </form>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Scan Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/scan')}
          className="gap-2 hidden lg:flex h-8 px-3 text-muted-foreground hover:text-foreground"
        >
          <ScanLine className="h-4 w-4" />
          <span className="text-sm">Scan</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-secondary/50 border-b border-border">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Notifications</h4>
                <Badge variant="secondary" className="text-[10px] h-5">3 new</Badge>
              </div>
            </div>
            <div className="py-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer"
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
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{notification.time}</span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2">
              <Button variant="ghost" className="w-full h-8 text-xs text-primary hover:text-primary hover:bg-primary/5">
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
          className="h-8 w-8 hidden md:flex"
        >
          <Command className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
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
