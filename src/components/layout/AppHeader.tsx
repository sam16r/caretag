import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Search, ScanLine, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
    { id: 1, title: 'Critical Alert', message: 'Patient vitals below threshold', type: 'emergency' },
    { id: 2, title: 'Appointment', message: 'Dr. appointment in 15 minutes', type: 'info' },
    { id: 3, title: 'Lab Results', message: 'New lab results available', type: 'success' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
      <SidebarTrigger className="-ml-1 h-8 w-8" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-transparent focus:border-border focus:bg-background text-sm"
          />
        </div>
      </form>

      {/* Quick scan button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/patients?scan=true')}
        className="gap-1.5 hidden md:flex h-9 text-sm"
      >
        <ScanLine className="h-4 w-4" />
        Scan
      </Button>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-emergency border-2 border-card">
              3
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-1.5">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Notifications</p>
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-0.5 p-2.5 cursor-pointer rounded-md"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    notification.type === 'emergency'
                      ? 'bg-emergency'
                      : notification.type === 'success'
                      ? 'bg-success'
                      : 'bg-primary'
                  }`}
                />
                <span className="font-medium text-sm">{notification.title}</span>
              </div>
              <span className="text-xs text-muted-foreground pl-3.5">
                {notification.message}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Keyboard shortcuts */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShortcutsOpen(true)}
        className="h-9 w-9 hidden md:flex"
        title="Keyboard Shortcuts"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="h-9 w-9"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={shortcuts}
      />
    </header>
  );
}
