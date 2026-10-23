import { curriculumFor } from '../../data/curricula/index.js';
import { A11_META, LANDESKUNDE, WORTFELD_ICONS, WORTFELD_ICON_FALLBACK, lektionMinutesEstimate, courseMinutesEstimate, weeklyEstimate } from '../../data/curricula/a11.meta.js';

export { lektionMinutesEstimate, WORTFELD_ICON_FALLBACK };

// A1 keeps its exact metadata object. Later courses supply metadata beside
// their curriculum; there is no implicit reuse of A1 stories or translations.
export function courseMetaFor(levelOrCurriculum) {
  const curriculum = typeof levelOrCurriculum === 'object' ? levelOrCurriculum : curriculumFor(levelOrCurriculum);
  const level = String(curriculum?.level || levelOrCurriculum || '').toLowerCase();
  if (level === A11_META.level) return A11_META;
  if (!curriculum?.meta) return null;
  return {
    ...curriculum.meta,
    level, code: curriculum.code,
    weeklyEstimate: () => weeklyEstimate(curriculum),
    howItWorksEn: { ...A11_META.howItWorksEn, ...curriculum.meta.howItWorksEn, minutesEstimate: courseMinutesEstimate(curriculum) },
  };
}

export const landeskundeFor = (curriculum) => curriculum.level === 'a1.1' ? LANDESKUNDE : courseMetaFor(curriculum)?.landeskunde || {};
// A1.2 previously used this same generic word-icon table. Keep that rendering.
export const wortfeldIconsFor = (curriculum) => courseMetaFor(curriculum)?.wortfeldIcons || WORTFELD_ICONS;

export function courseMetaErrors(curriculum) {
  const meta = curriculum.meta;
  if (!meta) return [];
  const errors = [];
  for (const l of curriculum.lektionen || []) {
    const intro = meta.lektionIntro?.[l.id];
    if (!intro?.situationEn || !Array.isArray(intro.canDoEn) || intro.canDoEn.length !== l.canDo?.length || intro.canDoEn.some((s) => !s)) errors.push(`${l.id}: metadata needs situationEn and parallel canDoEn`);
  }
  const chapters = meta.chapters || [];
  const covered = chapters.flatMap((c) => c.lektionen || []);
  if (JSON.stringify(covered) !== JSON.stringify((curriculum.lektionen || []).map((l) => l.nr))) errors.push('metadata chapters must cover every lesson once in order');
  if (chapters.some((c) => !c.titleDe || !c.titleEn || !c.storyEn)) errors.push('metadata chapters need German/English titles and storyEn');
  if (!Array.isArray(meta.characters) || meta.characters.some((c) => !c.name || !c.roleEn || !Array.isArray(c.appearsIn))) errors.push('metadata needs named characters with roles and appearsIn');
  for (const note of Object.values(meta.landeskunde || {})) {
    if (!['titleDe', 'titleEn', 'bodyDe', 'bodyEn', 'source'].every((k) => typeof note[k] === 'string' && note[k].trim())) errors.push('Landeskunde needs bilingual copy and a source');
  }
  return errors;
}
