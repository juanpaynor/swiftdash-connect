'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Organization, OrganizationBranding, User, StreamUsageLog } from '@/lib/database.types';
import { ArrowLeft, Users, Video, Palette } from 'lucide-react';
import Link from 'next/link';

interface OrganizationDetails extends Organization {
  organization_branding: OrganizationBranding | null;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orgId = params.id as string;

  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [usageLogs, setUsageLogs] = useState<StreamUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orgId) {
      fetchOrganizationDetails();
    }
  }, [orgId]);

  const fetchOrganizationDetails = async () => {
    const supabase = createClient();

    // Fetch organization with branding
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_branding (*)
      `)
      .eq('id', orgId)
      .single();

    if (orgError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch organization details',
        variant: 'destructive',
      });
      return;
    }

    setOrganization(orgData as OrganizationDetails);

    // Fetch organization members
    const { data: memberData } = await supabase
      .from('organization_members')
      .select(`
        user_id,
        role,
        users (*)
      `)
      .eq('organization_id', orgId);

    if (memberData) {
      const users = memberData.map((m: any) => m.users).filter(Boolean);
      setMembers(users);
    }

    // Fetch usage logs
    const { data: logsData } = await supabase
      .from('stream_usage_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsData) {
      setUsageLogs(logsData);
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p>Loading...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p>Organization not found</p>
      </div>
    );
  }

  const branding = organization.organization_branding;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
            <Badge variant={organization?.branding_enabled ? 'default' : 'secondary'}>
              {organization?.branding_enabled ? 'Branded' : 'Standard'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Slug: {organization.slug} • Created {new Date(organization.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meeting Limit</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.meeting_limit || 100}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participant Limit</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.participant_limit || 50}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="usage">Usage Logs</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>Users in this organization</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Member</Badge>
                      </TableCell>
                      <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Customization
              </CardTitle>
              <CardDescription>
                {organization?.branding_enabled
                  ? 'Live preview of organization branding'
                  : 'Branding is currently disabled for this organization'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organization?.branding_enabled && branding ? (
                <div className="space-y-6">
                  {/* Color Preview */}
                  <div>
                    <h3 className="mb-3 font-semibold">Colors</h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Primary</p>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-10 w-10 rounded border"
                            style={{ backgroundColor: branding.primary_color || '#000000' }}
                          />
                          <code className="text-sm">{branding.primary_color || '#000000'}</code>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Secondary</p>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-10 w-10 rounded border"
                            style={{ backgroundColor: branding.secondary_color || '#666666' }}
                          />
                          <code className="text-sm">{branding.secondary_color || '#666666'}</code>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Accent</p>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-10 w-10 rounded border"
                            style={{ backgroundColor: branding.accent_color || '#0066FF' }}
                          />
                          <code className="text-sm">{branding.accent_color || '#0066FF'}</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div>
                    <h3 className="mb-3 font-semibold">Logo</h3>
                    {branding.logo_url ? (
                      <img
                        src={branding.logo_url}
                        alt="Organization logo"
                        className="h-16 rounded border p-2"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">No logo uploaded</p>
                    )}
                  </div>

                  {/* Fonts */}
                  <div>
                    <h3 className="mb-3 font-semibold">Fonts</h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Font Family:</span>{' '}
                        <code className="ml-2">{branding?.font_family || 'Default'}</code>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Enable branding in the Organizations list to allow customization</p>
                  <Link href="/admin/organizations">
                    <Button className="mt-4">Go to Organizations</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Logs Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Usage Logs</CardTitle>
              <CardDescription>
                Recent video conferencing activity (last 50 events)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Minutes</TableHead>
                      <TableHead>Meeting ID</TableHead>
                      <TableHead>Total Minutes</TableHead>
                      <TableHead>Peak Participants</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">{log.participant_minutes}min</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.meeting_id}</TableCell>
                        <TableCell>{log.participant_minutes}</TableCell>
                        <TableCell>{log.peak_concurrent_participants}</TableCell>
                        <TableCell>{new Date(log.recorded_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No usage logs yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
