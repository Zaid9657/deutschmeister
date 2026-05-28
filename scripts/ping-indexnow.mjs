import { readFileSync, existsSync } from 'node:fs';

const HOST = 'www.deutsch-meister.de';
const BATCH_SIZE = 10_000;
const INDEXNOW_API = 'https://api.indexnow.org/IndexNow';

const key = process.env.INDEXNOW_KEY;
if (!key) {
  console.error('ERROR: INDEXNOW_KEY env var is not set.');
  process.exit(1);
}

const sitemapPaths = ['public/sitemap.xml', 'dist/sitemap-0.xml', 'dist/sitemap.xml'];
const sitemapPath = sitemapPaths.find((p) => existsSync(p));
if (!sitemapPath) {
  console.error(`ERROR: No sitemap found. Tried: ${sitemapPaths.join(', ')}`);
  process.exit(1);
}

console.log(`Reading sitemap: ${sitemapPath}`);
const xml = readFileSync(sitemapPath, 'utf-8');
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

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
