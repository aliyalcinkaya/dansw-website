import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import { getReadableTextColor, inferCompanyNameFromDomain, isBrandfetchConfigured } from '../services/brandfetch';
import { getSupabaseClient } from '../services/supabase';
import {
  JOB_PACKAGES,
  createPublishCheckoutSession,
  fetchDraftByIdForCurrentUser,
  formatSalaryRange,
  getCurrentSupabaseUserEmail,
  markJobPaidAndSubmitForReview,
  markJobPendingPayment,
  saveJobDraft,
  sendDraftMagicLink,
  submitJobForReviewWithoutPayment,
} from '../services/jobs';
import type {
  ApplicationMode,
  EasyApplyFields,
  EmploymentType,
  JobDraftInput,
  JobPackageType,
  LocationMode,
  SalaryPeriod,
  SeniorityLevel,
} from '../types/jobs';

interface JobFormState {
  title: string;
  companyName: string;
  companyWebsite: string;
  brandLogoUrl: string;
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  locationText: string;
  locationMode: LocationMode;
  employmentType: EmploymentType;
  seniorityLevel: SeniorityLevel;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: SalaryPeriod;
  hideSalary: boolean;
  roleContent: string;
  applicationMode: ApplicationMode;
  externalApplyUrl: string;
  easyApplyEmail: string;
  easyApplyCollectName: boolean;
  easyApplyCollectCv: boolean;
  easyApplyCollectLinkedin: boolean;
  easyApplyCollectCoverLetter: boolean;
  applicationDeadline: string;
  contactName: string;
  postedByEmail: string;
}

const defaultEasyApplyFields: EasyApplyFields = {
  collectName: true,
  collectEmail: true,
  collectCv: true,
  collectLinkedin: true,
  collectCoverLetter: true,
};

const initialFormState: JobFormState = {
  title: '',
  companyName: '',
  companyWebsite: '',
  brandLogoUrl: '',
  brandPrimaryColor: '',
  brandSecondaryColor: '',
  locationText: '',
  locationMode: 'hybrid',
  employmentType: 'full-time',
  seniorityLevel: 'mid',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'AUD',
  salaryPeriod: 'year',
  hideSalary: false,
  roleContent: '',
  applicationMode: 'external_apply',
  externalApplyUrl: '',
  easyApplyEmail: '',
  easyApplyCollectName: defaultEasyApplyFields.collectName,
  easyApplyCollectCv: defaultEasyApplyFields.collectCv,
  easyApplyCollectLinkedin: defaultEasyApplyFields.collectLinkedin,
  easyApplyCollectCoverLetter: defaultEasyApplyFields.collectCoverLetter,
  applicationDeadline: '',
  contactName: '',
  postedByEmail: '',
};

