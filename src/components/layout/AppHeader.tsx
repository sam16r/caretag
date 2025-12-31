import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Search, ScanLine } from 'lucide-react';
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

export function AppHeader() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-6">
      <SidebarTrigger className="-ml-2" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients by name, CareTag ID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 bg-muted/50"
          />
        </div>
      </form>

      {/* Quick scan button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/patients?scan=true')}
        className="gap-2 hidden md:flex"
      >
        <ScanLine className="h-4 w-4" />
        Scan CareTag
      </Button>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-emergency">
              3
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
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
                <span className="font-medium">{notification.title}</span>
              </div>
              <span className="text-sm text-muted-foreground pl-4">
                {notification.message}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
    </header>
  );
}
