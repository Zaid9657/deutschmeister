// Only the published cache registry can turn a model suggestion into a link.
export function grammarTopicLink(slug, topics) {
  if (typeof slug !== 'string') return null;
  const topic = topics.find((row) => row.slug === slug && row.is_published === true);
  if (!topic) return null;
  const level = topic.sub_level.toLowerCase();
  return { level, slug: topic.slug, title: topic.title_en, href: `/grammar/${level}/${topic.slug}/` };
}
