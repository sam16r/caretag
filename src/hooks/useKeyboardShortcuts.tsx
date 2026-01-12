import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  category: string;
}

export function useKeyboardShortcuts(openHelpModal: () => void) {
  const navigate = useNavigate();

  const shortcuts: ShortcutAction[] = [
    // Navigation
    { key: 'd', ctrlKey: true, description: 'Go to Dashboard', action: () => navigate('/'), category: 'Navigation' },
    { key: 'p', ctrlKey: true, description: 'Go to Patients', action: () => navigate('/patients'), category: 'Navigation' },
    { key: 'a', ctrlKey: true, description: 'Go to Appointments', action: () => navigate('/appointments'), category: 'Navigation' },
    { key: 'e', ctrlKey: true, description: 'Go to Emergency', action: () => navigate('/emergency'), category: 'Navigation' },
    { key: 'r', ctrlKey: true, description: 'Go to Records', action: () => navigate('/records'), category: 'Navigation' },
    { key: 'm', ctrlKey: true, description: 'Go to Prescriptions', action: () => navigate('/prescriptions'), category: 'Navigation' },
    
    // Quick Actions
    { key: 'n', ctrlKey: true, shiftKey: true, description: 'New Patient', action: () => navigate('/patients?action=new'), category: 'Quick Actions' },
    { key: 's', ctrlKey: true, description: 'Search Patients', action: () => document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus(), category: 'Quick Actions' },
    { key: 'q', ctrlKey: true, description: 'Scan CareTag', action: () => navigate('/patients?scan=true'), category: 'Quick Actions' },
    
    // Help
    { key: '/', ctrlKey: true, description: 'Show Keyboard Shortcuts', action: openHelpModal, category: 'Help' },
    { key: '?', shiftKey: true, description: 'Show Keyboard Shortcuts', action: openHelpModal, category: 'Help' },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape key to blur inputs
      if (event.key === 'Escape') {
        target.blur();
      }
      return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
      
      if (event.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

export function getShortcutDisplay(shortcut: { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }): string {
  const parts: string[] = [];
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (shortcut.ctrlKey) parts.push(isMac ? '⌘' : 'Ctrl');
  if (shortcut.shiftKey) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt');
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(isMac ? '' : '+');
}
