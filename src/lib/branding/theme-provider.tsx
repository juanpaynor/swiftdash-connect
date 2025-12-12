'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { OrganizationBranding } from '@/lib/database.types';

interface BrandingContextType {
  branding: OrganizationBranding | null;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: null,
  isLoading: true,
  refreshBranding: async () => {},
});

export const useBranding = () => useContext(BrandingContext);

interface BrandingProviderProps {
  children: ReactNode;
  organizationId?: string;
}

export function BrandingProvider({ children, organizationId }: BrandingProviderProps) {
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranding = async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('organization_branding')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching branding:', error);
      setBranding(null);
    } else if (data && data.branding_enabled) {
      setBranding(data);
    } else {
      // Branding disabled, use defaults
      setBranding(null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchBranding();
  }, [organizationId]);

  const refreshBranding = async () => {
    setIsLoading(true);
    await fetchBranding();
  };

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}
