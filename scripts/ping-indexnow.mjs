import { readFileSync, existsSync } from 'node:fs';

const HOST = 'deutsch-meister.de';
const BATCH_SIZE = 10_000;
const INDEXNOW_API = 'https://api.indexnow.org/IndexNow';

const key = process.env.INDEXNOW_KEY;
if (!key) {
  console.error('ERROR: INDEXNOW_KEY env var is not set.');
  process.exit(1);
}

// The PAGE sitemaps, not the index. public/sitemap.xml is a <sitemapindex> whose
// only two <loc> values are the two child sitemaps — reading it first meant this
// script would have submitted those two sitemap URLs to IndexNow and never a
// single page. The bug was invisible because INDEXNOW_KEY is unset, so the script
// exits before reaching here.
const sitemapPaths = ['dist/sitemap-0.xml', 'dist/sitemap-spa.xml'];
const present = sitemapPaths.filter((p) => existsSync(p));
if (present.length === 0) {
  console.error(`ERROR: No page sitemap found. Tried: ${sitemapPaths.join(', ')}`);
  process.exit(1);
}

const urls = [
  ...new Set(
    present.flatMap((p) =>
      [...readFileSync(p, 'utf-8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim()),
    ),
  ),
];

if (urls.length === 0) {
  console.error('ERROR: No <loc> URLs found in sitemap.');
  process.exit(1);
}

console.log(`Found ${urls.length} URLs to submit.\n`);

const keyLocation = `https://${HOST}/${key}.txt`;

for (let i = 0; i < urls.length; i += BATCH_SIZE) {
  const batch = urls.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

  const payload = { host: HOST, key, keyLocation, urlList: batch };

  console.log(`Submitting batch ${batchNum}/${totalBatches} (${batch.length} URLs)...`);

  try {
    const res = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 202) {
      console.log(`  OK (${res.status})`);
    } else {
      const body = await res.text().catch(() => '');
      console.error(`  FAIL (${res.status}): ${body}`);
    }
  } catch (err) {
    console.error(`  FAIL: ${err.message}`);
  }
}

console.log('\nDone.');
