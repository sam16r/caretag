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
  const [searchQuery, setSearchQuery] = useState('');

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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur-md px-6">
      <SidebarTrigger className="-ml-2 hover:bg-muted" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search patients by name, CareTag ID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-10 bg-muted/50 border-transparent hover:border-border focus:border-primary focus:bg-background transition-all rounded-xl"
          />
        </div>
      </form>

      {/* Quick scan button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/patients?scan=true')}
        className="gap-2 hidden md:flex rounded-xl h-10 px-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <ScanLine className="h-4 w-4" />
        Scan CareTag
      </Button>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-muted">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 p-0 flex items-center justify-center text-xs bg-emergency border-2 border-background shadow-sm">
              3
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-2 rounded-xl shadow-xl border-border/50">
          <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">Notifications</p>
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg focus:bg-muted"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    notification.type === 'emergency'
                      ? 'bg-emergency'
                      : notification.type === 'success'
                      ? 'bg-success'
                      : 'bg-primary'
                  }`}
                />
                <span className="font-semibold text-sm">{notification.title}</span>
              </div>
              <span className="text-sm text-muted-foreground pl-4">
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
        className="h-10 w-10 rounded-xl hover:bg-muted hidden md:flex"
        title="Keyboard Shortcuts (Ctrl+/)"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="h-10 w-10 rounded-xl hover:bg-muted"
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
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
