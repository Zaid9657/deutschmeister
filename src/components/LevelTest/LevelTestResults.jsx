import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, BookOpen, RefreshCw, Headphones, Mic, PenTool, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { stepDownSublevel, bandOf } from '../../config/levels';
import { getTopicsForLevel } from '../../data/grammarTopics';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import Reveal from '../ui/Reveal.jsx';
import Aurora from '../ui/Aurora.jsx';
import confettiBurst from '../../lib/confetti.js';

// The earned moment (docs/design/playbook.md). Finishing the placement test IS
// a win — one confetti burst, one `celebrate` action — and that is true at
// every level, so nothing on this screen frames the result as a pass or a
// fail. The level is a starting line, not a grade.
//
// Where the old screen leaned on green/orange/red bars, the readout now names
// what it means: every score sits in a chip whose tone follows the SAME
// thresholds the colours used to (limette for strong, aprikose for the gaps),
// and the figure itself is always in the chip — colour never carries a meaning
// on its own.

const scoreTone = (value, strong, fair) => (value >= strong ? 'limette' : value >= fair ? 'quiet' : 'aprikose');

const LevelTestResults = ({
  answers,
  questions,
  listeningScore,
  speakingScore,
  determinedSublevel,
  onRetake
}) => {
  const { user } = useAuth();

  // One burst per mount — the ref guards StrictMode's double effect and every
  // later re-render, so the celebration can never repeat itself.
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (celebratedRef.current) return;
    celebratedRef.current = true;
    confettiBurst();
  }, []);

  // Calculate written test scores
  const calculateWrittenResults = () => {
    const typeScores = {
      grammar: { correct: 0, total: 0 },
      vocabulary: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 }
    };
    const weakTopics = [];

    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) return;

      typeScores[answer.type].total++;

      if (answer.isCorrect) {
        typeScores[answer.type].correct++;
      } else {
        const existingTopic = weakTopics.find(t => t.topic === question.topicDisplayName);
        if (existingTopic) {
          existingTopic.wrong++;
        } else {
          weakTopics.push({
            topic: question.topicDisplayName,
            // Grammar lessons are Astro-served — canonical trailing-slash form,
            // rendered as full-load <a> tags below.
            url: question.relatedTopicUrl.endsWith('/')
              ? question.relatedTopicUrl
              : `${question.relatedTopicUrl}/`,
            wrong: 1,
            level: answer.level
          });
        }
      }
    });

    return { typeScores, weakTopics };
  };

  const { typeScores, weakTopics } = calculateWrittenResults();

  // Get top weak topics for recommendations
  const topWeakTopics = weakTopics
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 3);

  // Calculate percentages
  const getTypePercentage = (type) => {
    if (typeScores[type].total === 0) return 0;
    return Math.round((typeScores[type].correct / typeScores[type].total) * 100);
  };

  const totalCorrect = answers.filter(a => a.isCorrect).length;
  const totalAnswered = answers.length;
  const writtenPercentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Speaking scores breakdown
  const speakingPercentage = speakingScore?.score || speakingScore?.total_score || 0;

  // Calculate final adjusted level based on all sections.
  //
  // The demotion used to be `finalSublevel.replace('.2', '.1')`, which is a
  // no-op on any sub-level already ending in '.1'. So a strong written score
  // with a failed listening section produced e.g. B2.1 and stayed B2.1 — the
  // rule fired and changed nothing. Stepping down the shared ladder handles
  // band boundaries too (B2.1 → B1.2).
  const calculateFinalLevel = () => {
    let finalSublevel = determinedSublevel || 'A1.1';
    const demotions = [];

    if (listeningScore != null && listeningScore < 50 && writtenPercentage >= 70) {
      demotions.push('listening');
    }
    if (speakingPercentage > 0 && speakingPercentage < 50 && writtenPercentage >= 70) {
      demotions.push('speaking');
    }

    if (demotions.length) {
      finalSublevel = stepDownSublevel(finalSublevel, demotions.length);
    }

    // Keep the band label consistent with the (possibly demoted) sub-level
    // rather than reporting the pre-adjustment band.
    return { level: bandOf(finalSublevel), sublevel: finalSublevel, demotions };
  };

  const { sublevel: finalSublevel, demotions } = calculateFinalLevel();

  // Deep link into the first lesson of the placed level. Grammar lessons are
  // served by the Astro build, so this must be rendered as a full-load <a>
  // (trailing-slash class). Falls back to the hub if the topic list ever
  // comes back empty for a level.
  const firstTopic = getTopicsForLevel(finalSublevel.toLowerCase())[0];
  const firstLessonHref = firstTopic
    ? `/grammar/${finalSublevel.toLowerCase()}/${firstTopic.slug}/`
    : '/grammar/';

  // Section completion status
  const sections = [
    {
      name: 'Written',
      icon: PenTool,
      completed: true,
      score: writtenPercentage,
      detail: `${totalCorrect}/${totalAnswered} correct`
    },
    {
      name: 'Listening',
      icon: Headphones,
      completed: listeningScore != null,
      score: listeningScore,
      detail: listeningScore != null ? `${listeningScore}%` : 'Skipped'
    },
    {
      name: 'Speaking',
      icon: Mic,
      completed: speakingScore != null,
      score: speakingPercentage,
      detail: speakingScore ? `${speakingPercentage}/100` : 'Skipped'
    }
  ];

  // Get the scores object from speaking evaluation
  const speakingScoresObj = speakingScore?.scores || null;
  const speakingFeedback = speakingScore?.feedback || null;

  const writtenSkills = [
    { key: 'grammar', label: 'Grammar' },
    { key: 'vocabulary', label: 'Vocabulary' },
    { key: 'reading', label: 'Reading' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 pb-16 sm:pt-20">
      {/* Header */}
      <section className="relative -mx-2 overflow-hidden rounded-clay px-2 py-6 text-center sm:-mx-4 sm:px-4 sm:py-8">
        <Aurora />
        <div className="hero-line relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-pill bg-accent-limette-wash text-accent-limette-ink">
            <Trophy size={34} />
          </span>
          <h1 className="mt-4 font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink sm:text-[1.75rem]">
            Your German Level
          </h1>
        </div>
      </section>

      {/* The figure — the one featured card on the screen */}
      <Reveal delay={80} className="mt-3">
        <Card raised edge="siegel" className="p-6 text-center">
          <p className="font-display text-[3.25rem] font-semibold leading-none tracking-[-0.02em] text-ink">
            {finalSublevel}
          </p>
          {demotions.length > 0 && (
            // Say why the level moved. A silently lowered result reads as a
            // bug to the person who just scored well on the written section.
            <p className="mx-auto mt-4 max-w-prose text-[0.875rem] leading-relaxed text-graphite">
              Adjusted down one sub-level for your{' '}
              {demotions.join(' and ')} {demotions.length > 1 ? 'sections' : 'section'} —
              your written score alone would have placed you higher.
            </p>
          )}
        </Card>
      </Reveal>

      {/* Signup CTA for guests */}
      {!user && (
        <Reveal delay={140} className="mt-4">
          <Card raised edge="siegel" className="p-5 text-center sm:p-6">
            <p className="font-display text-[1.0625rem] font-semibold leading-snug text-ink sm:text-[1.125rem]">
              Save your results and start practicing at {finalSublevel}
            </p>
            <p className="mx-auto mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-graphite">
              Create a free account to track your progress, unlock your level, and get 2 free AI speaking sessions.
            </p>
            <Button className="mt-4" to={`/signup?level=${finalSublevel}`}>
              Sign up free — save my results
            </Button>
          </Card>
        </Reveal>
      )}

      {/* Section Summary — reference rows, flat */}
      <Reveal delay={180} className="mt-8">
        <h2 className="font-display text-[1.25rem] font-semibold tracking-[-0.01em] text-ink">Test Summary</h2>
        <Card className="mt-3 overflow-hidden">
          {sections.map((section, index) => {
            // Special treatment: speaking row for logged-out users who skipped it
            if (section.name === 'Speaking' && !section.completed && !user) {
              return (
                <div key={index} className="border-b border-rule px-4 py-3.5 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-pill bg-accent-aprikose-wash text-accent-aprikose-ink">
                      <Mic size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] font-bold text-ink">Speaking</span>
                      <span className="block text-[0.8125rem] font-bold text-accent-aprikose-ink">
                        Not tested yet — try a free session
                      </span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" to="/speaking/" className="ml-0 mt-3 sm:ml-[3.25rem]">
                    <Mic size={14} />
                    Try a free AI speaking session at {finalSublevel}
                  </Button>
                </div>
              );
            }

            const Icon = section.icon;
            return (
              <div key={index} className="flex items-center gap-3 border-b border-rule px-4 py-3.5 last:border-b-0">
                <span
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-pill ${
                    section.completed ? 'bg-siegel-wash text-siegel' : 'bg-paper-sunk text-graphite'
                  }`}
                >
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-bold text-ink">{section.name}</span>
                  <span className="block font-data text-[0.75rem] text-graphite">{section.detail}</span>
                </div>
                {section.completed ? (
                  <CheckCircle2 size={20} className="flex-shrink-0 text-accent-limette-ink" aria-hidden="true" />
                ) : (
                  <XCircle size={20} className="flex-shrink-0 text-graphite" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </Card>
      </Reveal>

      {/* Written Test Breakdown */}
      <Reveal delay={220} className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-[1.25rem] font-semibold tracking-[-0.01em] text-ink">
          <PenTool size={20} className="text-siegel" aria-hidden="true" />
          Written Test Breakdown
        </h2>
        <Card className="mt-3 overflow-hidden">
          {writtenSkills.map((skill) => {
            const pct = getTypePercentage(skill.key);
            return (
              <div key={skill.key} className="border-b border-rule px-5 py-4 last:border-b-0">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-[0.875rem] font-bold text-ink">{skill.label}</span>
                  <Chip tone={scoreTone(pct, 70, 50)}>{pct}%</Chip>
                </div>
                <div className="h-2 overflow-hidden rounded-pill bg-paper-sunk" aria-hidden="true">
                  {/* Dynamic: the measured share for this skill. */}
                  <div className="h-full rounded-pill bg-siegel" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </Card>
      </Reveal>

      {/* Listening Score (if taken) */}
      {listeningScore != null && (
        <Reveal delay={260} className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-[1.25rem] font-semibold tracking-[-0.01em] text-ink">
            <Headphones size={20} className="text-siegel" aria-hidden="true" />
            Listening Comprehension
          </h2>
          <Card className="mt-3 p-5">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <p className="font-display text-[2.25rem] font-semibold leading-none tracking-[-0.02em] text-ink">
                {listeningScore}%
              </p>
              <p className="flex-1 text-[0.9375rem] leading-relaxed text-graphite">
                {listeningScore >= 70 && 'Strong listening comprehension at this level'}
                {listeningScore >= 50 && listeningScore < 70 && 'Good foundation, some practice recommended'}
                {listeningScore < 50 && 'Focus on listening exercises to improve'}
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-pill bg-paper-sunk" aria-hidden="true">
              {/* Dynamic: the measured listening share. */}
              <div className="h-full rounded-pill bg-siegel" style={{ width: `${listeningScore}%` }} />
            </div>
          </Card>
        </Reveal>
      )}

      {/* Speaking Score (if taken) */}
      {speakingScore && (
        <Reveal delay={300} className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-[1.25rem] font-semibold tracking-[-0.01em] text-ink">
            <Mic size={20} className="text-siegel" aria-hidden="true" />
            Speaking Evaluation
          </h2>
          <Card className="mt-3 p-5">
            <div className="flex flex-col items-center gap-1 border-b border-rule pb-4">
              <p className="font-display text-[2.75rem] font-semibold leading-none tracking-[-0.02em] text-ink">
                {speakingPercentage}
              </p>
              <span className="text-[0.875rem] text-graphite">Overall Score</span>
            </div>

            {speakingScoresObj && (
              <div className="mt-4 flex flex-col gap-3">
                {Object.entries(speakingScoresObj).map(([key, value]) => {
                  const labels = {
                    pronunciation: 'Aussprache',
                    grammar: 'Grammatik',
                    vocabulary: 'Wortschatz',
                    fluency: 'Flüssigkeit',
                    comprehension: 'Verständnis'
                  };
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="text-[0.875rem] font-bold text-ink">{labels[key] || key}</span>
                        <Chip tone={scoreTone(value, 16, 12)}>{value}/20</Chip>
                      </div>
                      <div className="h-2 overflow-hidden rounded-pill bg-paper-sunk" aria-hidden="true">
                        {/* Dynamic: this criterion's share of its 20 points. */}
                        <div className="h-full rounded-pill bg-siegel" style={{ width: `${(value / 20) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {speakingFeedback && (
              <Card tone="sunk" className="mt-4 p-4">
                <p className="text-[0.9375rem] leading-relaxed text-graphite">{speakingFeedback}</p>
              </Card>
            )}
          </Card>
        </Reveal>
      )}

      {/* Weak Areas — the gaps, on aprikose, under a heading that says so */}
      {topWeakTopics.length > 0 && (
        <Reveal delay={340} className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-[1.25rem] font-semibold tracking-[-0.01em] text-ink">
            <BookOpen size={20} className="text-siegel" aria-hidden="true" />
            Areas to Focus On
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {topWeakTopics.map((topic, index) => (
              <a
                key={index}
                href={topic.url}
                className="inline-flex items-center rounded-pill bg-accent-aprikose-wash px-3.5 py-1.5 text-sm font-bold text-accent-aprikose-ink shadow-raise-aprikose transition-all duration-100 ease-snap select-none active:translate-y-1 active:shadow-none"
              >
                {topic.topic}
              </a>
            ))}
          </div>
        </Reveal>
      )}

      {/* Recommendations */}
      <Reveal delay={380} className="mt-8">
        <h2 className="font-display text-[1.25rem] font-semibold tracking-[-0.01em] text-ink">Recommended Next Steps</h2>
        <div className="mt-3 flex flex-col gap-3">
          <Card interactive as={Link} to="/speaking/" className="flex items-center gap-4 p-4">
            <span className="text-2xl" aria-hidden="true">🗣️</span>
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-bold text-ink">Practice Speaking with AI</span>
              <span className="mt-0.5 block text-[0.8125rem] leading-snug text-graphite">
                Have a real conversation at your {finalSublevel} level and get instant feedback on pronunciation, grammar, and vocabulary.
              </span>
            </span>
          </Card>

          <Card interactive as="a" href={`/grammar/${finalSublevel.toLowerCase()}/`} className="flex items-center gap-4 p-4">
            <span className="text-2xl" aria-hidden="true">📚</span>
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-bold text-ink">Start {finalSublevel} Grammar</span>
              <span className="mt-0.5 block text-[0.8125rem] leading-snug text-graphite">Begin with grammar topics at your level</span>
            </span>
          </Card>

          {listeningScore != null && listeningScore < 70 && (
            <Card interactive as={Link} to="/listening/" className="flex items-center gap-4 p-4">
              <span className="text-2xl" aria-hidden="true">🎧</span>
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-bold text-ink">Practice Listening</span>
                <span className="mt-0.5 block text-[0.8125rem] leading-snug text-graphite">Improve your comprehension skills</span>
              </span>
            </Card>
          )}

          {speakingScore && speakingPercentage < 70 && (
            <Card interactive as={Link} to="/speaking/" className="flex items-center gap-4 p-4">
              <span className="text-2xl" aria-hidden="true">🗣️</span>
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-bold text-ink">More Speaking Practice</span>
                <span className="mt-0.5 block text-[0.8125rem] leading-snug text-graphite">Build confidence with AI conversations</span>
              </span>
            </Card>
          )}

          {topWeakTopics[0] && (
            <Card interactive as="a" href={topWeakTopics[0].url} className="flex items-center gap-4 p-4">
              <span className="text-2xl" aria-hidden="true">🎯</span>
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-bold text-ink">Review {topWeakTopics[0].topic}</span>
                <span className="mt-0.5 block text-[0.8125rem] leading-snug text-graphite">Strengthen your weakest area</span>
              </span>
            </Card>
          )}
        </div>
      </Reveal>

      {/* Actions — the primary CTA lands the learner in their actual first
          lesson, not a hub. 85% of signups never opened a lesson while this
          button pointed at the grammar hub. */}
      <Reveal delay={420} className="mt-8 flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row">
        <Button variant="secondary" onClick={onRetake}>
          <RefreshCw size={18} />
          Retake Test
        </Button>
        <Button variant="celebrate" size="lg" href={firstLessonHref} className="flex-1">
          Start your first lesson
        </Button>
      </Reveal>
    </div>
  );
};

export default LevelTestResults;
