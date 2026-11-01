import { curriculumFor, curriculumPath } from '../data/curricula/index.js';

// Only recognized stored tasks become links. No learner text is fetched here.
export function savedWork({ lessons = [], grammar = [], writing = [] } = {}) {
  const tasks = [];
  for (const row of lessons) {
    const level = String(row.level || '').toLowerCase();
    const curriculum = curriculumFor(level);
    const node = curriculum && curriculumPath(curriculum).find((n) => n.id === row.lektion_id);
    if (node) tasks.push({ level, at: row.updated_at, label: `${level.toUpperCase()}: ${node.title}`,
      detail: row.status === 'started' ? 'Begonnen' : 'Bearbeitet',
      next: 'Öffnen Sie Ihren Kursplan für den nächsten Schritt.', href: `/course/${level}` });
  }
  for (const row of grammar) {
    const topic = row.grammar_topics;
    const level = String(topic?.sub_level || '').toLowerCase();
    if (/^[ab][12]\.[12]$/.test(level) && /^[a-z0-9-]+$/.test(topic?.slug || '')) {
      tasks.push({ level, at: row.last_accessed || row.completed_at,
        label: `Grammatik ${level.toUpperCase()}: ${topic.title_de || topic.slug}`,
        detail: row.is_completed ? 'Abgeschlossen' : 'Begonnen',
        next: 'Öffnen Sie Ihr Grammatikthema erneut.', external: true, href: `/grammar/${level}/${topic.slug}/` });
    }
  }
  for (const row of writing) {
    tasks.push({ at: row.created_at, label: 'Schreibaufgabe', detail: 'Gespeichert',
      next: 'Sehen Sie Ihre gespeicherten Schreibaufgaben an.', href: '/schreiben' });
  }
  return tasks.filter((t) => Number.isFinite(Date.parse(t.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0] || null;
}

export async function loadSavedWork(client, userId) {
  const results = await Promise.all([
    client.from('lesson_progress').select('level, lektion_id, status, updated_at').eq('user_id', userId)
      .order('updated_at', { ascending: false }).limit(10),
    client.from('user_grammar_progress').select('is_completed, last_accessed, completed_at, grammar_topics(slug, sub_level, title_de)').eq('user_id', userId)
      .order('last_accessed', { ascending: false }).limit(10),
    client.from('writing_submissions').select('created_at').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(10),
  ]);
  if (results.some((r) => r.error)) throw new Error('Saved work unavailable');
  const [lessons, grammar, writing] = results.map((r) => r.data || []);
  return savedWork({ lessons, grammar, writing });
}
