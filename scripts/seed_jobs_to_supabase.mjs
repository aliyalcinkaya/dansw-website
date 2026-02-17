import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function readEnvFile(path) {
  const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

const env = readEnvFile('.env');
const url = (env.VITE_SUPABASE_URL || '').trim();
const key = (env.VITE_SUPABASE_ANON_KEY || '').trim();
if (!url || !key) {
  console.log('MISSING_SUPABASE_ENV');
  process.exit(0);
}

const supabase = createClient(url, key);

const baseJobs = [
  {
    slug: 'head-of-growth-analytics-crypto-com',
    title: 'Head of Growth Analytics',
    company_name: 'Crypto.com',
    company_website: 'https://crypto.com',
    location_text: 'Sydney, New South Wales, Australia',
    location_mode: 'hybrid',
    employment_type: 'full-time',
    seniority_level: 'director',
    salary_min: 220000,
    salary_max: 280000,
  },
  {
    slug: 'seo-specialist-rd',
    title: 'SEO Specialist',
    company_name: 'RD',
    company_website: 'https://www.linkedin.com/company/rd',
    location_text: 'Remote (Europe-friendly timezone overlap)',
    location_mode: 'remote',
    employment_type: 'full-time',
    seniority_level: 'senior',
    salary_min: 95000,
    salary_max: 125000,
  },
  {
    slug: 'senior-product-analyst-atlassian',
    title: 'Senior Product Analyst',
    company_name: 'Atlassian',
    company_website: 'https://www.atlassian.com',
    location_text: 'Sydney, NSW (Hybrid)',
    location_mode: 'hybrid',
    employment_type: 'full-time',
    seniority_level: 'senior',
    salary_min: 170000,
    salary_max: 210000,
  },
  {
    slug: 'manager-risk-analytics-commonwealth-bank',
    title: 'Manager, Risk Analytics',
    company_name: 'Commonwealth Bank',
    company_website: 'https://www.commbank.com.au',
    location_text: 'Sydney, NSW (On-site)',
    location_mode: 'onsite',
    employment_type: 'full-time',
    seniority_level: 'manager',
    salary_min: 180000,
    salary_max: 230000,
  },
  {
    slug: 'staff-data-scientist-doordash',
    title: 'Staff Data Scientist',
    company_name: 'DoorDash',
    company_website: 'https://www.doordash.com',
    location_text: 'Remote (APAC)',
    location_mode: 'remote',
    employment_type: 'full-time',
    seniority_level: 'lead',
    salary_min: 210000,
    salary_max: 285000,
  },
  {
    slug: 'senior-consumer-insights-analyst-nike',
    title: 'Senior Consumer Insights Analyst',
    company_name: 'Nike',
    company_website: 'https://www.nike.com',
    location_text: 'Melbourne, VIC (Hybrid)',
    location_mode: 'hybrid',
    employment_type: 'full-time',
    seniority_level: 'senior',
    salary_min: 140000,
    salary_max: 180000,
  },
  {
    slug: 'principal-marketing-analytics-manager-apple',
    title: 'Principal Marketing Analytics Manager',
    company_name: 'Apple',
    company_website: 'https://www.apple.com',
    location_text: 'Sydney, NSW (Hybrid)',
    location_mode: 'hybrid',
    employment_type: 'full-time',
    seniority_level: 'director',
    salary_min: 250000,
    salary_max: 330000,
  },
];

const jobs = baseJobs.map((job) => {
  const keyword = encodeURIComponent(`${job.title} ${job.company_name}`);
  return {
    ...job,
    status: 'draft',
    payment_status: 'unpaid',
    salary_currency: 'AUD',
    salary_period: 'year',
    summary: `Opportunity to join ${job.company_name} in a high-impact ${job.title} role.`,
    responsibilities:
      'Lead key analytics initiatives, partner with stakeholders, and improve decision quality with data.',
    requirements:
      'Strong SQL and analytics experience, strong communication, and proven business impact.',
    application_mode: 'external_apply',
    external_apply_url: `https://www.linkedin.com/jobs/search/?keywords=${keyword}`,
    posted_by_email: 'jobs@dawsydney.org.au',
  };
});

let inserted = 0;
let skipped = 0;
let failed = 0;

for (const job of jobs) {
  const { error } = await supabase.from('job_posts').insert(job);

  if (!error) {
    inserted += 1;
    continue;
  }

  if ((error.code ?? '').toUpperCase() === '23505') {
    skipped += 1;
    continue;
  }

  failed += 1;
  console.log(`SEED_ERROR ${job.slug}`);
  console.log(error.message);
}

console.log(`SEED_DONE inserted=${inserted} skipped=${skipped} failed=${failed}`);
