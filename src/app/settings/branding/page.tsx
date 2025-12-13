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
import { Palette, Upload, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function BrandingSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    primary_color: '#5BC2E7',
    secondary_color: '#2B4FA6',
    accent_color: '#0066FF',
    logo_url: '',
    favicon_url: '',
    meeting_background_color: '#000000',
    meeting_border_style: 'subtle' as 'none' | 'subtle' | 'bold',
    show_logo_on_tiles: false,
    button_style: 'rounded' as 'rounded' | 'square',
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
    let { data: brandingData, error: brandingError } = await supabase
      .from('organization_branding')
      .select('*')
      .eq('organization_id', userRecord.default_organization_id)
      .single();

    // If no branding record exists, create one
    if (brandingError && brandingError.code === 'PGRST116') {
      const { data: newBranding, error: createError } = await supabase
        .from('organization_branding')
        .insert({
          organization_id: userRecord.default_organization_id,
          primary_color: '#5BC2E7',
          secondary_color: '#2B4FA6',
          accent_color: '#0066FF',
          meeting_background_color: '#000000',
          meeting_border_style: 'subtle',
          show_logo_on_tiles: false,
          button_style: 'rounded',
          branding_enabled: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating branding record:', createError);
      } else {
        brandingData = newBranding;
      }
    }

    // Enable branding on the organization if not already enabled
    const { data: orgData } = await supabase
      .from('organizations')
      .select('branding_enabled')
      .eq('id', userRecord.default_organization_id)
      .single();

    if (!orgData?.branding_enabled) {
      // Auto-enable branding for this organization
      await supabase
        .from('organizations')
        .update({ branding_enabled: true })
        .eq('id', userRecord.default_organization_id);
    }

    setBranding(brandingData);

    if (brandingData) {
      setFormData({
        primary_color: brandingData.primary_color || '#5BC2E7',
        secondary_color: brandingData.secondary_color || '#2B4FA6',
        accent_color: brandingData.accent_color || '#0066FF',
        logo_url: brandingData.logo_url || '',
        favicon_url: brandingData.favicon_url || '',
        meeting_background_color: brandingData.meeting_background_color || '#000000',
        meeting_border_style: (brandingData.meeting_border_style as 'none' | 'subtle' | 'bold') || 'subtle',
        show_logo_on_tiles: brandingData.show_logo_on_tiles || false,
        button_style: (brandingData.button_style as 'rounded' | 'square') || 'rounded',
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
      favicon_url: '',
      meeting_background_color: '#000000',
      meeting_border_style: 'subtle',
      show_logo_on_tiles: false,
      button_style: 'rounded',
      font_heading: 'Inter',
      font_body: 'Inter',
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.default_organization_id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file (PNG, JPG, or SVG)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Logo must be under 2MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.default_organization_id}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName);

      setFormData({ ...formData, logo_url: urlData.publicUrl });
      setLogoFile(file);

      toast({
        title: 'Success',
        description: 'Logo uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: '' });
    setLogoFile(null);
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
            <CardDescription>Upload your organization logo (max 2MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.logo_url ? (
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <p className="mb-3 text-sm font-medium">Current Logo</p>
                  <img
                    src={formData.logo_url}
                    alt="Organization logo"
                    className="h-20 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRemoveLogo}
                    disabled={isUploading || isSaving}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Logo
                  </Button>
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button
                      variant="outline"
                      disabled={isUploading || isSaving}
                      className="gap-2"
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Replace Logo
                          </>
                        )}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="rounded-lg border-2 border-dashed p-8 text-center hover:border-primary transition-colors">
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">Click to upload logo</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, or SVG (max 2MB)
                    </p>
                  </div>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting Room Theme */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Room Theme</CardTitle>
            <CardDescription>
              Customize the appearance of your meeting rooms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Background Color */}
            <div className="space-y-2">
              <Label htmlFor="meeting_bg">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="meeting_bg"
                  type="color"
                  value={formData.meeting_background_color}
                  onChange={(e) =>
                    setFormData({ ...formData, meeting_background_color: e.target.value })
                  }
                  className="h-10 w-16 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.meeting_background_color}
                  onChange={(e) =>
                    setFormData({ ...formData, meeting_background_color: e.target.value })
                  }
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, meeting_background_color: '#000000' })}
                >
                  Black
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, meeting_background_color: '#FFFFFF' })}
                >
                  White
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, meeting_background_color: '#1a1a1a' })}
                >
                  Dark Gray
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Main background color for the meeting room
              </p>
            </div>

            {/* Border Style */}
            <div className="space-y-2">
              <Label>Video Tile Border Style</Label>
              <RadioGroup
                value={formData.meeting_border_style}
                onValueChange={(value) =>
                  setFormData({ ...formData, meeting_border_style: value as any })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="border-none" />
                  <Label htmlFor="border-none" className="font-normal cursor-pointer">
                    None - No borders on video tiles
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="subtle" id="border-subtle" />
                  <Label htmlFor="border-subtle" className="font-normal cursor-pointer">
                    Subtle - Thin, semi-transparent borders (recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bold" id="border-bold" />
                  <Label htmlFor="border-bold" className="font-normal cursor-pointer">
                    Bold - Thicker, more prominent borders
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Logo Watermark Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="show-logo">Logo Watermark on Videos</Label>
                <p className="text-xs text-muted-foreground">
                  Display your logo on participant video tiles
                </p>
              </div>
              <Switch
                id="show-logo"
                checked={formData.show_logo_on_tiles}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_logo_on_tiles: checked })
                }
              />
            </div>

            {/* Button Style */}
            <div className="space-y-2">
              <Label>Button Style</Label>
              <RadioGroup
                value={formData.button_style}
                onValueChange={(value) =>
                  setFormData({ ...formData, button_style: value as any })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rounded" id="btn-rounded" />
                  <Label htmlFor="btn-rounded" className="font-normal cursor-pointer">
                    Rounded - Pills with full border radius
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="square" id="btn-square" />
                  <Label htmlFor="btn-square" className="font-normal cursor-pointer">
                    Square - Minimal border radius
                  </Label>
                </div>
              </RadioGroup>
            </div>
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
