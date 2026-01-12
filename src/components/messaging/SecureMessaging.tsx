import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { MessageSquare, Send, Plus, Mail, MailOpen, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export function SecureMessaging() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [composeData, setComposeData] = useState({ recipient_id: '', subject: '', content: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch profiles for recipient selection
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, specialization')
        .neq('id', user?.id)
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Group messages by conversation
  const conversations = messages?.reduce((acc, msg) => {
    const otherId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;
    if (!acc[otherId]) {
      acc[otherId] = [];
    }
    acc[otherId].push(msg);
    return acc;
  }, {} as Record<string, typeof messages>);

  // Get latest message per conversation
  const conversationList = Object.entries(conversations || {}).map(([recipientId, msgs]) => ({
    recipientId,
    latestMessage: msgs[0],
    unreadCount: msgs.filter(m => m.recipient_id === user?.id && !m.is_read).length
  })).sort((a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime());

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        toast.info('New message received');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (data: { recipient_id: string; subject: string; content: string }) => {
      const { error } = await supabase.from('messages').insert({
        sender_id: user?.id,
        recipient_id: data.recipient_id,
        subject: data.subject,
        content: data.content
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setIsComposeOpen(false);
      setComposeData({ recipient_id: '', subject: '', content: '' });
      setNewMessage('');
      toast.success('Message sent');
    },
    onError: () => toast.error('Failed to send message')
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] })
  });

  // Get conversation messages
  const selectedMessages = selectedConversation 
    ? conversations?.[selectedConversation]?.slice().reverse() 
    : [];

  // Mark unread messages as read when viewing
  useEffect(() => {
    if (selectedConversation && selectedMessages) {
      selectedMessages
        .filter(m => m.recipient_id === user?.id && !m.is_read)
        .forEach(m => markReadMutation.mutate(m.id));
    }
  }, [selectedConversation, selectedMessages]);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages]);

  const getRecipientName = (id: string) => {
    return profiles?.find(p => p.id === id)?.full_name || 'Unknown';
  };

  const handleReply = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    const lastMsg = conversations?.[selectedConversation]?.[0];
    sendMutation.mutate({
      recipient_id: selectedConversation,
      subject: `Re: ${lastMsg?.subject || 'No Subject'}`,
      content: newMessage
    });
  };

  if (isLoading) {
    return <div className="grid grid-cols-3 gap-4 h-[600px]">
      <Skeleton className="h-full" />
      <Skeleton className="h-full col-span-2" />
    </div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Conversation List */}
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Select value={composeData.recipient_id} onValueChange={v => setComposeData({ ...composeData, recipient_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                    <SelectContent>
                      {profiles?.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name} {p.specialization && `(${p.specialization})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Subject" value={composeData.subject} onChange={e => setComposeData({ ...composeData, subject: e.target.value })} />
                  <Textarea placeholder="Message..." value={composeData.content} onChange={e => setComposeData({ ...composeData, content: e.target.value })} rows={5} />
                  <Button onClick={() => sendMutation.mutate(composeData)} disabled={!composeData.recipient_id || !composeData.content}>
                    <Send className="h-4 w-4 mr-2" /> Send
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {conversationList.length === 0 ? (
              <p className="text-center text-muted-foreground p-4">No messages yet</p>
            ) : (
              conversationList
                .filter(c => getRecipientName(c.recipientId).toLowerCase().includes(searchQuery.toLowerCase()))
                .map(conv => (
                  <div
                    key={conv.recipientId}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedConversation === conv.recipientId ? 'bg-muted' : ''}`}
                    onClick={() => setSelectedConversation(conv.recipientId)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{getRecipientName(conv.recipientId)}</span>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2">{conv.unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.latestMessage.subject}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(conv.latestMessage.created_at), 'MMM d, h:mm a')}</p>
                      </div>
                      {conv.latestMessage.recipient_id === user?.id && !conv.latestMessage.is_read ? (
                        <Mail className="h-4 w-4 text-primary" />
                      ) : (
                        <MailOpen className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message View */}
      <Card className="col-span-1 md:col-span-2 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-lg">{getRecipientName(selectedConversation)}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-[calc(100%-80px)] p-4">
                {selectedMessages?.map(msg => (
                  <div key={msg.id} className={`mb-4 flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-xs font-medium mb-1">{msg.subject}</p>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">{format(new Date(msg.created_at), 'h:mm a')}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t flex gap-2">
              <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply()} />
              <Button onClick={handleReply} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
