'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { OrganizationBranding, User } from '@/lib/database.types';
import { Palette, Upload, Loader2 } from 'lucide-react';

export default function BrandingSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    primary_color: '#5BC2E7',
    secondary_color: '#2B4FA6',
    accent_color: '#0066FF',
    logo_url: '',
    font_heading: 'Inter',
    font_body: 'Inter',
  });

  useEffect(() => {
    fetchUserAndBranding();
  }, []);

  const fetchUserAndBranding = async () => {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.push('/');
      return;
    }

    // Get user record with organization
    const { data: userRecord } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!userRecord) {
      router.push('/dashboard');
      return;
    }

    setUser(userRecord);

    // Check if user is owner
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', authUser.id)
      .eq('organization_id', userRecord.default_organization_id)
      .single();

    const isOrgOwner = membership?.role === 'owner';
    setIsOwner(isOrgOwner);

    // Get organization branding
    const { data: brandingData } = await supabase
      .from('organization_branding')
      .select('*')
      .eq('organization_id', userRecord.default_organization_id)
      .single();

    // Check if branding is enabled for this organization
    const { data: orgData } = await supabase
      .from('organizations')
      .select('branding_enabled')
      .eq('id', userRecord.default_organization_id)
      .single();

    if (!orgData?.branding_enabled) {
      setBranding(null);
      setIsLoading(false);
      return;
    }

    setBranding(brandingData);

    if (brandingData) {
      setFormData({
        primary_color: brandingData.primary_color || '#5BC2E7',
        secondary_color: brandingData.secondary_color || '#2B4FA6',
        accent_color: brandingData.accent_color || '#0066FF',
        logo_url: brandingData.logo_url || '',
        font_heading: brandingData.font_family || 'Inter',
        font_body: brandingData.font_family || 'Inter',
      });
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    const supabase = createClient();

    // Re-check if branding is enabled
    if (!user?.default_organization_id) return;

    const { data: orgData } = await supabase
      .from('organizations')
      .select('branding_enabled')
      .eq('id', user.default_organization_id)
      .single();

    if (!orgData?.branding_enabled) {
      toast({
        title: 'Branding Disabled',
        description: 'Contact the platform admin to enable white-label branding',
        variant: 'destructive',
      });
      return;
    }

    if (!isOwner) {
      toast({
        title: 'Permission Denied',
        description: 'Only organization owners can update branding',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save branding');
      }

      toast({
        title: 'Success',
        description: 'Branding settings saved successfully',
      });

      // Refresh page to apply new branding
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      primary_color: '#5BC2E7',
      secondary_color: '#2B4FA6',
      accent_color: '#0066FF',
      logo_url: '',
      font_heading: 'Inter',
      font_body: 'Inter',
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only organization owners can manage branding settings
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!branding) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              White-Label Branding
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your video conferencing platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Palette className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">Branding Not Enabled</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                White-label branding is not enabled for your organization.
                <br />
                Contact the platform administrator to request access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">White-Label Branding</h1>
          <p className="text-muted-foreground">
            Customize colors, logo, and fonts to match your brand identity
          </p>
        </div>

        {/* Colors Section */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>
              Choose colors that represent your brand
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_color: e.target.value })
                    }
                    className="h-10 w-16 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_color: e.target.value })
                    }
                    placeholder="#5BC2E7"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Main brand color (buttons, links)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, secondary_color: e.target.value })
                    }
                    className="h-10 w-16 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, secondary_color: e.target.value })
                    }
                    placeholder="#2B4FA6"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Supporting brand color
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent_color">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accent_color"
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) =>
                      setFormData({ ...formData, accent_color: e.target.value })
                    }
                    className="h-10 w-16 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.accent_color}
                    onChange={(e) =>
                      setFormData({ ...formData, accent_color: e.target.value })
                    }
                    placeholder="#0066FF"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Highlights and focus states
                </p>
              </div>
            </div>

            {/* Color Preview */}
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-sm font-medium">Preview</p>
              <div className="flex gap-2">
                <div
                  className="h-16 flex-1 rounded"
                  style={{ backgroundColor: formData.primary_color }}
                />
                <div
                  className="h-16 flex-1 rounded"
                  style={{ backgroundColor: formData.secondary_color }}
                />
                <div
                  className="h-16 flex-1 rounded"
                  style={{ backgroundColor: formData.accent_color }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>Upload your organization logo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                type="text"
                value={formData.logo_url}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Enter a URL to your logo image (PNG, JPG, or SVG)
              </p>
            </div>

            {formData.logo_url && (
              <div className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-medium">Logo Preview</p>
                <img
                  src={formData.logo_url}
                  alt="Logo preview"
                  className="h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fonts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Choose fonts for your brand</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="font_heading">Heading Font</Label>
                <Input
                  id="font_heading"
                  type="text"
                  value={formData.font_heading}
                  onChange={(e) =>
                    setFormData({ ...formData, font_heading: e.target.value })
                  }
                  placeholder="Inter"
                />
                <p className="text-xs text-muted-foreground">
                  Google Fonts name (e.g., Inter, Roboto, Poppins)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font_body">Body Font</Label>
                <Input
                  id="font_body"
                  type="text"
                  value={formData.font_body}
                  onChange={(e) =>
                    setFormData({ ...formData, font_body: e.target.value })
                  }
                  placeholder="Inter"
                />
                <p className="text-xs text-muted-foreground">
                  Google Fonts name (e.g., Inter, Roboto, Open Sans)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
