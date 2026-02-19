import { useEffect, useState, type FormEvent } from 'react';
import { AdminBreadcrumbs } from '../components/AdminBreadcrumbs';
import { AdminLoadingCard } from '../components/AdminLoadingCard';
import { AdminMagicLinkCard } from '../components/AdminMagicLinkCard';
import { AdminStatusMessage } from '../components/AdminStatusMessage';
import { forwardFormByEmail } from '../services/formForwarding';
import {
  fetchFormRoutingRules,
  saveFormRoutingRules,
  type FormRoutingRule,
} from '../services/formRouting';
import {
  fetchSiteAdminAccess,
  getCachedSiteAdminAccess,
  sendAdminMagicLink,
  type SiteAdminAccess,
} from '../services/siteSettings';

const initialAdminAccess: SiteAdminAccess = {
  mode: 'local',
  email: null,
  canManage: true,
};

const ROUTING_CONTACTS = [
  { label: 'Simon', email: 'simon@simonrumble.com' },
  { label: 'Kirsten', email: 'kirsten@inmarketingwetrust.com.au' },
  { label: 'Taylor', email: 'thanhchu0702@gmail.com' },
  { label: 'Yalcin', email: 'yalcin@growthanalyticsmarketing.com' },
  { label: 'Wendy', email: 'wendynguyen272@gmail.com' },
  { label: 'Minh', email: 'minhanh411@gmail.com' },
  { label: 'WAW', email: 'commitee@wawsydney.com' },
];

