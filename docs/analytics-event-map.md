# Analytics Event Map

## Destination
- GTM Container: `GTM-P7KHHDH`
- Transport: `window.dataLayer.push(...)`
- Core implementation: `src/services/analytics.ts`
- Automatic route tracking: `src/App.tsx`

## Event Schema
All custom events are pushed as:
- `event`: event name (snake_case)
- additional event-specific params (string/number/boolean)

Common params used across events:
- `source`
- `target`
- `cta_id`
- `link_id`
- `event_id`, `event_title`
- `job_id`, `job_slug`, `company_name`
- `message` (error context)

## Automatic Events
| Event | Trigger | Key Params | Source |
|---|---|---|---|
| `page_view` | Route change | `page_path`, `page_title` | `src/App.tsx`, `src/services/analytics.ts` |

## Navigation + Footer Events
| Event | Trigger | Key Params | Source |
|---|---|---|---|
| `nav_link_click` | Header nav link click | `link_path`, `link_label`, `menu_type` | `src/components/Navigation.tsx` |
| `mobile_menu_toggle` | Mobile nav open/close | `is_open` | `src/components/Navigation.tsx` |
| `footer_link_click` | Footer internal links | `link_label`, `link_target` | `src/components/Footer.tsx` |
| `footer_social_click` | Footer social links | `platform`, `link_target` | `src/components/Footer.tsx` |
| `sponsor_logo_click` | Sponsor logo click | `sponsor_name`, `target` | `src/components/SponsorBanner.tsx` |

## Homepage Events
| Event | Trigger | Key Params | Source |
|---|---|---|---|
| `home_cta_click` | Hero and home CTAs | `cta_id`, `target` | `src/pages/Home.tsx` |
| `home_linkedin_post_click` | LinkedIn card outbound link | `post_id`, `target` | `src/pages/Home.tsx` |

## Content Page Events
| Event | Trigger | Key Params | Source |
|---|---|---|---|
| `about_link_click` | About page internal/external link click | `link_id`, `target` | `src/pages/About.tsx` |
| `code_of_conduct_link_click` | Code of Conduct external link click | `link_id`, `target` | `src/pages/CodeOfConduct.tsx` |
| `privacy_policy_link_click` | Privacy Policy internal/external link click | `link_id`, `target` | `src/pages/PrivacyPolicy.tsx` |
| `not_found_link_click` | 404 page recovery link click | `target` | `src/pages/NotFound.tsx` |

## Events + Talks Events
| Event | Trigger | Key Params | Source |
|---|---|---|---|
| `upcoming_events_retry_click` | Retry in upcoming events error state | - | `src/components/UpcomingEventsSection.tsx` |
| `upcoming_events_eventbrite_org_click` | Open Eventbrite org page | `target` | `src/components/UpcomingEventsSection.tsx` |
| `upcoming_events_newsletter_click` | Upcoming section newsletter anchor | - | `src/components/UpcomingEventsSection.tsx` |
| `upcoming_event_talk_details_click` | Upcoming card learn-more click | `event_id`, `event_title` | `src/components/UpcomingEventsSection.tsx` |
| `upcoming_event_ticket_click` | Upcoming ticket click | `event_id`, `event_title`, `target` | `src/components/UpcomingEventsSection.tsx` |
| `upcoming_events_archive_click` | Upcoming section archive link | `target` | `src/components/UpcomingEventsSection.tsx` |
| `events_table_row_click` | Past event row click on `/events` | `event_id`, `event_title` | `src/pages/Events.tsx` |
| `events_page_cta_click` | CTA on `/events` | `cta_id`, `target` | `src/pages/Events.tsx` |
| `previous_talks_row_click` | Past event row click on `/previous-talks` view | `event_id`, `event_title` | `src/pages/PreviousTalks.tsx` |
| `previous_talks_cta_click` | CTA on previous talks page | `cta_id`, `target` | `src/pages/PreviousTalks.tsx` |
| `talk_details_retry_click` | Retry on talk details error state | - | `src/pages/TalkDetails.tsx` |
| `talk_details_back_to_events_click` | Back to events clicks | `context` | `src/pages/TalkDetails.tsx` |
| `talk_details_location_click` | Location map click in talk details | `event_id`, `event_title`, `location` | `src/pages/TalkDetails.tsx` |
| `talk_details_speaker_link_click` | Speaker external profile click | `event_id`, `speaker_id`, `link_type` | `src/pages/TalkDetails.tsx` |
| `talk_details_eventbrite_click` | Eventbrite button in upcoming talk details | `event_id`, `event_title`, `target` | `src/pages/TalkDetails.tsx` |
| `talk_details_related_talk_click` | Related talk card click | `source_event_id`, `target_event_id`, `target_event_title` | `src/pages/TalkDetails.tsx` |

