import { useEffect, useMemo, useState } from 'react';
import {
  extractCompanyDomain,
  fetchCompanyBranding,
  type CompanyBranding,
} from '../services/brandfetch';

interface UseCompanyBrandingResult {
  domain: string | null;
  branding: CompanyBranding | null;
  loading: boolean;
}

export function useCompanyBranding(companyWebsite: string | null | undefined): UseCompanyBrandingResult {
  const domain = useMemo(() => extractCompanyDomain(companyWebsite), [companyWebsite]);
  const [brandingResult, setBrandingResult] = useState<{
    domain: string;
    branding: CompanyBranding | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!domain) {
      return () => {
        cancelled = true;
      };
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    void fetchCompanyBranding(domain)
      .then((result) => {
        if (cancelled) return;
        setBrandingResult({ domain, branding: result });
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setBrandingResult({ domain, branding: null });
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [domain]);

  const branding = domain && brandingResult?.domain === domain ? brandingResult.branding : null;

  return {
    domain,
    branding,
    loading: domain ? loading : false,
  };
}