function parseEmailInput(value: string) {
  return value
    .split(/[\n,;]/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function formatUpdatedAt(value: string | null) {
  if (!value) return 'Not updated yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not updated yet';
  }

  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminFormRouting() {
  const cachedAdminAccess = getCachedSiteAdminAccess();
  const [loading, setLoading] = useState(!cachedAdminAccess);
  const [saving, setSaving] = useState(false);
  const [testingFormKind, setTestingFormKind] = useState<FormRoutingRule['formKind'] | null>(null);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [adminAccess, setAdminAccess] = useState<SiteAdminAccess>(cachedAdminAccess?.data ?? initialAdminAccess);
  const [authLinkEmail, setAuthLinkEmail] = useState(cachedAdminAccess?.data.email ?? '');
  const [rules, setRules] = useState<FormRoutingRule[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const accessResult = await fetchSiteAdminAccess();
      if (!isMounted) {
        return;
      }

      setAdminAccess(accessResult.data);
      setAuthLinkEmail(accessResult.data.email ?? '');

      if (!accessResult.ok && accessResult.message) {
        setStatus({ type: 'error', message: accessResult.message });
      } else if (accessResult.message) {
        setStatus({ type: 'info', message: accessResult.message });
      } else {
        setStatus(null);
      }

      if (accessResult.data.mode === 'supabase' && !accessResult.data.canManage) {
        setLoading(false);
        return;
      }

      const rulesResult = await fetchFormRoutingRules();
      if (!isMounted) {
        return;
      }

      if (!rulesResult.ok) {
        setStatus({
          type: 'error',
          message: rulesResult.message ?? 'Unable to load form forwarding settings.',
        });
      } else {
        setRules(rulesResult.data);
        if (rulesResult.message) {
          setStatus({
            type: 'info',
            message: rulesResult.message,
          });
        }
      }

      setLoading(false);
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const requiresAdminSignIn = !loading && adminAccess.mode === 'supabase' && !adminAccess.canManage;
  const canShowAdminContent = !loading && !requiresAdminSignIn;

  const updateRule = (formKind: FormRoutingRule['formKind'], nextRule: Partial<FormRoutingRule>) => {
    setRules((currentRules) =>
      currentRules.map((rule) => (rule.formKind === formKind ? { ...rule, ...nextRule } : rule))
    );
  };

  const toggleRuleEmail = (
    formKind: FormRoutingRule['formKind'],
    target: 'toEmails' | 'ccEmails',
    email: string
  ) => {
    setRules((currentRules) =>
      currentRules.map((rule) => {
        if (rule.formKind !== formKind) {
          return rule;
        }

        const existing = new Set(rule[target].map((entry) => entry.toLowerCase()));
        const normalized = email.toLowerCase();

        if (existing.has(normalized)) {
          existing.delete(normalized);
        } else {
          existing.add(normalized);
        }

        return {
          ...rule,
          [target]: Array.from(existing),
        };
      })
    );
  };

  const handleSendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setSendingMagicLink(true);

    const result = await sendAdminMagicLink(authLinkEmail, '/admin/form-routing');
    setSendingMagicLink(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to send admin login link.',
      });
      return;
    }

    setStatus({
      type: 'success',
      message: result.message ?? 'Admin magic link sent.',
    });
  };

  const handleSaveRules = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setSaving(true);

    const payload: FormRoutingRule[] = rules.map((rule) => ({
      ...rule,
      toEmails: parseEmailInput(rule.toEmails.join(', ')),
      ccEmails: parseEmailInput(rule.ccEmails.join(', ')),
    }));

    const result = await saveFormRoutingRules(payload);
    setSaving(false);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? 'Unable to save form forwarding settings.',
      });
      return;
    }

    setRules(result.data);
    setStatus({
      type: 'success',
      message: 'Form forwarding settings saved.',
    });
  };

  const handleSendTest = async (rule: FormRoutingRule) => {
    setStatus(null);
    setTestingFormKind(rule.formKind);

    const senderEmail = adminAccess.email ?? 'commitee@wawsydney.com';
    const now = new Date().toISOString();

    const result = await forwardFormByEmail(rule.formKind, {
      type: rule.formKind,
      source: '/admin/form-routing',
      name: 'DAWS Admin Test',
      email: senderEmail,
      subject: `Test send for ${rule.formLabel}`,
      message: `This is a routing test sent at ${now}.`,
      page_path: '/admin/form-routing',
      received_at: now,
      payload: {
        test_send: true,
        form_kind: rule.formKind,
        note: 'If you received this, form forwarding is working for this rule.',
      },
    });

    setTestingFormKind(null);

    if (!result.ok) {
      setStatus({
        type: 'error',
        message: result.message ?? `Test send failed for ${rule.formLabel}.`,
      });
      return;
    }

    setStatus({
      type: 'success',
      message: `Test email sent for ${rule.formLabel}.`,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
          <AdminBreadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Form Routing', href: '/admin/form-routing' },
            ]}
          />
          <h1 className="mt-4 text-4xl text-[var(--color-primary)] md:text-5xl">Form Routing</h1>
          <p className="mt-3 max-w-3xl text-[var(--color-text-muted)]">
            Configure who receives each website form submission and who is CC&apos;d.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
          <AdminStatusMessage status={status} />

          {loading && <AdminLoadingCard />}

          {requiresAdminSignIn && (
            <AdminMagicLinkCard
              email={authLinkEmail}
              onEmailChange={setAuthLinkEmail}
              onSubmit={handleSendMagicLink}
              sending={sendingMagicLink}
              description="Sign in with an admin email listed in `job_board_admins` to manage form forwarding settings."
            />
          )}

          {canShowAdminContent && (
            <article className="rounded-2xl border border-[var(--color-border)] bg-white p-6 md:p-7">
              <form onSubmit={handleSaveRules} className="space-y-6">
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div
                      key={rule.formKind}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-lg text-[var(--color-primary)]">{rule.formLabel}</h2>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Last updated: {formatUpdatedAt(rule.updatedAt)}
                            {rule.updatedByEmail ? ` by ${rule.updatedByEmail}` : ''}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Test send uses the currently saved routing in Supabase.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSendTest(rule)}
                            disabled={saving || testingFormKind === rule.formKind}
                            className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium ${
                              saving || testingFormKind === rule.formKind
                                ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                                : 'border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-accent)]'
                            }`}
                          >
                            {testingFormKind === rule.formKind ? 'Sending test...' : 'Send test'}
                          </button>
                          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(event) => updateRule(rule.formKind, { enabled: event.target.checked })}
                              className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                            />
                            Enabled
                          </label>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-sm text-[var(--color-text-muted)]">
                            To (comma or newline separated)
                          </span>
                          <textarea
                            rows={3}
                            value={rule.toEmails.join(', ')}
                            onChange={(event) =>
                              updateRule(rule.formKind, { toEmails: parseEmailInput(event.target.value) })
                            }
                            className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                            placeholder="person1@example.com, person2@example.com"
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            {ROUTING_CONTACTS.map((contact) => {
                              const isSelected = rule.toEmails.includes(contact.email);
                              return (
                                <button
                                  key={`${rule.formKind}-to-${contact.email}`}
                                  type="button"
                                  onClick={() => toggleRuleEmail(rule.formKind, 'toEmails', contact.email)}
                                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                    isSelected
                                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                                      : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                  }`}
                                >
                                  {contact.label}
                                </button>
                              );
                            })}
                          </div>
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-sm text-[var(--color-text-muted)]">
                            CC (comma or newline separated)
                          </span>
                          <textarea
                            rows={3}
                            value={rule.ccEmails.join(', ')}
                            onChange={(event) =>
                              updateRule(rule.formKind, { ccEmails: parseEmailInput(event.target.value) })
                            }
                            className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                            placeholder="team@example.com"
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            {ROUTING_CONTACTS.map((contact) => {
                              const isSelected = rule.ccEmails.includes(contact.email);
                              return (
                                <button
                                  key={`${rule.formKind}-cc-${contact.email}`}
                                  type="button"
                                  onClick={() => toggleRuleEmail(rule.formKind, 'ccEmails', contact.email)}
                                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                    isSelected
                                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                                      : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                  }`}
                                >
                                  {contact.label}
                                </button>
                              );
                            })}
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                      saving
                        ? 'cursor-not-allowed bg-slate-300 text-slate-600'
                        : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Save Routing'}
                  </button>
                </div>
              </form>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
