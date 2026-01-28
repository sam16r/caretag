import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Search, ScanLine, Command, Sparkles } from 'lucide-react';
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
    { id: 1, title: 'Critical Alert', message: 'Patient vitals below threshold', type: 'emergency', time: '2m ago', emoji: '🚨' },
    { id: 2, title: 'Appointment', message: 'Upcoming appointment in 15 minutes', type: 'info', time: '10m ago', emoji: '📅' },
    { id: 3, title: 'Lab Results', message: 'New lab results available', type: 'success', time: '1h ago', emoji: '🔬' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-xl px-4 lg:px-6">
      <SidebarTrigger className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" />

      {/* Divider */}
      <div className="h-6 w-px bg-border hidden md:block" />

      {/* Search - Playful */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search patients... 🔍"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-24 h-11 bg-secondary border-2 border-transparent rounded-2xl text-sm font-medium placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/50 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <kbd className="px-2 py-1 rounded-lg bg-background border border-border font-bold">⌘</kbd>
            <kbd className="px-2 py-1 rounded-lg bg-background border border-border font-bold">K</kbd>
          </div>
        </div>
      </form>

      {/* Actions - Playful */}
      <div className="flex items-center gap-2">
        {/* Scan Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/scan')}
          className="gap-2 hidden lg:flex rounded-full px-4 border-2 hover:border-primary/50"
        >
          <ScanLine className="h-4 w-4" />
          <span className="font-semibold">Scan</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-2xl hover:bg-secondary">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 rounded-3xl overflow-hidden border-2">
            <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
              <div className="flex items-center justify-between">
                <h4 className="font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Notifications
                </h4>
                <Badge className="bg-primary/20 text-primary border-0 font-bold">3 new</Badge>
              </div>
            </div>
            <div className="py-2">
              {notifications.map((notification, i) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-xl mt-0.5">{notification.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">{notification.time}</span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2">
              <Button variant="ghost" className="w-full rounded-2xl text-primary hover:text-primary hover:bg-primary/5 font-bold">
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
          className="rounded-2xl hidden md:flex hover:bg-secondary"
        >
          <Command className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-2xl hover:bg-secondary"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
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
