'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Organization, OrganizationBranding } from '@/lib/database.types';
import { ExternalLink, Search } from 'lucide-react';

interface OrganizationWithBranding extends Organization {
  organization_branding: OrganizationBranding | null;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<OrganizationWithBranding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_branding (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch organizations',
        variant: 'destructive',
      });
      return;
    }

    setOrganizations(data as OrganizationWithBranding[]);
    setIsLoading(false);
  };

  const toggleBrandingEnabled = async (orgId: string, currentValue: boolean) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('organization_branding')
      .update({ branding_enabled: !currentValue })
      .eq('organization_id', orgId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update branding settings',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `Branding ${!currentValue ? 'enabled' : 'disabled'}`,
    });

    fetchOrganizations();
  };

  const updateLimit = async (orgId: string, field: 'meeting_limit' | 'participant_limit', value: number) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('organizations')
      .update({ [field]: value })
      .eq('id', orgId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update limit',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Limit updated successfully',
    });

    fetchOrganizations();
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage all organizations and their settings
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-4">
        {filteredOrganizations.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {org.name}
                    <Link href={`/admin/organizations/${org.id}`}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    Slug: {org.slug} • Created {new Date(org.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant={org.branding_enabled ? 'default' : 'secondary'}>
                  {org.branding_enabled ? 'Branded' : 'Standard'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Branding Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">White-Label Branding</p>
                  <p className="text-sm text-muted-foreground">
                    Allow organization to customize branding
                  </p>
                </div>
                <Switch
                  checked={org.branding_enabled || false}
                  onCheckedChange={() =>
                    toggleBrandingEnabled(
                      org.id,
                      org.branding_enabled || false
                    )
                  }
                />
              </div>

              {/* Limits */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meeting Limit</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      defaultValue={org.meeting_limit || 100}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (value !== org.meeting_limit) {
                          updateLimit(org.id, 'meeting_limit', value);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => updateLimit(org.id, 'meeting_limit', org.meeting_limit || 100)}
                    >
                      Reset
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum concurrent meetings
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Participant Limit</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="2"
                      defaultValue={org.participant_limit || 50}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (value !== org.participant_limit) {
                          updateLimit(org.id, 'participant_limit', value);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => updateLimit(org.id, 'participant_limit', org.participant_limit || 50)}
                    >
                      Reset
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum participants per meeting
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrganizations.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No organizations found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
