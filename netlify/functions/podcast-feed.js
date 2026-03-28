const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );

  const { data: podcasts, error } = await supabase
    .from('podcasts')
    .select('*')
    .eq('is_published', true)
    .order('sub_level', { ascending: true })
    .order('podcast_order', { ascending: true });

  if (error) {
    console.error('Error fetching podcasts:', error);
    return {
      statusCode: 500,
      body: `Error fetching podcasts: ${error.message}`
    };
  }

  const baseUrl = 'https://deutsch-meister.de';
  const storageBaseUrl = 'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public';

  const items = podcasts.map((ep, index) => {
    // Construct audio URL
    let audioUrl = ep.audio_url;
    if (!audioUrl.startsWith('http')) {
      audioUrl = `${storageBaseUrl}/video-library/${audioUrl}`;
    }

    // Format duration (convert seconds to HH:MM:SS or MM:SS)
    let duration = '10:00';
    if (ep.duration_seconds) {
      const hours = Math.floor(ep.duration_seconds / 3600);
      const mins = Math.floor((ep.duration_seconds % 3600) / 60);
      const secs = Math.floor(ep.duration_seconds % 60);
      duration = hours > 0
        ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    const title = ep.title_en || ep.title_de || `Episode ${index + 1}`;
    const description = ep.description_en || ep.description_de || 'German learning podcast episode';
    const pubDate = ep.created_at ? new Date(ep.created_at).toUTCString() : new Date().toUTCString();
    const episodeNumber = index + 1;
    const season = getLevelSeason(ep.sub_level);

    return `
    <item>
      <title>${escapeXml(title)} - ${ep.sub_level}</title>
      <description><![CDATA[${description}]]></description>
      <itunes:summary>${escapeXml(description)}</itunes:summary>
      <itunes:author>DeutschMeister</itunes:author>
      <itunes:duration>${duration}</itunes:duration>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${audioUrl}" type="audio/mpeg" length="0"/>
      <guid isPermaLink="false">deutschmeister-${ep.id}</guid>
      <itunes:explicit>false</itunes:explicit>
      <itunes:episode>${episodeNumber}</itunes:episode>
      <itunes:season>${season}</itunes:season>
      <itunes:episodeType>full</itunes:episodeType>
      <link>${baseUrl}/podcasts</link>
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DeutschMeister - Learn German Podcast</title>
    <link>${baseUrl}/podcasts</link>
    <language>de</language>
    <copyright>© ${new Date().getFullYear()} DeutschMeister</copyright>
    <description>German language learning podcast for levels A1 to B2. 24 episodes featuring native speaker conversations with full transcripts. Perfect for improving your German listening skills.</description>
    <itunes:author>DeutschMeister</itunes:author>
    <itunes:summary>German language learning podcast for levels A1 to B2. 24 episodes featuring native speaker conversations with full transcripts. Perfect for improving your German listening skills.</itunes:summary>
    <itunes:owner>
      <itunes:name>DeutschMeister</itunes:name>
      <itunes:email>contact@deutsch-meister.de</itunes:email>
    </itunes:owner>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:category text="Education">
      <itunes:category text="Language Learning"/>
    </itunes:category>
    <itunes:image href="${baseUrl}/podcast-cover.jpg"/>
    <image>
      <url>${baseUrl}/podcast-cover.jpg</url>
      <title>DeutschMeister - Learn German Podcast</title>
      <link>${baseUrl}/podcasts</link>
    </image>
    <atom:link href="${baseUrl}/podcast-feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    },
    body: rss
  };
};

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getLevelSeason(level) {
  const seasons = {
    'A1.1': 1, 'A1.2': 2,
    'A2.1': 3, 'A2.2': 4,
    'B1.1': 5, 'B1.2': 6,
    'B2.1': 7, 'B2.2': 8
  };
  return seasons[level] || 1;
}
