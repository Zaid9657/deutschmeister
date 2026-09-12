import { Navigate } from 'react-router-dom';
import { LessonPlayer } from './LessonPlayerPage.jsx';
import { FIXTURE_CURRICULUM, FIXTURE_LEKTION } from '../../../tests/fixtures/lektion-fixture.js';
import pool from '../../data/lessonPools/a11.json';

/**
 * DEV ONLY. The lesson engine running against the test fixture, so the nine
 * stages can be looked at before src/data/curricula/a11.js is authored. In a
 * production build this route redirects — the fixture is not content and must
 * never be reachable by a learner.
 */
export default function LessonPreviewPage() {
  if (!import.meta.env.DEV) return <Navigate to="/dashboard" replace />;
  return <LessonPlayer curriculum={FIXTURE_CURRICULUM} lektion={FIXTURE_LEKTION} pool={pool} preview />;
}
