'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Link as LinkIcon, Users, Loader2, Copy, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface InviteMeetingModalProps {
  meetingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMeetingModal({ meetingId, open, onOpenChange }: InviteMeetingModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          email,
          invitationType: 'email',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      toast({
        title: 'Invitation Sent!',
        description: `Meeting invitation sent to ${email}`,
      });

      setEmail('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);

    try {
      const response = await fetch('/api/invitations/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate link');
      }

      const { link } = await response.json();
      setShareableLink(link);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate link',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setIsCopied(true);
    toast({
      title: 'Copied!',
      description: 'Link copied to clipboard',
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const loadContacts = async () => {
    setIsLoadingContacts(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get user's organization
      const { data: userRecord } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userRecord) return;

      // Get organization members
      const { data: members } = await supabase
        .from('organization_members')
        .select(`
          users (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('organization_id', userRecord.organization_id);

      if (members) {
        const contactsList = members
          .map((m: any) => m.users)
          .filter((u: any) => u.id !== user.id);
        setContacts(contactsList);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === 'link' && !shareableLink) {
      handleGenerateLink();
    } else if (value === 'contacts' && contacts.length === 0) {
      loadContacts();
    }
  };

  const toggleContact = (userId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedContacts(newSelected);
  };

  const handleInviteSelected = async () => {
    if (selectedContacts.size === 0) {
      toast({
        title: 'No Contacts Selected',
        description: 'Please select at least one contact',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      const selectedEmails = contacts
        .filter((c) => selectedContacts.has(c.id))
        .map((c) => c.email);

      for (const email of selectedEmails) {
        await fetch('/api/invitations/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingId,
            email,
            invitationType: 'email',
          }),
        });
      }

      toast({
        title: 'Invitations Sent!',
        description: `Sent ${selectedEmails.length} invitation(s)`,
      });

      setSelectedContacts(new Set());
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send some invitations',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite to Meeting</DialogTitle>
          <DialogDescription>
            Share this meeting with others via email, link, or your contacts
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="link">
              <LinkIcon className="mr-2 h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Users className="mr-2 h-4 w-4" />
              Contacts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
              />
            </div>
            <Button onClick={handleSendEmail} disabled={isSending} className="w-full">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex gap-2">
                <Input value={shareableLink} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  disabled={!shareableLink}
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can join the meeting
              </p>
            </div>
            {isGeneratingLink && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            {isLoadingContacts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : contacts.length > 0 ? (
              <>
                <div className="max-h-[300px] space-y-2 overflow-y-auto">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted"
                      onClick={() => toggleContact(contact.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{contact.full_name || contact.email}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleInviteSelected}
                  disabled={isSending || selectedContacts.size === 0}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    `Invite ${selectedContacts.size} Contact(s)`
                  )}
                </Button>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-2" />
                <p>No contacts found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
