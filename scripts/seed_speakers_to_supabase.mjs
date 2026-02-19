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

const speakers = [
  {
    full_name: 'Aisha Rahman',
    headline: 'Head of Analytics Engineering, FinNova',
    bio: 'Aisha leads analytics engineering teams and helps organizations build trusted semantic layers and modern ELT workflows.',
    photo_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    linkedin_url: 'https://www.linkedin.com/in/aisha-rahman-analytics',
    website_url: 'https://example.com/aisha-rahman',
    is_active: true,
  },
  {
    full_name: 'Liam Chen',
    headline: 'Principal Data Scientist, OrbitPay',
    bio: 'Liam focuses on experimentation, causal inference, and product decision systems for fast-moving consumer products.',
    photo_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    linkedin_url: 'https://www.linkedin.com/in/liam-chen-data',
    website_url: 'https://example.com/liam-chen',
    is_active: true,
  },
  {
    full_name: 'Priya Nair',
    headline: 'Director of Product Analytics, ScaleOS',
    bio: 'Priya has built analytics practices across APAC and specializes in product growth, retention strategy, and experimentation culture.',
    photo_url: 'https://randomuser.me/api/portraits/women/68.jpg',
    linkedin_url: 'https://www.linkedin.com/in/priya-nair-product-analytics',
    website_url: 'https://example.com/priya-nair',
    is_active: true,
  },
  {
    full_name: 'Ethan Wallace',
    headline: 'Staff Data Engineer, CloudPulse',
    bio: 'Ethan designs event-driven data platforms and governance patterns for analytics teams at scale.',
    photo_url: 'https://randomuser.me/api/portraits/men/71.jpg',
    linkedin_url: 'https://www.linkedin.com/in/ethan-wallace-data',
    website_url: 'https://example.com/ethan-wallace',
    is_active: true,
  },
  {
    full_name: 'Sofia Martinez',
    headline: 'Analytics Lead, BrightRetail',
    bio: 'Sofia helps retail and ecommerce teams translate customer behavior into actionable growth and lifecycle strategies.',
    photo_url: 'https://randomuser.me/api/portraits/women/52.jpg',
    linkedin_url: 'https://www.linkedin.com/in/sofia-martinez-analytics',
    website_url: 'https://example.com/sofia-martinez',
    is_active: true,
  },
];

let inserted = 0;
let updated = 0;
let failed = 0;

for (const speaker of speakers) {
  const existingResult = await supabase
    .from('speakers')
    .select('id')
    .eq('full_name', speaker.full_name)
    .limit(1);

  if (existingResult.error) {
    failed += 1;
    console.log(`SEED_ERROR lookup ${speaker.full_name}`);
    console.log(existingResult.error.message);
    continue;
  }

  const existingId = existingResult.data?.[0]?.id ?? null;

  if (existingId) {
    const updateResult = await supabase
      .from('speakers')
      .update({
        headline: speaker.headline,
        bio: speaker.bio,
        photo_url: speaker.photo_url,
        linkedin_url: speaker.linkedin_url,
        website_url: speaker.website_url,
        is_active: speaker.is_active,
      })
      .eq('id', existingId);

    if (updateResult.error) {
      failed += 1;
      console.log(`SEED_ERROR update ${speaker.full_name}`);
      console.log(updateResult.error.message);
      continue;
    }

    updated += 1;
    continue;
  }

  const insertResult = await supabase.from('speakers').insert(speaker);
  if (insertResult.error) {
    failed += 1;
    console.log(`SEED_ERROR insert ${speaker.full_name}`);
    console.log(insertResult.error.message);
    continue;
  }

  inserted += 1;
}

console.log(`SEED_DONE speakers inserted=${inserted} updated=${updated} failed=${failed}`);