function parseIntegerOrNull(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toUnifiedRoleContent(input: Pick<JobDraftInput, 'summary' | 'responsibilities' | 'requirements' | 'niceToHave'>) {
  const parts = [input.summary, input.responsibilities, input.requirements, input.niceToHave ?? '']
    .map((value) => value.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return '';
  }

  const unique = Array.from(new Set(parts));
  return unique.join('\n\n');
}

function toDraftInput(form: JobFormState, packageType: JobPackageType): JobDraftInput {
  const roleContent = form.roleContent.trim();
  const salaryMin = form.hideSalary ? null : parseIntegerOrNull(form.salaryMin);
  const salaryMax = form.hideSalary ? null : parseIntegerOrNull(form.salaryMax);
  const locationText = form.locationMode === 'remote' ? 'Remote' : form.locationText.trim();

  return {
    title: form.title,
    companyName: form.companyName,
    companyWebsite: form.companyWebsite,
    brandLogoUrl: form.brandLogoUrl,
    brandPrimaryColor: form.brandPrimaryColor,
    brandSecondaryColor: form.brandSecondaryColor,
    locationText,
    locationMode: form.locationMode,
    employmentType: form.employmentType,
    seniorityLevel: form.seniorityLevel,
    salaryMin,
    salaryMax,
    salaryCurrency: form.salaryCurrency,
    salaryPeriod: form.salaryPeriod,
    summary: roleContent,
    responsibilities: roleContent,
    requirements: roleContent,
    niceToHave: '',
    applicationMode: form.applicationMode,
    externalApplyUrl: form.externalApplyUrl,
    easyApplyEmail: form.easyApplyEmail,
    easyApplyFields: {
      collectName: form.easyApplyCollectName,
      collectEmail: true,
      collectCv: form.easyApplyCollectCv,
      collectLinkedin: form.easyApplyCollectLinkedin,
      collectCoverLetter: form.easyApplyCollectCoverLetter,
    },
    applicationDeadline: form.applicationDeadline,
    contactName: form.contactName,
    postedByEmail: form.postedByEmail,
    packageType,
  };
}

function mapDraftToFormState(input: JobDraftInput): JobFormState {
  const hideSalary = input.salaryMin == null && input.salaryMax == null;
  const locationText = input.locationMode === 'remote' ? '' : input.locationText;
  const easyApplyFields = {
    ...defaultEasyApplyFields,
    ...(input.easyApplyFields ?? {}),
    collectEmail: true,
  };

  return {
    title: input.title,
    companyName: input.companyName,
    companyWebsite: input.companyWebsite ?? '',
    brandLogoUrl: input.brandLogoUrl ?? '',
    brandPrimaryColor: input.brandPrimaryColor ?? '',
    brandSecondaryColor: input.brandSecondaryColor ?? '',
    locationText,
    locationMode: input.locationMode,
    employmentType: input.employmentType,
    seniorityLevel: input.seniorityLevel,
    salaryMin: input.salaryMin?.toString() ?? '',
    salaryMax: input.salaryMax?.toString() ?? '',
    salaryCurrency: input.salaryCurrency,
    salaryPeriod: input.salaryPeriod,
    hideSalary,
    roleContent: toUnifiedRoleContent(input),
    applicationMode: input.applicationMode,
    externalApplyUrl: input.externalApplyUrl ?? '',
    easyApplyEmail: input.easyApplyEmail ?? '',
    easyApplyCollectName: easyApplyFields.collectName,
    easyApplyCollectCv: easyApplyFields.collectCv,
    easyApplyCollectLinkedin: easyApplyFields.collectLinkedin,
    easyApplyCollectCoverLetter: easyApplyFields.collectCoverLetter,
    applicationDeadline: input.applicationDeadline ?? '',
    contactName: input.contactName ?? '',
    postedByEmail: input.postedByEmail,
  };
}

function getModeLabel(mode: ApplicationMode) {
  const labels: Record<ApplicationMode, string> = {
    easy_apply: 'Easy Apply on DAWS',
    external_apply: 'Apply on Client Website',
    both: 'Offer Both Apply Methods',
  };
  return labels[mode];
}

function getCompanyInitials(companyName: string) {
  return companyName
    .split(/\s+/)
    .map((token) => token.trim().charAt(0))
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function parsePackageType(value: string | null): JobPackageType | null {
  if (value === 'standard' || value === 'amplified') {
    return value;
  }
  return null;
}

export function JobSubmit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftParam = searchParams.get('draft');
  const selectedPlanParam = parsePackageType(searchParams.get('plan'));
  const paymentStatus = searchParams.get('payment');
  const paymentsDisabled = import.meta.env.VITE_JOBS_DISABLE_PAYMENTS?.trim().toLowerCase() === 'true';

  const [formState, setFormState] = useState<JobFormState>(initialFormState);
  const [draftId, setDraftId] = useState<string | null>(draftParam);
  const [selectedPackage, setSelectedPackage] = useState<JobPackageType>(selectedPlanParam ?? 'standard');
  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(draftParam));
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [authLinkEmail, setAuthLinkEmail] = useState('');
  const [hasProcessedPaymentSuccess, setHasProcessedPaymentSuccess] = useState(false);
  const brandfetchEnabled = isBrandfetchConfigured();
  const { branding: detectedBranding, loading: isBrandLookupLoading, domain: brandDomain } = useCompanyBranding(
    formState.companyWebsite
  );

  const brandHeaderStyle = useMemo(() => {
    const primary = formState.brandPrimaryColor || '#0f172a';
    const secondary = formState.brandSecondaryColor || '#1e293b';
    const text = getReadableTextColor(primary);

    return {
      background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      color: text,
    };
  }, [formState.brandPrimaryColor, formState.brandSecondaryColor]);

  const paymentNotice =
    paymentStatus === 'success'
      ? {
          type: 'success' as const,
          message: 'Payment succeeded. We will review and publish your job listing shortly.',
        }
      : paymentStatus === 'cancelled'
        ? {
            type: 'error' as const,
            message: 'Payment was cancelled. Your draft remains saved.',
          }
        : null;

  const selectedPackageDetails = useMemo(
    () =>
      JOB_PACKAGES.find((pkg) => pkg.type === selectedPackage) ?? {
        type: selectedPackage,
        title: selectedPackage === 'amplified' ? 'Amplified Reach' : 'Standard Listing',
        priceAUD: selectedPackage === 'amplified' ? 950 : 150,
        description: 'Job listing package selected.',
        benefits: [],
      },
    [selectedPackage]
  );

  useEffect(() => {
    if (draftParam || selectedPlanParam) {
      return;
    }

    navigate('/jobs/post', { replace: true });
  }, [draftParam, navigate, selectedPlanParam]);

  useEffect(() => {
    if (draftParam || !selectedPlanParam) {
      return;
    }

    setSelectedPackage((current) => (current === selectedPlanParam ? current : selectedPlanParam));
  }, [draftParam, selectedPlanParam]);

  useEffect(() => {
    if (!brandDomain) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormState((current) => {
        if (!current.brandLogoUrl && !current.brandPrimaryColor && !current.brandSecondaryColor) {
          return current;
        }

        return {
          ...current,
          brandLogoUrl: '',
          brandPrimaryColor: '',
          brandSecondaryColor: '',
        };
      });
      return;
    }

    if (isBrandLookupLoading) {
      return;
    }

    setFormState((current) => {
      const nextBrandLogoUrl = detectedBranding?.logoUrl ?? '';
      const nextPrimaryColor = detectedBranding?.primaryColor ?? '';
      const nextSecondaryColor = detectedBranding?.secondaryColor ?? '';
      const inferredCompanyName = detectedBranding?.companyName ?? inferCompanyNameFromDomain(brandDomain) ?? '';
      const nextCompanyName = current.companyName.trim() ? current.companyName : inferredCompanyName;

      if (
        current.brandLogoUrl === nextBrandLogoUrl &&
        current.brandPrimaryColor === nextPrimaryColor &&
        current.brandSecondaryColor === nextSecondaryColor &&
        current.companyName === nextCompanyName
      ) {
        return current;
      }

      return {
        ...current,
        companyName: nextCompanyName,
        brandLogoUrl: nextBrandLogoUrl,
        brandPrimaryColor: nextPrimaryColor,
        brandSecondaryColor: nextSecondaryColor,
      };
    });
  }, [brandDomain, detectedBranding, isBrandLookupLoading]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const email = await getCurrentSupabaseUserEmail();
      if (!isMounted) return;

      setSessionEmail(email);
      if (email) {
        setAuthLinkEmail(email);
        setFormState((current) => (current.postedByEmail ? current : { ...current, postedByEmail: email }));
      }
    };

    void loadSession();

    const client = getSupabaseClient();
    if (!client) {
      return () => {
        isMounted = false;
      };
    }

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email?.toLowerCase() ?? null;
      setSessionEmail(email);
      if (email) {
        setAuthLinkEmail(email);
        setFormState((current) => (current.postedByEmail ? current : { ...current, postedByEmail: email }));
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDraft = async () => {
      if (!draftParam) {
        setIsLoadingDraft(false);
        return;
      }

      setIsLoadingDraft(true);
      const result = await fetchDraftByIdForCurrentUser(draftParam);

      if (!isMounted) return;

      if (!result.ok || !result.data) {
        setStatusType('error');
        setStatusMessage(result.message ?? 'Unable to load this draft.');
        setIsLoadingDraft(false);
        return;
      }

      const draftInput: JobDraftInput = {
        title: result.data.title,
        companyName: result.data.companyName,
        companyWebsite: result.data.companyWebsite ?? '',
        brandLogoUrl: result.data.brandLogoUrl ?? '',
        brandPrimaryColor: result.data.brandPrimaryColor ?? '',
        brandSecondaryColor: result.data.brandSecondaryColor ?? '',
        locationText: result.data.locationText,
        locationMode: result.data.locationMode,
        employmentType: result.data.employmentType,
        seniorityLevel: result.data.seniorityLevel,
        salaryMin: result.data.salaryMin,
        salaryMax: result.data.salaryMax,
        salaryCurrency: result.data.salaryCurrency,
        salaryPeriod: result.data.salaryPeriod,
        summary: result.data.summary,
        responsibilities: result.data.responsibilities,
        requirements: result.data.requirements,
        niceToHave: result.data.niceToHave ?? '',
        applicationMode: result.data.applicationMode,
        externalApplyUrl: result.data.externalApplyUrl ?? '',
        easyApplyEmail: result.data.easyApplyEmail ?? '',
        easyApplyFields: result.data.easyApplyFields,
        applicationDeadline: result.data.applicationDeadline ?? '',
        contactName: result.data.contactName ?? '',
        postedByEmail: result.data.postedByEmail,
      };
      setFormState(mapDraftToFormState(draftInput));
      setDraftId(result.data.id);
      if (result.data.packageType) {
        setSelectedPackage(result.data.packageType);
      }
      setStatusType('success');
      setStatusMessage('Draft loaded. Continue editing and publish when ready.');
      setIsLoadingDraft(false);
    };

    void loadDraft();
    return () => {
      isMounted = false;
    };
  }, [draftParam]);

  useEffect(() => {
    if (paymentsDisabled) return;
    if (paymentStatus !== 'success') return;
    if (!draftParam || !sessionEmail || hasProcessedPaymentSuccess) return;

    let cancelled = false;

    const processSuccessfulPayment = async () => {
      const result = await markJobPaidAndSubmitForReview(draftParam);
      if (cancelled) return;

      if (!result.ok) {
        setStatusType('error');
        setStatusMessage(result.message ?? 'Payment was captured but review submission failed.');
        return;
      }

      setHasProcessedPaymentSuccess(true);
      setStatusType('success');
      setStatusMessage('Payment confirmed. Your job listing is now in the admin review queue.');
    };

    void processSuccessfulPayment();

    return () => {
      cancelled = true;
    };
  }, [draftParam, hasProcessedPaymentSuccess, paymentStatus, paymentsDisabled, sessionEmail]);

  const handleSaveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setStatusType(null);
    setIsSavingDraft(true);

    const saveResult = await saveJobDraft(toDraftInput(formState, selectedPackage), draftId ?? undefined);

    if (!saveResult.ok || !saveResult.data) {
      setStatusType('error');
      setStatusMessage(saveResult.message ?? 'Unable to save draft.');
      setIsSavingDraft(false);
      return;
    }

    const currentDraftId = saveResult.data.id;
    setDraftId(currentDraftId);

    const loginLinkResult = await sendDraftMagicLink(formState.postedByEmail, currentDraftId);
    if (!loginLinkResult.ok) {
      setStatusType('error');
      setStatusMessage(`Draft saved, but login link email failed: ${loginLinkResult.message ?? 'unknown error.'}`);
      setIsSavingDraft(false);
      return;
    }

    setStatusType('success');
    setStatusMessage(
      'Draft saved. A one-time secure sign-in link was emailed so you can resume this job post from any device.'
    );
    setIsSavingDraft(false);
  };

  const handlePublish = async () => {
    setStatusMessage(null);
    setStatusType(null);
    setIsPublishing(true);

    if (!sessionEmail) {
      setStatusType('error');
      setStatusMessage('For secure publishing, open your one-time email login link first, then continue.');
      setIsPublishing(false);
      return;
    }

    if (formState.postedByEmail.trim().toLowerCase() !== sessionEmail.trim().toLowerCase()) {
      setStatusType('error');
      setStatusMessage('Please publish using the same email address that owns this secure session.');
      setIsPublishing(false);
      return;
    }

    const saveResult = await saveJobDraft(toDraftInput(formState, selectedPackage), draftId ?? undefined);
    if (!saveResult.ok || !saveResult.data) {
      setStatusType('error');
      setStatusMessage(saveResult.message ?? 'Unable to save draft before submission.');
      setIsPublishing(false);
      return;
    }

    const savedDraftId = saveResult.data.id;
    setDraftId(savedDraftId);

    if (paymentsDisabled) {
      const submitResult = await submitJobForReviewWithoutPayment(savedDraftId, selectedPackage);
      if (!submitResult.ok || !submitResult.data) {
        setStatusType('error');
        setStatusMessage(submitResult.message ?? 'Unable to submit job for review.');
        setIsPublishing(false);
        return;
      }

      setStatusType('success');
      setStatusMessage(
        'Job submitted for admin review. Stripe is disabled in test mode, so no payment was required.'
      );
      setIsPublishing(false);
      return;
    }

    const pendingPaymentResult = await markJobPendingPayment(savedDraftId, selectedPackage);
    if (!pendingPaymentResult.ok) {
      setStatusType('error');
      setStatusMessage(pendingPaymentResult.message ?? 'Unable to prepare checkout.');
      setIsPublishing(false);
      return;
    }

    const checkoutResult = await createPublishCheckoutSession(
      savedDraftId,
      selectedPackage,
      formState.postedByEmail
    );

    if (!checkoutResult.ok) {
      setStatusType('error');
      setStatusMessage(checkoutResult.message);
      setIsPublishing(false);
      return;
    }

    window.location.href = checkoutResult.url;
  };

  const handleSendAccessLink = async () => {
    if (!draftParam) return;

    const result = await sendDraftMagicLink(authLinkEmail, draftParam);
    if (!result.ok) {
      setStatusType('error');
      setStatusMessage(result.message ?? 'Unable to send access link.');
      return;
    }

    setStatusType('success');
    setStatusMessage('Secure sign-in link sent. Check your inbox to continue this draft.');
  };

  const requiresSpecificLocation = formState.locationMode !== 'remote';
  const isLightPreviewText = getReadableTextColor(formState.brandPrimaryColor || '#0f172a') === '#ffffff';
  const previewSalaryText = formState.hideSalary
    ? null
    : (() => {
        const salaryMin = parseIntegerOrNull(formState.salaryMin);
        const salaryMax = parseIntegerOrNull(formState.salaryMax);
        if (salaryMin == null && salaryMax == null) return null;
        return formatSalaryRange({
          salaryMin,
          salaryMax,
          salaryCurrency: formState.salaryCurrency || 'AUD',
          salaryPeriod: formState.salaryPeriod,
        });
      })();

  if (!draftParam && !selectedPlanParam) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-18">
          <Link
            to={draftParam ? '/jobs' : '/jobs/post'}
            className="flex w-fit items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {draftParam ? 'Back to jobs' : 'Back to plan selection'}
          </Link>
          <span className="text-[var(--color-accent)] text-sm font-semibold uppercase tracking-wider">
            Post a Role
          </span>
          <h1 className="text-4xl md:text-5xl text-[var(--color-primary)] mt-2 mb-5">
            Advertise to the DAWS Community
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
            Selected plan: <span className="font-semibold text-[var(--color-primary)]">{selectedPackageDetails.title}</span>.
            Add your role details and submit for admin review. Approved listings are published within 48 hours.
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {isLoadingDraft && (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 text-[var(--color-text-muted)] mb-6">
              Loading draft...
            </div>
          )}

          {!isLoadingDraft && (statusMessage || paymentNotice) && (
            <div
              className={`rounded-2xl border p-5 mb-6 ${
                (statusType ?? paymentNotice?.type) === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
              role="status"
            >
              {statusMessage ?? paymentNotice?.message}
            </div>
          )}

          {!isLoadingDraft && draftParam && statusType === 'error' && (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 mb-6">
              <h2 className="text-xl text-[var(--color-primary)] mb-3">Access this draft</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Use the same email you used when saving the draft. We will send a one-time secure login link.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={authLinkEmail}
                  onChange={(event) => setAuthLinkEmail(event.target.value)}
                  placeholder="your.email@company.com"
                  className="flex-grow px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
                <button
                  type="button"
                  onClick={handleSendAccessLink}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-slate-800 transition-colors"
                >
                  Email me access link
                </button>
              </div>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSaveDraft}>
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8 space-y-6">
              <h2 className="text-2xl text-[var(--color-primary)]">Role Information</h2>
              <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6 lg:gap-8 items-start">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Job title *</label>
                    <input
                      type="text"
                      value={formState.title}
                      onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Senior Product Analyst"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Company website</label>
                    <input
                      type="url"
                      value={formState.companyWebsite}
                      onChange={(event) => setFormState((current) => ({ ...current, companyWebsite: event.target.value }))}
                      placeholder="https://company.com"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      {isBrandLookupLoading
                        ? 'Looking up company name, logo, and brand colors...'
                        : formState.companyWebsite.trim() && !brandfetchEnabled
                          ? 'Company name is inferred from the URL. Set VITE_BRANDFETCH_API_KEY for logo and brand colors.'
                          : formState.companyWebsite.trim() && detectedBranding
                            ? 'Brand profile found. Company name, logo, and header style are auto-populated.'
                            : formState.companyWebsite.trim() && !detectedBranding
                              ? 'No brand profile found for this domain. Company name is still inferred from the URL.'
                              : 'Enter your website to auto-populate company name, logo, and brand colors.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Company name *</label>
                    <input
                      type="text"
                      value={formState.companyName}
                      onChange={(event) => setFormState((current) => ({ ...current, companyName: event.target.value }))}
                      placeholder="Acme Analytics"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Location mode *</label>
                    <select
                      value={formState.locationMode}
                      onChange={(event) =>
                        setFormState((current) => {
                          const nextMode = event.target.value as LocationMode;
                          return {
                            ...current,
                            locationMode: nextMode,
                            locationText: nextMode === 'remote' ? '' : current.locationText,
                          };
                        })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      <option value="hybrid">Hybrid</option>
                      <option value="remote">Remote</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>

                  {requiresSpecificLocation && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Location *</label>
                      <input
                        type="text"
                        value={formState.locationText}
                        onChange={(event) => setFormState((current) => ({ ...current, locationText: event.target.value }))}
                        placeholder="Sydney, NSW"
                        className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Employment type *</label>
                    <select
                      value={formState.employmentType}
                      onChange={(event) => setFormState((current) => ({ ...current, employmentType: event.target.value as EmploymentType }))}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="temporary">Temporary</option>
                    </select>
                  </div>

                </div>

                <div className="lg:sticky lg:top-24">
                  <p className="block text-sm font-medium text-[var(--color-text)] mb-2">Job card header preview</p>
                  <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
                    <div className="p-4" style={brandHeaderStyle}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          {formState.brandLogoUrl ? (
                            <img
                              src={formState.brandLogoUrl}
                              alt={`${formState.companyName || 'Company'} logo`}
                              className="h-18 w-18 rounded-lg bg-white object-contain p-1"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className={`h-12 w-12 rounded-lg flex items-center justify-center text-sm font-semibold ${
                                isLightPreviewText ? 'bg-white/20 text-white' : 'bg-black/10 text-black/80'
                              }`}
                              aria-hidden="true"
                            >
                              {getCompanyInitials(formState.companyName || 'Company')}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium opacity-85 truncate">
                              {formState.companyName || 'Company name'}
                            </p>
                            <p className="text-2xl mt-0.5 leading-tight">
                              {formState.title || 'Job title'}
                            </p>
                            {previewSalaryText && <p className="text-sm text-white">{previewSalaryText}</p>}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span
                                className={`text-xs rounded-full px-2.5 py-1 border ${
                                  isLightPreviewText
                                    ? 'bg-white/15 border-white/25 text-white'
                                    : 'bg-black/10 border-black/15 text-black/80'
                                }`}
                              >
                                {formState.employmentType || 'Employment type'}
                              </span>
                              <span
                                className={`text-xs rounded-full px-2.5 py-1 border ${
                                  isLightPreviewText
                                    ? 'bg-white/15 border-white/25 text-white'
                                    : 'bg-black/10 border-black/15 text-black/80'
                                }`}
                              >
                                {formState.seniorityLevel || 'Seniority'}
                              </span>
                              {!formState.hideSalary && (
                                <>
                                  <span
                                    className={`text-xs rounded-full px-2.5 py-1 border ${
                                      isLightPreviewText
                                        ? 'bg-white/15 border-white/25 text-white'
                                        : 'bg-black/10 border-black/15 text-black/80'
                                    }`}
                                  >
                                    {formState.salaryCurrency || 'AUD'}
                                  </span>
                                  <span
                                    className={`text-xs rounded-full px-2.5 py-1 border ${
                                      isLightPreviewText
                                        ? 'bg-white/15 border-white/25 text-white'
                                        : 'bg-black/10 border-black/15 text-black/80'
                                    }`}
                                  >
                                    per {formState.salaryPeriod}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)] space-y-5">
                <h3 className="text-2xl text-[var(--color-primary)]">Compensation</h3>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Salary visibility</label>
                  <select
                    value={formState.hideSalary ? 'hide' : 'show'}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        hideSalary: event.target.value === 'hide',
                        salaryMin: event.target.value === 'hide' ? '' : current.salaryMin,
                        salaryMax: event.target.value === 'hide' ? '' : current.salaryMax,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  >
                    <option value="show">Show salary</option>
                    <option value="hide">Hide salary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Seniority *</label>
                  <select
                    value={formState.seniorityLevel}
                    onChange={(event) => setFormState((current) => ({ ...current, seniorityLevel: event.target.value as SeniorityLevel }))}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  >
                    <option value="entry">Entry level</option>
                    <option value="mid">Mid level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                    <option value="manager">Manager</option>
                    <option value="director">Director</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Salary (min or max)</label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      min={0}
                      value={formState.salaryMin}
                      onChange={(event) =>
                        setFormState((current) => {
                          const nextSalaryMin = event.target.value;
                          return {
                            ...current,
                            salaryMin: nextSalaryMin,
                            salaryMax: nextSalaryMin.trim() ? '' : current.salaryMax,
                          };
                        })
                      }
                      placeholder="Minimum salary"
                      disabled={formState.hideSalary}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <input
                      type="number"
                      min={0}
                      value={formState.salaryMax}
                      onChange={(event) =>
                        setFormState((current) => {
                          const nextSalaryMax = event.target.value;
                          return {
                            ...current,
                            salaryMax: nextSalaryMax,
                            salaryMin: nextSalaryMax.trim() ? '' : current.salaryMin,
                          };
                        })
                      }
                      placeholder="Maximum salary"
                      disabled={formState.hideSalary}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    Enter either a minimum or a maximum salary.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Currency</label>
                  <input
                    type="text"
                    value={formState.salaryCurrency}
                    onChange={(event) => setFormState((current) => ({ ...current, salaryCurrency: event.target.value.toUpperCase() }))}
                    placeholder="AUD"
                    maxLength={5}
                    disabled={formState.hideSalary}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Salary period</label>
                  <select
                    value={formState.salaryPeriod}
                    onChange={(event) => setFormState((current) => ({ ...current, salaryPeriod: event.target.value as SalaryPeriod }))}
                    disabled={formState.hideSalary}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="year">Year</option>
                    <option value="month">Month</option>
                    <option value="day">Day</option>
                    <option value="hour">Hour</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)]">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Role content * (Markdown supported)
                </label>
                <textarea
                  rows={30}
                  value={formState.roleContent}
                  onChange={(event) => setFormState((current) => ({ ...current, roleContent: event.target.value }))}
                  placeholder={
                    'Describe the role responsibilities and requirements. Markdown is supported, e.g. headings, bullet lists, bold text, and links.'
                  }
                  className="w-full min-h-[40rem] px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-y"
                  required
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8 space-y-5">
              <h2 className="text-2xl text-[var(--color-primary)]">Apply Method</h2>
              <div className="grid md:grid-cols-3 gap-3">
                {(['external_apply', 'easy_apply', 'both'] as ApplicationMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormState((current) => ({ ...current, applicationMode: mode }))}
                    className={`px-4 py-3 rounded-lg border text-left transition-all ${
                      formState.applicationMode === mode
                        ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] bg-[var(--color-accent)]/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50'
                    }`}
                  >
                    <span className="text-sm font-medium text-[var(--color-text)]">{getModeLabel(mode)}</span>
                  </button>
                ))}
              </div>

              {(formState.applicationMode === 'external_apply' || formState.applicationMode === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">External apply URL *</label>
                  <input
                    type="url"
                    value={formState.externalApplyUrl}
                    onChange={(event) => setFormState((current) => ({ ...current, externalApplyUrl: event.target.value }))}
                    placeholder="https://company.com/careers/role-id"
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    required
                  />
                </div>
              )}

              {(formState.applicationMode === 'easy_apply' || formState.applicationMode === 'both') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Easy apply destination email *
                    </label>
                    <input
                      type="email"
                      value={formState.easyApplyEmail}
                      onChange={(event) => setFormState((current) => ({ ...current, easyApplyEmail: event.target.value }))}
                      placeholder="hiring@company.com"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      required
                    />
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-surface)]">
                    <p className="text-sm font-medium text-[var(--color-text)] mb-3">
                      Easy apply fields to collect
                    </p>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <label className="inline-flex items-center gap-2 text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={formState.easyApplyCollectName}
                          onChange={(event) =>
                            setFormState((current) => ({ ...current, easyApplyCollectName: event.target.checked }))
                          }
                          className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                        />
                        Name
                      </label>
                      <label className="inline-flex items-center gap-2 text-[var(--color-text-muted)]">
                        <input
                          type="checkbox"
                          checked
                          disabled
                          className="h-4 w-4 rounded border-[var(--color-border)]"
                        />
                        Email (required)
                      </label>
                      <label className="inline-flex items-center gap-2 text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={formState.easyApplyCollectCv}
                          onChange={(event) =>
                            setFormState((current) => ({ ...current, easyApplyCollectCv: event.target.checked }))
                          }
                          className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                        />
                        CV
                      </label>
                      <label className="inline-flex items-center gap-2 text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={formState.easyApplyCollectLinkedin}
                          onChange={(event) =>
                            setFormState((current) => ({ ...current, easyApplyCollectLinkedin: event.target.checked }))
                          }
                          className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                        />
                        LinkedIn link
                      </label>
                      <label className="inline-flex items-center gap-2 text-[var(--color-text)] md:col-span-2">
                        <input
                          type="checkbox"
                          checked={formState.easyApplyCollectCoverLetter}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              easyApplyCollectCoverLetter: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                        />
                        Cover letter
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Contact name</label>
                  <input
                    type="text"
                    value={formState.contactName}
                    onChange={(event) => setFormState((current) => ({ ...current, contactName: event.target.value }))}
                    placeholder="Hiring manager name"
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Application deadline</label>
                  <input
                    type="date"
                    value={formState.applicationDeadline}
                    onChange={(event) => setFormState((current) => ({ ...current, applicationDeadline: event.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8 space-y-5">
              <h2 className="text-2xl text-[var(--color-primary)]">Poster Access</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                We use single-email login. Saving draft sends a one-time secure link so you can continue from any
                session.
              </p>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Your work email *</label>
              <input
                type="email"
                value={formState.postedByEmail}
                onChange={(event) => setFormState((current) => ({ ...current, postedByEmail: event.target.value }))}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                required
              />
              {sessionEmail && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Current secure session: <span className="font-medium">{sessionEmail}</span>
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 md:p-8 space-y-5">
              <h2 className="text-2xl text-[var(--color-primary)]">Selected Plan</h2>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                      {selectedPackageDetails.title}
                    </p>
                    <p className="text-3xl text-[var(--color-primary)] mb-2">${selectedPackageDetails.priceAUD}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{selectedPackageDetails.description}</p>
                  </div>
                  {!draftParam && (
                    <Link
                      to="/jobs/post"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[var(--color-border)] bg-white text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
                    >
                      Change plan
                    </Link>
                  )}
                </div>

                {selectedPackageDetails.benefits.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {selectedPackageDetails.benefits.map((benefit) => (
                      <li key={benefit} className="text-sm text-[var(--color-text-muted)] flex items-start gap-2">
                        <span className="text-[var(--color-accent)] mt-1">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {paymentsDisabled ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Stripe payments are currently skipped in test mode. Submitting will send your listing directly for
                  admin review.
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Publishing requires payment. After payment confirmation, the listing is reviewed and then published.
                </p>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSavingDraft || isPublishing}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-[var(--color-text)] border border-[var(--color-border)] font-semibold hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingDraft ? 'Saving Draft...' : 'Save Draft & Email Access Link'}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSavingDraft || isPublishing}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-light)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPublishing
                    ? paymentsDisabled
                      ? 'Submitting...'
                      : 'Redirecting to Payment...'
                    : paymentsDisabled
                      ? 'Submit for Review'
                      : 'Proceed to Stripe Payment'}
                </button>
              </div>

              <p className="text-xs text-[var(--color-text-muted)]">
                All submitted roles are reviewed and approved within 48 hours.
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