## Jobs Events
| Event | Trigger | Key Params | Source |
|---|---|---|---|
| `jobs_view_details_click` | Job card/details link click | `job_id`, `job_slug`, `company_name`, `click_area` | `src/pages/Jobs.tsx` |
| `jobs_submit_job_post_click` | Jobs page post-job CTA | `source` | `src/pages/Jobs.tsx` |
| `job_post_plans_back_click` | Back from plan page | `target` | `src/pages/JobPostPlans.tsx` |
| `job_post_plan_select` | Select plan click | `plan_type`, `plan_price_aud` | `src/pages/JobPostPlans.tsx` |
| `job_detail_back_to_jobs_click` | Back to jobs from detail page | `source` | `src/pages/JobDetail.tsx` |
| `job_external_apply_click` | External apply click | `job_id`, `job_slug`, `company_name`, `target` | `src/pages/JobDetail.tsx` |
| `job_easy_apply_modal_open` | Easy apply modal opened | `job_id`, `job_slug` | `src/pages/JobDetail.tsx` |
| `job_easy_apply_modal_close` | Easy apply modal closed | `job_id`, `job_slug`, `source` | `src/pages/JobDetail.tsx` |
| `job_easy_apply_submit` | Easy apply form submit attempt | `job_id`, `job_slug`, `company_name` | `src/pages/JobDetail.tsx` |
| `job_easy_apply_success` | Easy apply submit success | `job_id`, `job_slug`, `company_name` | `src/pages/JobDetail.tsx` |
| `job_easy_apply_error` | Easy apply submit failure | `job_id`, `job_slug`, `message` | `src/pages/JobDetail.tsx` |
| `job_submit_back_click` | Back click from job submit page | `target` | `src/pages/JobSubmit.tsx` |
| `job_submit_application_mode_select` | Application mode changed | `mode` | `src/pages/JobSubmit.tsx` |
| `job_submit_change_plan_click` | Change plan click | `target` | `src/pages/JobSubmit.tsx` |
| `job_post_save_draft_submit` | Save draft attempt | `draft_id`, `package_type` | `src/pages/JobSubmit.tsx` |
| `job_post_save_draft_success` | Save draft success | `draft_id`, `package_type` | `src/pages/JobSubmit.tsx` |
| `job_post_save_draft_error` | Save draft error | `draft_id`, `package_type`, `message` | `src/pages/JobSubmit.tsx` |
| `job_post_access_link_submit` | Access link request attempt | `draft_id` | `src/pages/JobSubmit.tsx` |
| `job_post_access_link_success` | Access link request success | `draft_id` | `src/pages/JobSubmit.tsx` |
| `job_post_access_link_error` | Access link request error | `draft_id`, `message` | `src/pages/JobSubmit.tsx` |
| `job_post_publish_submit` | Publish/submit attempt | `draft_id`, `package_type`, `payments_disabled` | `src/pages/JobSubmit.tsx` |
| `job_post_publish_success` | Publish submitted (payments disabled flow) | `draft_id`, `package_type`, `payments_disabled` | `src/pages/JobSubmit.tsx` |
| `job_post_publish_error` | Publish error | `draft_id`, `package_type`, `message` | `src/pages/JobSubmit.tsx` |
| `job_post_checkout_redirect` | Redirect to Stripe checkout | `draft_id`, `package_type`, `target` | `src/pages/JobSubmit.tsx` |
| `job_post_payment_confirm_success` | Post-payment review submit success | `draft_id`, `package_type` | `src/pages/JobSubmit.tsx` |
| `job_post_payment_confirm_error` | Post-payment review submit failure | `draft_id`, `package_type`, `message` | `src/pages/JobSubmit.tsx` |

