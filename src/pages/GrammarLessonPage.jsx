import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// ─── Color System ───
const GENDER = {
  masculine: { bg: "#EFF6FF", border: "#3B82F6", text: "#1D4ED8" },
  feminine: { bg: "#FEF2F2", border: "#EF4444", text: "#DC2626" },
  neuter: { bg: "#F0FDF4", border: "#22C55E", text: "#16A34A" },
  plural: { bg: "#FFFBEB", border: "#F59E0B", text: "#D97706" },
};

// ─── Reusable Components ───

function SectionHeading({ number, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "52px 0 18px" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", background: "#1a1a1a", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700, flexShrink: 0,
      }}>{number}</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: 0, letterSpacing: "-0.01em" }}>
        {children}
      </h2>
    </div>
  );
}

function P({ children }) {
  return <p style={{ fontSize: 16, lineHeight: 1.85, color: "#333", margin: "0 0 14px" }}>{children}</p>;
}

function KeyBox({ children }) {
  return (
    <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "14px 18px", borderLeft: "4px solid #1a1a1a", margin: "18px 0" }}>
      <p style={{ fontSize: 15, lineHeight: 1.65, color: "#1a1a1a", margin: 0, fontWeight: 500 }}>{children}</p>
    </div>
  );
}

function InlineExample({ de, en, highlight, note }) {
  return (
    <div style={{ background: "#FAFAFA", borderRadius: 8, padding: "14px 18px", margin: "12px 0", borderLeft: "3px solid #CBD5E1" }}>
      <p style={{ fontSize: 17, fontWeight: 600, color: "#1a1a1a", margin: "0 0 2px" }}>
        {highlight ? de.split(highlight).map((part, i, arr) => (
          <span key={i}>{part}{i < arr.length - 1 && (
            <span style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>{highlight}</span>
          )}</span>
        )) : de}
      </p>
      <p style={{ fontSize: 14, color: "#666", margin: "2px 0 0", fontStyle: "italic" }}>{en}</p>
      {note && <p style={{ fontSize: 13, color: "#555", margin: "8px 0 0", borderTop: "1px solid #eee", paddingTop: 8, lineHeight: 1.6 }}>{note}</p>}
    </div>
  );
}

function SideBySide({ left, right }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "16px 0" }}>
      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "14px 18px", border: "1px solid #E2E8F0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{left.label}</div>
        {left.content}
      </div>
      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "14px 18px", border: "1px solid #E2E8F0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{right.label}</div>
        {right.content}
      </div>
    </div>
  );
}

