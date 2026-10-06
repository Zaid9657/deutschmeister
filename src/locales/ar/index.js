// The Arabic interface bundle (one lazily loaded chunk). It registers the two
// existing tables' Arabic halves — the lesson chrome (src/lib/lesson/strings.js)
// and the app chrome (i18next) — and nothing else: the A1.1 learning-support
// content loads with the course (src/lib/lesson/support.js), not here, so the
// login screen does not download lesson explanations.
import { registerLessonStrings } from '../../lib/lesson/strings.js';
import LESSON_STRINGS_AR from './lesson.js';
import APP_STRINGS_AR from './app.js';

export function register(i18n) {
  registerLessonStrings('ar', LESSON_STRINGS_AR);
  i18n.addResourceBundle('ar', 'translation', APP_STRINGS_AR, true, true);
}