## Community Form Events
| Event | Trigger | Key Params | Source |
|---|---|---|---|
| `newsletter_subscribe_submit` | Newsletter submit attempt | `source` | `src/components/NewsletterSignup.tsx` |
| `newsletter_subscribe_success` | Newsletter subscribe success | `source` | `src/components/NewsletterSignup.tsx` |
| `newsletter_subscribe_error` | Newsletter subscribe error | `source`, `message` | `src/components/NewsletterSignup.tsx` |
| `newsletter_privacy_policy_click` | Newsletter privacy policy click | `source` | `src/components/NewsletterSignup.tsx` |
| `volunteer_profession_select` | Volunteer profession choice | `value` | `src/pages/BecomeMember.tsx` |
| `volunteer_application_submit` | Volunteer submit attempt | `source`, `profession` | `src/pages/BecomeMember.tsx` |
| `volunteer_application_success` | Volunteer submit success | `source` | `src/pages/BecomeMember.tsx` |
| `volunteer_application_error` | Volunteer submit error | `source`, `message` | `src/pages/BecomeMember.tsx` |
| `volunteer_code_of_conduct_click` | Volunteer form code-of-conduct click | - | `src/pages/BecomeMember.tsx` |
| `volunteer_application_return_home_click` | Volunteer success page return home | - | `src/pages/BecomeMember.tsx` |
| `volunteer_page_cta_click` | Volunteer page CTA clicks | `cta_id`, `target` | `src/pages/BecomeMember.tsx` |
| `speaker_application_submit` | Speaker submit attempt | `source`, `topic_undecided` | `src/pages/BecomeSpeaker.tsx` |
| `speaker_application_success` | Speaker submit success | `source` | `src/pages/BecomeSpeaker.tsx` |
| `speaker_application_error` | Speaker submit error | `source`, `message` | `src/pages/BecomeSpeaker.tsx` |
| `speaker_application_contact_click` | Speaker contact mail click | `target` | `src/pages/BecomeSpeaker.tsx` |
| `speaker_application_return_home_click` | Speaker success page return home | - | `src/pages/BecomeSpeaker.tsx` |
| `sponsor_inquiry_submit` | Sponsor inquiry submit attempt | `source`, `sponsorship_type` | `src/pages/BecomeSponsor.tsx` |
| `sponsor_inquiry_success` | Sponsor inquiry success | `source` | `src/pages/BecomeSponsor.tsx` |
| `sponsor_inquiry_error` | Sponsor inquiry error | `source`, `message` | `src/pages/BecomeSponsor.tsx` |
| `sponsor_pack_download_click` | Sponsor pack download click | `target` | `src/pages/BecomeSponsor.tsx` |
| `sponsor_contact_click` | Sponsor contact mail click | `target` | `src/pages/BecomeSponsor.tsx` |
| `sponsor_view_current_sponsors_click` | Sponsor page link to sponsors/home | `target` | `src/pages/BecomeSponsor.tsx` |
| `sponsor_inquiry_return_home_click` | Sponsor success page return home | - | `src/pages/BecomeSponsor.tsx` |

## Service + System Events (normalized from `trackAnalyticsEvent`)
These are generated via `trackAnalyticsEvent(...)` and normalized to snake_case by `src/services/analytics.ts`.

| Event | Original Label | Source |
|---|---|---|
| `client_error_boundary_triggered` | Client error boundary triggered | `src/components/ErrorBoundary.tsx` |
| `form_submit_failed` | Form submit failed | `src/services/forms.ts` |
| `form_submit_blocked` | Form submit blocked | `src/services/forms.ts` |
| `newsletter_already_subscribed` | Newsletter already subscribed | `src/services/forms.ts` |
| `form_submitted` | Form submitted | `src/services/forms.ts` |
| `newsletter_mailchimp_sync_failed` | Newsletter Mailchimp sync failed | `src/services/forms.ts` |
| `newsletter_mailchimp_synced` | Newsletter Mailchimp synced | `src/services/forms.ts` |
| `job_draft_saved` | Job draft saved | `src/services/jobs.ts` |
| `job_draft_magic_link_sent` | Job draft magic link sent | `src/services/jobs.ts` |
| `job_publish_requested` | Job publish requested | `src/services/jobs.ts` |
| `job_submitted_for_review_payments_disabled` | Job submitted for review (payments disabled) | `src/services/jobs.ts` |
| `job_published_by_admin` | Job published by admin | `src/services/jobs.ts` |
| `job_application_submitted` | Job application submitted | `src/services/jobs.ts` |

## Notes
- GTM can key off `event` directly.
- For broad reporting, use `event` as primary dimension and optional params (`source`, `cta_id`, `job_slug`, `event_id`) for drill-down.
- Anonymous form tracking uses `getAnalyticsAnonymousId()` in `src/services/forms.ts`.