function ExampleBox({ example }) {
  const g = example.gender ? GENDER[example.gender] : { bg: "#FAFAFA", border: "#CBD5E1", text: "#1a1a1a" };
  return (
    <div style={{ background: "#FAFAFA", borderLeft: `4px solid ${g.border}`, borderRadius: "0 8px 8px 0", padding: "16px 20px", margin: "12px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", margin: "0 0 2px" }}>
            {example.highlight ? example.de.split(example.highlight).map((part, i, arr) => (
              <span key={i}>{part}{i < arr.length - 1 && (
                <span style={{ color: g.text, background: g.bg, padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>{example.highlight}</span>
              )}</span>
            )) : example.de}
          </p>
          <p style={{ fontSize: 14, color: "#666", margin: "2px 0 0", fontStyle: "italic" }}>{example.en}</p>
        </div>
        {example.badge && (
          <span style={{ fontSize: 11, fontWeight: 600, color: g.text, background: g.bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
            {example.badge}
          </span>
        )}
      </div>
      {example.note && (
        <p style={{ fontSize: 13, color: "#555", margin: "10px 0 0", lineHeight: 1.55, borderTop: "1px solid #eee", paddingTop: 10 }}>{example.note}</p>
      )}
    </div>
  );
}

function GrammarTable({ data }) {
  return (
    <div style={{ margin: "24px 0" }}>
      {data.title && <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", margin: "0 0 12px" }}>{data.title}</h3>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              {data.headers.map((h, i) => (
                <th key={i} style={{ textAlign: "left", padding: "10px 14px", borderBottom: "2px solid #1a1a1a", fontWeight: 700, fontSize: 13, color: "#555", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {typeof h === 'object' ? h.en : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => {
              const cells = Array.isArray(row) ? row : row.cells || row;
              const g = row.gender ? GENDER[row.gender] : null;
              const changed = row.changed;

              return (
                <tr key={i} style={{ background: changed ? (g ? g.bg : "#f8f8f8") : "transparent" }}>
                  {cells.map((cell, j) => (
                    <td key={j} style={{
                      padding: "10px 14px", borderBottom: "1px solid #eee",
                      fontWeight: j === 0 ? 600 : 400,
                      color: j === 0 && g ? g.text : "#333",
                    }}>{cell}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data.footnote && <p style={{ fontSize: 13, color: "#666", margin: "10px 0 0", fontStyle: "italic", paddingLeft: 14 }}>→ {data.footnote}</p>}
    </div>
  );
}

function MistakeCard({ m }) {
  return (
    <div style={{ margin: "12px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#FEF2F2", borderRadius: 8, padding: "12px 14px", borderLeft: "3px solid #EF4444" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", marginBottom: 4 }}>✗ WRONG</div>
          <div style={{ fontSize: 15, color: "#991B1B" }}>{m.wrong_de || m.wrong_en || m.wrong}</div>
        </div>
        <div style={{ background: "#F0FDF4", borderRadius: 8, padding: "12px 14px", borderLeft: "3px solid #22C55E" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", marginBottom: 4 }}>✓ CORRECT</div>
          <div style={{ fontSize: 15, color: "#166534" }}>{m.correct_de || m.correct_en || m.correct}</div>
        </div>
      </div>
      {(m.explanation_en || m.explanation_de || m.why) && (
        <p style={{ fontSize: 13, color: "#555", margin: "6px 0 0", paddingLeft: 2 }}>
          {m.explanation_en || m.explanation_de || m.why_en || m.why_de || m.why}
        </p>
      )}
      {m.memory_trick_en && <MemoryTrickBox>{m.memory_trick_en}</MemoryTrickBox>}
    </div>
  );
}

function MemoryTrickBox({ children }) {
  return (
    <div style={{ background: "#FFFBEB", borderRadius: 8, padding: "12px 16px", margin: "12px 0", borderLeft: "4px solid #F59E0B", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "#92400E", margin: 0 }}>{children}</p>
    </div>
  );
}

function WarningBox({ children }) {
  return (
    <div style={{ background: "#FFF1F2", borderRadius: 8, padding: "14px 18px", margin: "12px 0", borderLeft: "4px solid #E11D48", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "#9F1239", margin: 0 }}>{children}</p>
    </div>
  );
}

function DialogueExchange({ exchange }) {
  const isA = exchange.speaker === 'A' || exchange.speaker === 'Speaker A';
  return (
    <div style={{ display: "flex", justifyContent: isA ? "flex-start" : "flex-end", margin: "10px 0" }}>
      <div style={{
        maxWidth: "75%", background: isA ? "#EFF6FF" : "#F0FDF4",
        borderRadius: isA ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        padding: "12px 16px", border: `1px solid ${isA ? "#BFDBFE" : "#BBF7D0"}`,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: isA ? "#3B82F6" : "#16A34A", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {exchange.speaker_label || exchange.speaker || (isA ? 'Speaker A' : 'Speaker B')}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>{exchange.german || exchange.de}</div>
        {(exchange.english || exchange.en) && (
          <div style={{ fontSize: 13, color: "#666", fontStyle: "italic" }}>{exchange.english || exchange.en}</div>
        )}
        {exchange.grammar_note && (
          <div style={{ fontSize: 12, color: "#555", marginTop: 6, paddingTop: 6, borderTop: "1px solid #e5e7eb", lineHeight: 1.5 }}>
            {exchange.grammar_note}
          </div>
        )}
      </div>
    </div>
  );
}

const EXPLANATION_TYPE_LABELS = {
  explanation_core: 'Core Concepts',
  explanation_patterns: 'Patterns',
  explanation_comparison: 'Comparison',
  explanation_exceptions: 'Exceptions',
};

function ExplanationTypeLabel({ type }) {
  const label = EXPLANATION_TYPE_LABELS[type] || type;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", padding: "3px 10px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label}
    </span>
  );
}

function Exercise({ exercise, index, onAnswer, userAnswer, showResult }) {
  const isCorrect = userAnswer === exercise.correctAnswer;
  return (
    <div style={{
      background: showResult ? (isCorrect ? "#F0FDF4" : "#FEF2F2") : "#FAFAFA",
      borderRadius: 10, padding: "18px 20px", margin: "10px 0",
      border: showResult ? `1px solid ${isCorrect ? "#BBF7D0" : "#FECACA"}` : "1px solid #eee",
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{
          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
          background: showResult ? (isCorrect ? "#22C55E" : "#EF4444") : "#ddd",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
        }}>{showResult ? (isCorrect ? "✓" : "✗") : index + 1}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", margin: "0 0 10px" }}>{exercise.question}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {exercise.options.map((opt) => {
              const sel = userAnswer === opt, right = opt === exercise.correctAnswer;
              let bg = "#fff", border = "#ddd", color = "#333";
              if (showResult && right) { bg = "#DCFCE7"; border = "#22C55E"; color = "#166534"; }
              else if (showResult && sel && !right) { bg = "#FEE2E2"; border = "#EF4444"; color = "#991B1B"; }
              else if (sel) { bg = "#EFF6FF"; border = "#3B82F6"; color = "#1D4ED8"; }
              return (
                <button key={opt} onClick={() => !showResult && onAnswer(opt)} disabled={showResult}
                  style={{ padding: "8px 16px", borderRadius: 6, border: `1.5px solid ${border}`, background: bg, color, fontSize: 14, fontWeight: sel ? 600 : 400, cursor: showResult ? "default" : "pointer" }}>
                  {opt}
                </button>
              );
            })}
          </div>
          {showResult && exercise.explanation && (
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 6, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
              {exercise.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───
export default function GrammarLessonPage() {
  const { level, topicSlug } = useParams();
  const slug = topicSlug; // Router uses 'topicSlug', we use 'slug' internally
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState(null);
  const [content, setContent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchTopicContent();
  }, [level, slug]);

  const fetchTopicContent = async () => {
    try {
      setLoading(true);

      // 1. Get topic basic info
      const { data: topicData, error: topicError } = await supabase
        .from('grammar_topics')
        .select('*')
        .eq('sub_level', level.toUpperCase())
        .eq('slug', slug)
        .single();

      if (topicError || !topicData) {
        console.error('Topic not found:', topicError);
        setLoading(false);
        return;
      }

      setTopic(topicData);

      // 2. Fetch all content in parallel
      const [rulesRes, examplesRes, exercisesRes] = await Promise.all([
        supabase
          .from('grammar_rules')
          .select('*')
          .eq('topic_id', topicData.id)
          .order('order_index'),
        supabase
          .from('grammar_examples')
          .select('*')
          .eq('topic_id', topicData.id)
          .order('difficulty', { ascending: true })
          .order('order_index'),
        supabase
          .from('grammar_exercises')
          .select('*')
          .eq('topic_id', topicData.id)
          .order('stage')
          .order('order_index'),
      ]);

      const rules = rulesRes.data || [];
      const examples = examplesRes.data || [];
      const exercises = exercisesRes.data || [];

      // DEBUG: Log raw data from Supabase
      console.log('RAW RULES:', rules);
      console.log('RAW EXAMPLES:', examples);
      console.log('RAW EXERCISES:', exercises);

      // 3. Organize content by type
      const introductionRule = rules.find(r => r.rule_type === 'introduction');
      const tables = rules.filter(r => r.rule_type === 'table' || r.rule_type === 'pattern');
      const tips = rules.filter(r => r.rule_type === 'tip' || r.rule_type === 'note');
      const signalWordsRule = rules.find(r => r.rule_type === 'signal_words');
      const summaryRule = rules.find(r => r.rule_type === 'summary');
      const explanations = rules.filter(r =>
        r.rule_type === 'explanation_core' ||
        r.rule_type === 'explanation_patterns' ||
        r.rule_type === 'explanation_comparison' ||
        r.rule_type === 'explanation_exceptions'
      );
      const dialogues = rules.filter(r => r.rule_type === 'dialogue');
      const warnings = rules.filter(r => r.rule_type === 'warning');
      const commonMistakeRules = rules.filter(r => r.rule_type === 'common_mistakes');

      // Collect common mistakes from any rule that has them
      const allMistakes = [];
      rules.forEach(rule => {
        if (rule.common_mistakes && Array.isArray(rule.common_mistakes)) {
          allMistakes.push(...rule.common_mistakes);
        }
      });

      setContent({
        introduction: introductionRule?.content || null,
        tables,
        examples,
        tips,
        signalWords: signalWordsRule?.content || null,
        commonMistakes: allMistakes,
        explanations,
        dialogues,
        warnings,
        commonMistakeRules,
        exercises: exercises
          .map(ex => {
            // Handle different question field names
            const question = ex.question_en || ex.question_de || ex.question || '';

            // Handle options - might be JSONB array or already parsed
            let options = [];
            if (Array.isArray(ex.options)) {
              options = ex.options;
            } else if (typeof ex.options === 'string') {
              try {
                options = JSON.parse(ex.options);
              } catch (e) {
                console.warn('Failed to parse options:', ex.options);
              }
            }

            return {
              question,
              options,
              correctAnswer: ex.correct_answer,
              explanation: ex.explanation_en || ex.explanation_de || ex.explanation || '',
              type: ex.exercise_type,
            };
          })
          // FILTER OUT translation exercises with no options (BUG 1)
          .filter(ex => ex.options && ex.options.length > 0),
        summary: summaryRule?.content || null,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setLoading(false);
    }
  };

  const handleAnswer = useCallback((i, a) => setAnswers(p => ({ ...p, [i]: a })), []);

  const handleSubmit = async () => {
    setSubmitted(true);

    if (user && topic && content?.exercises) {
      const score = content.exercises.filter((e, i) => answers[i] === e.correctAnswer).length;
      const percentage = Math.round((score / content.exercises.length) * 100);
      const completed = percentage >= 70;

      // Save progress to user_grammar_progress
      try {
        await supabase
          .from('user_grammar_progress')
          .upsert({
            user_id: user.id,
            topic_id: topic.id,
            current_stage: 1, // Single page = stage 1
            is_completed: completed,
            score: percentage,
            last_accessed: new Date().toISOString(),
            ...(completed && { completed_at: new Date().toISOString() }),
          });
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!topic || !content) {
    return (
      <div style={{ maxWidth: 720, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 24, color: "#1a1a1a" }}>Topic not found</h1>
        <button onClick={() => navigate(`/grammar/${level}`)} style={{ marginTop: 20, padding: "10px 20px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
          Back to {level.toUpperCase()}
        </button>
      </div>
    );
  }

  const intro = content.introduction;
  const n = Object.keys(answers).length;
  const score = submitted && content.exercises ? content.exercises.filter((e, i) => answers[i] === e.correctAnswer).length : 0;

  let sectionNumber = 1;

  return (
    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", background: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #eee", padding: "20px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <a onClick={() => navigate(`/grammar/${level}`)} style={{ fontSize: 13, color: "#999", textDecoration: "none", cursor: "pointer" }}>
            ← Back to {level.toUpperCase()}
          </a>
        </div>
      </div>

      {/* Title */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 0" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#3B82F6", background: "#EFF6FF", padding: "3px 10px", borderRadius: 4 }}>
            {level.toUpperCase()}
          </span>
          {topic.estimated_time && (
            <>
              <span style={{ fontSize: 12, color: "#999" }}>·</span>
              <span style={{ fontSize: 12, color: "#999" }}>{topic.estimated_time} min</span>
            </>
          )}
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
          {topic.title_en}
        </h1>
        {topic.title_de && (
          <p style={{ fontSize: 20, color: "#888", margin: 0, fontStyle: "italic" }}>{topic.title_de}</p>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Introduction */}
        {intro && (intro.hook_en || intro.english_comparison_en) && (
          <>
            <SectionHeading number={sectionNumber++}>Introduction</SectionHeading>

            {intro.hook_en && <P>{intro.hook_en}</P>}

            {intro.english_comparison_en && intro.german_difference_en && (
              <SideBySide
                left={{ label: "How English Works", content: (
                  <p style={{ fontSize: 14, color: "#333", margin: 0, lineHeight: 1.6 }}>{intro.english_comparison_en}</p>
                )}}
                right={{ label: "How German Does It", content: (
                  <p style={{ fontSize: 14, color: "#333", margin: 0, lineHeight: 1.6 }}>{intro.german_difference_en}</p>
                )}}
              />
            )}

            {intro.preview_example_de && intro.preview_example_en && (
              <InlineExample
                de={intro.preview_example_de}
                en={intro.preview_example_en}
                highlight={intro.preview_highlight}
                note={intro.preview_note_en}
              />
            )}

            {intro.scenario_en && <P>{intro.scenario_en}</P>}
            {intro.why_it_matters_en && <KeyBox>{intro.why_it_matters_en}</KeyBox>}
          </>
        )}

        {/* Deep Dive (Explanations) */}
        {content.explanations.length > 0 && (
          <>
            <SectionHeading number={sectionNumber++}>Deep Dive</SectionHeading>
            {content.explanations.map((exp, i) => {
              const c = exp.content || {};
              return (
                <div key={i} style={{ margin: "20px 0" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "0 0 12px" }}>
                    <ExplanationTypeLabel type={exp.rule_type} />
                    {exp.title_en && (
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{exp.title_en}</h3>
                    )}
                  </div>
                  {c.content_en && <P>{c.content_en}</P>}
                  {c.content_de && !c.content_en && <P>{c.content_de}</P>}
                  {exp.key_insight_en && <KeyBox>{exp.key_insight_en}</KeyBox>}
                  {exp.memory_trick_en && <MemoryTrickBox>{exp.memory_trick_en}</MemoryTrickBox>}
                  {c.headers && c.rows && (
                    <GrammarTable data={{
                      title: c.table_title || null,
                      headers: c.headers,
                      rows: c.rows,
                    }} />
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Grammar Tables */}
        {content.tables.length > 0 && (
          <>
            <SectionHeading number={sectionNumber++}>Grammar Rules</SectionHeading>
            {content.tables.map((table, i) => (
              <div key={i}>
                {table.content?.text && <P>{table.content.text}</P>}
                {table.content?.headers && table.content?.rows && (
                  <GrammarTable data={{
                    title: table.title_en,
                    headers: table.content.headers,
                    rows: table.content.rows,
                  }} />
                )}
              </div>
            ))}
          </>
        )}

        {/* Examples */}
        {content.examples.length > 0 && (
          <>
            <SectionHeading number={sectionNumber++}>Examples</SectionHeading>
            {content.examples.map((ex, i) => (
              <ExampleBox key={i} example={{
                de: ex.sentence_de,
                en: ex.sentence_en,
                highlight: ex.grammar_highlight,
                note: ex.explanation_en,
                gender: ex.gender,
                badge: ex.difficulty === 1 ? 'Easy' : ex.difficulty === 2 ? 'Medium' : ex.difficulty === 3 ? 'Hard' : null,
              }} />
            ))}
          </>
        )}

        {/* Dialogue */}
        {content.dialogues.length > 0 && (
          <>
            <SectionHeading number={sectionNumber++}>Dialogue</SectionHeading>
            {content.dialogues.map((dlg, i) => {
              const c = dlg.content || {};
              return (
                <div key={i} style={{ margin: "18px 0" }}>
                  {(c.context_en || dlg.title_en) && (
                    <P>{c.context_en || dlg.title_en}</P>
                  )}
                  {c.exchanges && Array.isArray(c.exchanges) && (
                    <div style={{ margin: "16px 0", padding: "16px", background: "#FAFAFA", borderRadius: 12 }}>
                      {c.exchanges.map((exchange, ei) => (
                        <DialogueExchange key={ei} exchange={exchange} />
                      ))}
                    </div>
                  )}
                  {c.grammar_focus_en && (
                    <KeyBox>{c.grammar_focus_en}</KeyBox>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Tips & Patterns */}
        {content.tips.length > 0 && (
          <>
            <SectionHeading number={sectionNumber++}>Tips & Patterns</SectionHeading>
            {content.tips.map((tip, i) => {
              const c = tip.content || {};
              return (
                <div key={i} style={{ margin: "18px 0" }}>
                  {tip.title_en && (
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", margin: "0 0 12px" }}>
                      {tip.title_en}
                    </h3>
                  )}

                  {/* Content text (content_en / content_de) */}
                  {(c.content_en || c.content_de) && <P>{c.content_en || c.content_de}</P>}

                  {/* Key insight from the rule */}
                  {tip.key_insight_en && <KeyBox>{tip.key_insight_en}</KeyBox>}

                  {/* Memory trick from the rule */}
                  {tip.memory_trick_en && <MemoryTrickBox>{tip.memory_trick_en}</MemoryTrickBox>}

                  {/* Simple text tip */}
                  {c.text_en && <KeyBox>{c.text_en}</KeyBox>}

                  {/* Verb list with groups (BUG 2 FIX) */}
                  {c.type === 'verb_list' && c.groups && Array.isArray(c.groups) && c.groups.length > 0 && (
                    <div style={{ margin: "12px 0" }}>
                      {c.groups.map((group, gi) => (
                        <div key={gi} style={{ margin: "20px 0" }}>
                          {group.category_en && (
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {group.category_en}
                            </h4>
                          )}
                          {group.verbs && Array.isArray(group.verbs) && (
                            <div style={{ display: "grid", gap: 8 }}>
                              {group.verbs.map((verb, vi) => (
                                <div key={vi} style={{ padding: "10px 14px", background: "#FAFAFA", borderRadius: 6, borderLeft: "3px solid #3B82F6" }}>
                                  <div style={{ fontSize: 15, marginBottom: 2 }}>
                                    <strong style={{ color: "#1a1a1a" }}>{verb.de}</strong>
                                    <span style={{ color: "#666", marginLeft: 6, fontSize: 14 }}>= {verb.en}</span>
                                  </div>
                                  {verb.example && (
                                    <div style={{ fontSize: 13, color: "#888", fontStyle: "italic", marginTop: 4 }}>
                                      "{verb.example}"
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Steps pattern (BUG 2 FIX) */}
                  {c.type === 'steps' && c.steps && Array.isArray(c.steps) && c.steps.length > 0 && (
                    <div style={{ margin: "12px 0" }}>
                      {c.steps.map((step, si) => (
                        <div key={si} style={{ display: "flex", gap: 12, margin: "16px 0", alignItems: "flex-start" }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", background: "#1a1a1a", color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700, flexShrink: 0,
                          }}>
                            {step.step}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
                              {step.title_en}
                            </div>
                            {step.detail_en && (
                              <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
                                {step.detail_en}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pattern or rule text */}
                  {c.pattern_en && (
                    <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "14px 18px", margin: "12px 0", borderLeft: "4px solid #1a1a1a" }}>
                      <p style={{ fontSize: 15, lineHeight: 1.65, color: "#1a1a1a", margin: 0, fontWeight: 500 }}>
                        {c.pattern_en}
                      </p>
                    </div>
                  )}

                  {/* Fallback: if no structured content, show title */}
                  {!c.text_en && !c.content_en && !c.content_de && c.type !== 'verb_list' && c.type !== 'steps' && !c.pattern_en && !tip.key_insight_en && tip.title_en && (
                    <KeyBox>{tip.title_en}</KeyBox>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Signal Words */}
        {content.signalWords && (content.signalWords.verbs || content.signalWords.prepositions) && (
          <>
            <SectionHeading number={sectionNumber++}>Signal Words</SectionHeading>
            {content.signalWords.verbs && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "20px 0 10px" }}>Common Verbs</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 4, margin: "8px 0 16px" }}>
                  {content.signalWords.verbs.map((v, i) => (
                    <div key={i} style={{ padding: "6px 10px", background: "#FAFAFA", borderRadius: 4, fontSize: 14 }}>
                      <strong>{v.de}</strong> <span style={{ color: "#888", fontSize: 13 }}>= {v.en}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {content.signalWords.prepositions && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "20px 0 10px" }}>Prepositions</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 16px" }}>
                  {content.signalWords.prepositions.map((p, i) => (
                    <span key={i} style={{ padding: "7px 16px", borderRadius: 20, background: "#1a1a1a", color: "#fff", fontSize: 14, fontWeight: 600 }}>
                      {p.de} <span style={{ fontWeight: 400, opacity: 0.7 }}>= {p.en}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Common Mistakes */}
        {(content.commonMistakes.length > 0 || content.commonMistakeRules.length > 0) && (
          <>
            <SectionHeading number={sectionNumber++}>Common Mistakes</SectionHeading>
            {/* Mistakes from rule fields (common_mistakes column) */}
            {content.commonMistakes.map((m, i) => (
              <MistakeCard key={`field-${i}`} m={m} />
            ))}
            {/* Mistakes from common_mistakes rule type */}
            {content.commonMistakeRules.map((rule, ri) => {
              const c = rule.content || {};
              return (
                <div key={`rule-${ri}`} style={{ margin: "16px 0" }}>
                  {c.intro_en && <P>{c.intro_en}</P>}
                  {c.mistakes && Array.isArray(c.mistakes) && c.mistakes.map((m, mi) => (
                    <MistakeCard key={mi} m={m} />
                  ))}
                  {rule.memory_trick_en && <MemoryTrickBox>{rule.memory_trick_en}</MemoryTrickBox>}
                </div>
              );
            })}
          </>
        )}

        {/* Warnings */}
        {content.warnings.length > 0 && (
          <>
            <SectionHeading number={sectionNumber++}>Warnings</SectionHeading>
            {content.warnings.map((w, i) => {
              const c = w.content || {};
              return (
                <WarningBox key={i}>{c.content_en || c.content_de || w.title_en || 'Warning'}</WarningBox>
              );
            })}
          </>
        )}

        {/* Exercises */}
        {content.exercises.length > 0 && (
          <>
            <SectionHeading number={sectionNumber++}>Practice</SectionHeading>
            <P>Choose the correct answer. Then click "Check answers" to see your score.</P>

            {content.exercises.map((ex, i) => (
              <Exercise
                key={i}
                exercise={ex}
                index={i}
                onAnswer={(a) => handleAnswer(i, a)}
                userAnswer={answers[i]}
                showResult={submitted}
              />
            ))}

            <div style={{ margin: "24px 0", textAlign: "center" }}>
              {!submitted ? (
                <button onClick={handleSubmit} disabled={n < content.exercises.length}
                  style={{
                    padding: "12px 40px", borderRadius: 8, border: "none",
                    background: n >= content.exercises.length ? "#1a1a1a" : "#ddd",
                    color: n >= content.exercises.length ? "#fff" : "#999",
                    fontSize: 16, fontWeight: 600,
                    cursor: n >= content.exercises.length ? "pointer" : "default"
                  }}>
                  Check answers ({n}/{content.exercises.length})
                </button>
              ) : (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: score >= content.exercises.length * 0.8 ? "#16A34A" : score >= content.exercises.length * 0.5 ? "#D97706" : "#EF4444" }}>
                    {score} / {content.exercises.length}
                  </div>
                  <p style={{ fontSize: 14, color: "#666", margin: "4px 0 16px" }}>
                    {score === content.exercises.length ? "Perfect! You understand this topic." :
                     score >= content.exercises.length * 0.7 ? "Very good! You passed with 70%+." :
                     "Keep trying. Read the rules again, then try once more."}
                  </p>
                  <button onClick={handleReset} style={{ padding: "10px 30px", borderRadius: 8, border: "1.5px solid #1a1a1a", background: "#fff", color: "#1a1a1a", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Try again
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Quick Reference */}
        {content.summary && (
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "24px 28px", margin: "48px 0 0", border: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", margin: "0 0 14px" }}>Quick Reference</h3>

            {/* Key Formula */}
            {content.summary.key_formula && (
              <KeyBox>{content.summary.key_formula}</KeyBox>
            )}

            {/* One-sentence summary */}
            {content.summary.one_sentence_summary_en && (
              <p style={{ fontSize: 15, color: "#333", margin: "12px 0", fontStyle: "italic", lineHeight: 1.65 }}>
                {content.summary.one_sentence_summary_en}
              </p>
            )}

            {/* Top Rules */}
            {content.summary.top_rules && Array.isArray(content.summary.top_rules) && content.summary.top_rules.length > 0 && (
              <div style={{ margin: "14px 0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#16A34A", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Key Rules</div>
                {content.summary.top_rules.map((rule, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, margin: "6px 0" }}>
                    <span style={{ color: "#22C55E", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 14, color: "#444", lineHeight: 1.5 }}>{typeof rule === 'string' ? rule : rule.en || rule.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Top Mistakes */}
            {content.summary.top_mistakes && Array.isArray(content.summary.top_mistakes) && content.summary.top_mistakes.length > 0 && (
              <div style={{ margin: "14px 0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Watch Out For</div>
                {content.summary.top_mistakes.map((mistake, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, margin: "6px 0" }}>
                    <span style={{ color: "#EF4444", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>⚠</span>
                    <span style={{ fontSize: 14, color: "#444", lineHeight: 1.5 }}>{typeof mistake === 'string' ? mistake : mistake.en || mistake.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Memory Trick */}
            {content.summary.memory_trick_en && (
              <MemoryTrickBox>{content.summary.memory_trick_en}</MemoryTrickBox>
            )}

            {/* Next Step */}
            {content.summary.next_step_en && (
              <p style={{ fontSize: 14, color: "#3B82F6", margin: "14px 0 0", fontWeight: 500 }}>
                Next → {content.summary.next_step_en}
              </p>
            )}

            {/* Fallback: old format with points array */}
            {content.summary.points && Array.isArray(content.summary.points) && (
              <>
                {content.summary.points.map((point, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, margin: "8px 0" }}>
                    <span style={{ color: "#3B82F6", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 14, color: "#444", lineHeight: 1.5 }}>{point}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
