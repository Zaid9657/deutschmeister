import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Loader2, ArrowLeft, ArrowRight, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import { grammarTopics } from '../data/grammarTopics';

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

function DialogueExchange({ exchange, index }) {
  const isEven = (index || 0) % 2 === 0;
  const speaker = exchange.speaker_label || exchange.speaker || (isEven ? 'Speaker A' : 'Speaker B');
  const isLeft = isEven;
  return (
    <div style={{ display: "flex", justifyContent: isLeft ? "flex-start" : "flex-end", margin: "10px 0" }}>
      <div style={{
        maxWidth: "75%", background: isLeft ? "#EFF6FF" : "#F0FDF4",
        borderRadius: isLeft ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        padding: "12px 16px", border: `1px solid ${isLeft ? "#BFDBFE" : "#BBF7D0"}`,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: isLeft ? "#3B82F6" : "#16A34A", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {speaker}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>{exchange.de || exchange.german}</div>
        {(exchange.en || exchange.english) && (
          <div style={{ fontSize: 13, color: "#666", fontStyle: "italic" }}>{exchange.en || exchange.english}</div>
        )}
        {exchange.highlight && (
          <div style={{ fontSize: 12, color: "#6366F1", marginTop: 6, paddingTop: 6, borderTop: "1px solid #e5e7eb", lineHeight: 1.5, fontWeight: 500 }}>
            {exchange.highlight}
          </div>
        )}
        {exchange.grammar_note && (
          <div style={{ fontSize: 12, color: "#555", marginTop: exchange.highlight ? 4 : 6, paddingTop: exchange.highlight ? 0 : 6, borderTop: exchange.highlight ? "none" : "1px solid #e5e7eb", lineHeight: 1.5 }}>
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

// Renders a comparison_table (array of {aspect, english, german} or similar)
function ComparisonTable({ data }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  return (
    <div style={{ overflowX: "auto", margin: "12px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {keys.map(k => (
              <th key={k} style={{ textAlign: "left", padding: "8px 12px", background: "#F1F5F9", borderBottom: "2px solid #E2E8F0", fontWeight: 700, color: "#334155", textTransform: "capitalize" }}>
                {k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri}>
              {keys.map(k => (
                <td key={k} style={{ padding: "8px 12px", borderBottom: "1px solid #F1F5F9", color: "#333", lineHeight: 1.6 }}>
                  {typeof row[k] === 'string' ? row[k] : JSON.stringify(row[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Renders a categorized list (e.g., gender meanings with category+examples)
function CategoryList({ title, categories }) {
  if (!Array.isArray(categories) || categories.length === 0) return null;
  return (
    <div style={{ margin: "12px 0", padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, borderLeft: "3px solid #6366F1" }}>
      {title && <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>{title}</h4>}
      {categories.map((cat, ci) => (
        <div key={ci} style={{ margin: "6px 0" }}>
          <span style={{ fontWeight: 600, color: "#334155" }}>{cat.category || cat.name || cat.title}: </span>
          <span style={{ color: "#555" }}>{cat.examples || cat.description || cat.text || ''}</span>
        </div>
      ))}
    </div>
  );
}

// Generic renderer for any explanation content object — handles all known structures
function ExplanationContent({ content: c }) {
  if (!c || typeof c !== 'object') return null;
  const rendered = [];

  // 1. sections array (most common — 30 rules)
  if (Array.isArray(c.sections)) {
    c.sections.forEach((section, si) => {
      rendered.push(
        <div key={`sec-${si}`} style={{ margin: "16px 0", padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, borderLeft: "3px solid #6366F1" }}>
          {(section.title_en || section.title_de) && (
            <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px" }}>
              {section.title_en || section.title_de}
            </h4>
          )}
          {(section.content_en || section.content_de) && (
            <div style={{ fontSize: 15, lineHeight: 1.85, color: "#333", whiteSpace: "pre-line" }}>
              {section.content_en || section.content_de}
            </div>
          )}
        </div>
      );
    });
  }

  // 2. intro_en (used by many non-sections structures)
  if (c.intro_en) {
    rendered.push(<p key="intro" style={{ fontSize: 16, lineHeight: 1.85, color: "#333", margin: "0 0 14px" }}>{c.intro_en}</p>);
  }

  // 3. paragraphs_en (used by 13 rules)
  if (Array.isArray(c.paragraphs_en)) {
    c.paragraphs_en.forEach((para, pi) => {
      rendered.push(<p key={`para-${pi}`} style={{ fontSize: 15, lineHeight: 1.85, color: "#333", margin: "0 0 14px", whiteSpace: "pre-line" }}>{para}</p>);
    });
  }

  // 4. analogy_en
  if (c.analogy_en) {
    rendered.push(
      <div key="analogy" style={{ margin: "12px 0", padding: "14px 16px", background: "#FFFBEB", borderRadius: 10, borderLeft: "3px solid #F59E0B" }}>
        <span style={{ fontWeight: 700, color: "#92400E", fontSize: 13, display: "block", marginBottom: 4 }}>Analogy</span>
        <span style={{ fontSize: 15, lineHeight: 1.7, color: "#78350F" }}>{c.analogy_en}</span>
      </div>
    );
  }

  // 5. native_perspective_en
  if (c.native_perspective_en) {
    rendered.push(
      <div key="native" style={{ margin: "12px 0", padding: "14px 16px", background: "#F0FDF4", borderRadius: 10, borderLeft: "3px solid #22C55E" }}>
        <span style={{ fontWeight: 700, color: "#166534", fontSize: 13, display: "block", marginBottom: 4 }}>Native Perspective</span>
        <span style={{ fontSize: 15, lineHeight: 1.7, color: "#14532D" }}>{c.native_perspective_en}</span>
      </div>
    );
  }

  // 6. comparison_table (array of row objects)
  if (Array.isArray(c.comparison_table)) {
    rendered.push(<ComparisonTable key="comp-table" data={c.comparison_table} />);
  }

  // 7. what_transfers_en / what_doesnt_transfer_en
  if (c.what_transfers_en) {
    rendered.push(
      <div key="transfers" style={{ margin: "12px 0", padding: "12px 16px", background: "#F0FDF4", borderRadius: 10, borderLeft: "3px solid #22C55E" }}>
        <span style={{ fontWeight: 700, color: "#166534", fontSize: 13 }}>What transfers from English: </span>
        <span style={{ fontSize: 15, color: "#333", lineHeight: 1.7 }}>{c.what_transfers_en}</span>
      </div>
    );
  }
  if (c.what_doesnt_transfer_en) {
    rendered.push(
      <div key="no-transfers" style={{ margin: "12px 0", padding: "12px 16px", background: "#FEF2F2", borderRadius: 10, borderLeft: "3px solid #EF4444" }}>
        <span style={{ fontWeight: 700, color: "#991B1B", fontSize: 13 }}>What doesn't transfer: </span>
        <span style={{ fontSize: 15, color: "#333", lineHeight: 1.7 }}>{c.what_doesnt_transfer_en}</span>
      </div>
    );
  }

  // 8. key_insight_en / key_point_en / key_insight / good_news_en / trap_to_avoid_en / helpful_contrast_en / rule_of_thumb_en / stress_rule_en / key_test_en / usage_note_en / when_not_to_contract_en
  const insightKeys = ['key_insight_en', 'key_point_en', 'key_insight', 'good_news_en', 'rule_of_thumb_en', 'key_test_en', 'helpful_contrast_en', 'stress_rule_en', 'usage_note_en', 'when_not_to_contract_en'];
  insightKeys.forEach(k => {
    if (c[k] && typeof c[k] === 'string') {
      rendered.push(
        <div key={k} style={{ margin: "12px 0", padding: "14px 16px", background: "#EEF2FF", borderRadius: 10, borderLeft: "3px solid #6366F1" }}>
          <span style={{ fontWeight: 700, color: "#3730A3", fontSize: 13, display: "block", marginBottom: 4 }}>{k.replace(/_en$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          <span style={{ fontSize: 15, lineHeight: 1.7, color: "#1E1B4B", whiteSpace: "pre-line" }}>{c[k]}</span>
        </div>
      );
    }
  });

  if (c.trap_to_avoid_en) {
    rendered.push(
      <div key="trap" style={{ margin: "12px 0", padding: "14px 16px", background: "#FEF2F2", borderRadius: 10, borderLeft: "3px solid #EF4444" }}>
        <span style={{ fontWeight: 700, color: "#991B1B", fontSize: 13, display: "block", marginBottom: 4 }}>Trap to Avoid</span>
        <span style={{ fontSize: 15, lineHeight: 1.7, color: "#7F1D1D" }}>{c.trap_to_avoid_en}</span>
      </div>
    );
  }

  // 9. key_pairs_en
  if (c.key_pairs_en) {
    rendered.push(<p key="key-pairs" style={{ fontSize: 15, lineHeight: 1.85, color: "#333", margin: "0 0 14px", fontStyle: "italic" }}>{c.key_pairs_en}</p>);
  }

  // 10. modals / prepositions / conjunctions / patterns / situations / categories (arrays of structured items)
  const listArrayKeys = ['modals', 'prepositions', 'conjunctions', 'separable_prefixes', 'inseparable_prefixes'];
  listArrayKeys.forEach(k => {
    if (Array.isArray(c[k]) && c[k].length > 0) {
      const items = c[k];
      rendered.push(
        <div key={k} style={{ margin: "12px 0" }}>
          {items.map((item, ii) => (
            <div key={ii} style={{ margin: "8px 0", padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, borderLeft: "3px solid #6366F1" }}>
              {(item.verb || item.preposition || item.conjunction || item.prefix) && (
                <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>
                  {item.verb || item.preposition || item.conjunction || item.prefix}
                  {item.meaning && <span style={{ fontWeight: 400, color: "#666", marginLeft: 8 }}>— {item.meaning}</span>}
                </span>
              )}
              {item.use && <p style={{ fontSize: 14, color: "#555", margin: "4px 0" }}>{item.use}</p>}
              {item.case && <p style={{ fontSize: 14, color: "#555", margin: "4px 0" }}>Case: {item.case}</p>}
              {item.example_de && (
                <p style={{ fontSize: 14, margin: "4px 0", color: "#1D4ED8", fontStyle: "italic" }}>
                  {item.example_de}
                  {item.example_en && <span style={{ color: "#888", fontStyle: "normal" }}> — {item.example_en}</span>}
                </p>
              )}
              {item.examples && typeof item.examples === 'string' && (
                <p style={{ fontSize: 14, color: "#555", margin: "4px 0" }}>{item.examples}</p>
              )}
            </div>
          ))}
        </div>
      );
    }
  });

  // 11. patterns / situations / categories (arrays with title+items or title+explanation)
  const groupArrayKeys = ['patterns', 'situations', 'categories'];
  groupArrayKeys.forEach(k => {
    if (Array.isArray(c[k]) && c[k].length > 0) {
      c[k].forEach((group, gi) => {
        rendered.push(
          <div key={`${k}-${gi}`} style={{ margin: "12px 0", padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, borderLeft: "3px solid #6366F1" }}>
            {(group.title || group.name || group.pattern) && (
              <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 6px" }}>
                {group.title || group.name || group.pattern}
              </h4>
            )}
            {group.explanation && <p style={{ fontSize: 14, color: "#555", margin: "4px 0", lineHeight: 1.7 }}>{group.explanation}</p>}
            {group.description && <p style={{ fontSize: 14, color: "#555", margin: "4px 0", lineHeight: 1.7 }}>{group.description}</p>}
            {group.example_de && (
              <p style={{ fontSize: 14, margin: "4px 0", color: "#1D4ED8", fontStyle: "italic" }}>
                {group.example_de}
                {group.example_en && <span style={{ color: "#888", fontStyle: "normal" }}> — {group.example_en}</span>}
              </p>
            )}
            {Array.isArray(group.examples) && group.examples.map((ex, ei) => (
              <p key={ei} style={{ fontSize: 14, margin: "2px 0", color: "#1D4ED8", fontStyle: "italic" }}>
                {typeof ex === 'string' ? ex : (ex.de || ex.example_de || '')}
                {(ex.en || ex.example_en) && <span style={{ color: "#888", fontStyle: "normal" }}> — {ex.en || ex.example_en}</span>}
              </p>
            ))}
            {Array.isArray(group.items) && group.items.map((item, ii) => (
              <p key={ii} style={{ fontSize: 14, margin: "2px 0", color: "#555" }}>
                {typeof item === 'string' ? item : (item.text || item.de || JSON.stringify(item))}
              </p>
            ))}
          </div>
        );
      });
    }
  });

  // 12. Gender-specific meaning/ending groups (masculine_meanings, feminine_meanings, neuter_meanings, masculine_endings, etc.)
  const genderGroupKeys = ['masculine_meanings', 'feminine_meanings', 'neuter_meanings', 'masculine_endings', 'feminine_endings', 'neuter_endings', 'masculine_examples', 'feminine_examples', 'neuter_examples'];
  genderGroupKeys.forEach(k => {
    if (c[k] && typeof c[k] === 'object') {
      const group = c[k];
      if (Array.isArray(group.categories)) {
        rendered.push(<CategoryList key={k} title={group.title || k.replace(/_/g, ' ')} categories={group.categories} />);
      } else if (Array.isArray(group.endings || group.examples || group)) {
        const items = group.endings || group.examples || group;
        rendered.push(<CategoryList key={k} title={group.title || k.replace(/_/g, ' ')} categories={items} />);
      } else if (typeof group === 'string') {
        rendered.push(<p key={k} style={{ fontSize: 15, lineHeight: 1.85, color: "#333", margin: "0 0 14px" }}>{group}</p>);
      }
    }
  });

  // 13. Table data: definite_table, indefinite_table, negative_table, forms_table, full_comparison
  const tableKeys = ['definite_table', 'indefinite_table', 'negative_table', 'forms_table', 'full_comparison'];
  tableKeys.forEach(k => {
    if (c[k] && typeof c[k] === 'object') {
      const tbl = c[k];
      if (tbl.headers && tbl.rows) {
        rendered.push(
          <div key={k} style={{ overflowX: "auto", margin: "12px 0" }}>
            {tbl.title && <h4 style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>{tbl.title}</h4>}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {tbl.headers.map((h, hi) => (
                    <th key={hi} style={{ textAlign: "left", padding: "8px 12px", background: "#F1F5F9", borderBottom: "2px solid #E2E8F0", fontWeight: 700, color: "#334155" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tbl.rows.map((row, ri) => (
                  <tr key={ri}>
                    {(Array.isArray(row) ? row : Object.values(row)).map((cell, ci) => (
                      <td key={ci} style={{ padding: "8px 12px", borderBottom: "1px solid #F1F5F9", color: "#333" }}>{typeof cell === 'string' ? cell : JSON.stringify(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
  });

  // 14. key_changes (array of {case, change, example})
  if (Array.isArray(c.key_changes)) {
    c.key_changes.forEach((change, ci) => {
      rendered.push(
        <div key={`change-${ci}`} style={{ margin: "8px 0", padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, borderLeft: "3px solid #6366F1" }}>
          {change.case && <span style={{ fontWeight: 700, color: "#1a1a1a" }}>{change.case}: </span>}
          {change.change && <span style={{ color: "#555" }}>{change.change}</span>}
          {change.example && <p style={{ fontSize: 14, color: "#1D4ED8", fontStyle: "italic", margin: "4px 0" }}>{change.example}</p>}
        </div>
      );
    });
  }

  // 15. question_words (array of {word, meaning, example})
  if (Array.isArray(c.question_words)) {
    c.question_words.forEach((qw, qi) => {
      rendered.push(
        <div key={`qw-${qi}`} style={{ margin: "8px 0", padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, borderLeft: "3px solid #6366F1" }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>{qw.word}</span>
          {qw.meaning && <span style={{ color: "#666", marginLeft: 8 }}>— {qw.meaning}</span>}
          {qw.example && <p style={{ fontSize: 14, color: "#1D4ED8", fontStyle: "italic", margin: "4px 0" }}>{qw.example}</p>}
        </div>
      );
    });
  }

  // 16. verb_pairs / example_pair
  if (Array.isArray(c.verb_pairs)) {
    c.verb_pairs.forEach((vp, vi) => {
      rendered.push(
        <div key={`vp-${vi}`} style={{ margin: "8px 0", padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, borderLeft: "3px solid #6366F1" }}>
          {(vp.movement || vp.position) && <span style={{ fontWeight: 700, color: "#1a1a1a" }}>{vp.movement || ''} / {vp.position || ''}</span>}
          {vp.meaning && <span style={{ color: "#666", marginLeft: 8 }}>— {vp.meaning}</span>}
          {vp.example && <p style={{ fontSize: 14, color: "#1D4ED8", fontStyle: "italic", margin: "4px 0" }}>{vp.example}</p>}
        </div>
      );
    });
  }
  if (c.example_pair && typeof c.example_pair === 'object') {
    const ep = c.example_pair;
    rendered.push(
      <div key="example-pair" style={{ margin: "12px 0", padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, borderLeft: "3px solid #6366F1" }}>
        {ep.movement && <p style={{ fontSize: 14, margin: "2px 0" }}><strong>Movement:</strong> {ep.movement}</p>}
        {ep.position && <p style={{ fontSize: 14, margin: "2px 0" }}><strong>Position:</strong> {ep.position}</p>}
      </div>
    );
  }

  // 17. pattern_en / pattern_observation_en / formula_en / visual_en / mnemonic_en / alternate_mnemonic_en / plural_rule_en
  const textKeys = ['pattern_en', 'pattern_observation_en', 'formula_en', 'visual_en', 'mnemonic_en', 'alternate_mnemonic_en', 'plural_rule_en'];
  textKeys.forEach(k => {
    if (c[k] && typeof c[k] === 'string') {
      rendered.push(
        <div key={k} style={{ margin: "12px 0", padding: "14px 16px", background: "#FFFBEB", borderRadius: 10, borderLeft: "3px solid #F59E0B" }}>
          <span style={{ fontWeight: 700, color: "#92400E", fontSize: 13, display: "block", marginBottom: 4 }}>{k.replace(/_en$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          <span style={{ fontSize: 15, lineHeight: 1.7, color: "#78350F", whiteSpace: "pre-line" }}>{c[k]}</span>
        </div>
      );
    }
  });

  // 18. structure_comparison / with_modal_verbs / with_perfect_tense (objects with various keys)
  const objKeys = ['structure_comparison', 'with_modal_verbs', 'with_perfect_tense', 'contractions_table'];
  objKeys.forEach(k => {
    if (c[k] && typeof c[k] === 'object') {
      if (Array.isArray(c[k])) {
        rendered.push(<ComparisonTable key={k} data={c[k]} />);
      } else {
        const obj = c[k];
        if (obj.headers && obj.rows) {
          rendered.push(
            <div key={k} style={{ overflowX: "auto", margin: "12px 0" }}>
              {obj.title && <h4 style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>{obj.title}</h4>}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead><tr>{obj.headers.map((h, hi) => <th key={hi} style={{ textAlign: "left", padding: "8px 12px", background: "#F1F5F9", borderBottom: "2px solid #E2E8F0", fontWeight: 700, color: "#334155" }}>{h}</th>)}</tr></thead>
                <tbody>{obj.rows.map((row, ri) => <tr key={ri}>{(Array.isArray(row) ? row : Object.values(row)).map((cell, ci) => <td key={ci} style={{ padding: "8px 12px", borderBottom: "1px solid #F1F5F9", color: "#333" }}>{typeof cell === 'string' ? cell : JSON.stringify(cell)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
        } else {
          // Generic key-value rendering
          const entries = Object.entries(obj).filter(([, v]) => typeof v === 'string');
          if (entries.length > 0) {
            rendered.push(
              <div key={k} style={{ margin: "12px 0", padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, borderLeft: "3px solid #6366F1" }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                {entries.map(([ek, ev]) => (
                  <p key={ek} style={{ fontSize: 14, color: "#555", margin: "4px 0", lineHeight: 1.6 }}>
                    <strong>{ek.replace(/_/g, ' ')}: </strong>{ev}
                  </p>
                ))}
              </div>
            );
          }
        }
      }
    }
  });

  // 19. Fallback: direct content_en/content_de or text
  if (rendered.length === 0) {
    if (c.content_en) rendered.push(<p key="fb-en" style={{ fontSize: 16, lineHeight: 1.85, color: "#333", margin: "0 0 14px" }}>{c.content_en}</p>);
    else if (c.content_de) rendered.push(<p key="fb-de" style={{ fontSize: 16, lineHeight: 1.85, color: "#333", margin: "0 0 14px" }}>{c.content_de}</p>);
    else if (c.text) rendered.push(<p key="fb-text" style={{ fontSize: 16, lineHeight: 1.85, color: "#333", margin: "0 0 14px" }}>{c.text}</p>);
  }

  return <>{rendered}</>;
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
  const { isInFreeTrial, hasActiveSubscription } = useSubscription();
  const showUpgradeCta = user && isInFreeTrial() && !hasActiveSubscription();

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
            // Handle different question field names — prefer German
            const question = ex.question_de || ex.question_en || ex.question || '';

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
              explanation: ex.explanation_de || ex.explanation_en || ex.explanation || '',
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
        <button onClick={() => navigate(`/level/${level}`)} style={{ marginTop: 20, padding: "10px 20px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
          Back to {level.toUpperCase()}
        </button>
      </div>
    );
  }

  const intro = content.introduction;
  const n = Object.keys(answers).length;
  const score = submitted && content.exercises ? content.exercises.filter((e, i) => answers[i] === e.correctAnswer).length : 0;

  let sectionNumber = 1;

  // Dynamic SEO metadata — generated from topic data for all 64 topics
  const levelUpper = level.toUpperCase();
  const seoTitle = `${topic.title_en} | German ${levelUpper} Grammar`;
  const seoDescription = `Learn ${topic.title_en} in German with clear rules, examples, and free exercises. ${levelUpper} grammar lesson at DeutschMeister.`;
  const canonicalPath = `/grammar/${level.toLowerCase()}/${slug}`;

  return (
    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", background: "#fff", minHeight: "100vh", paddingTop: 64 }}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={canonicalPath}
        type="article"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": topic.title_en,
          "description": `Learn ${topic.title_en} in German with examples and exercises`,
          "author": { "@type": "Organization", "name": "DeutschMeister" },
          "publisher": { "@type": "Organization", "name": "DeutschMeister" },
          "mainEntityOfPage": `https://deutsch-meister.de${canonicalPath}`,
          "educationalLevel": levelUpper,
          "inLanguage": ["de", "en"]
        }}
        extraStructuredData={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://deutsch-meister.de/" },
            { "@type": "ListItem", "position": 2, "name": "Grammar", "item": "https://deutsch-meister.de/grammar" },
            { "@type": "ListItem", "position": 3, "name": levelUpper, "item": `https://deutsch-meister.de/grammar/${level.toLowerCase()}` },
            { "@type": "ListItem", "position": 4, "name": topic.title_en }
          ]
        }}
      />
      {/* Breadcrumbs + Back button */}
      <div style={{ borderBottom: "1px solid #eee", padding: "16px 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <nav style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, fontSize: 13, marginBottom: 8 }}>
            <Link to="/" style={{ color: "#9ca3af", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#3B82F6"} onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>Home</Link>
            <ChevronRight size={12} color="#d1d5db" />
            <Link to="/grammar" style={{ color: "#9ca3af", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#3B82F6"} onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>Grammar</Link>
            <ChevronRight size={12} color="#d1d5db" />
            <Link to={`/grammar/${level.toLowerCase()}/`} style={{ color: "#9ca3af", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#3B82F6"} onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>{levelUpper}</Link>
            <ChevronRight size={12} color="#d1d5db" />
            <span style={{ color: "#374151", fontWeight: 500 }}>{topic.title_en}</span>
          </nav>
          <button
            onClick={() => navigate(`/level/${level}`)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 15, color: "#64748B", background: "none", border: "none",
              cursor: "pointer", padding: "8px 0", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#1a1a1a"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#64748B"}
          >
            <ArrowLeft size={18} />
            Back to {level.toUpperCase()}
          </button>
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
              let c = exp.content || {};
              if (typeof c === 'string') {
                try { c = JSON.parse(c); } catch { c = {}; }
              }

              return (
                <div key={i} style={{ margin: "20px 0" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "0 0 12px" }}>
                    <ExplanationTypeLabel type={exp.rule_type} />
                    {exp.title_en && (
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{exp.title_en}</h3>
                    )}
                  </div>

                  <ExplanationContent content={c} />

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
              const lines = c.lines || c.exchanges || [];
              return (
                <div key={i} style={{ margin: "18px 0" }}>
                  {(c.context_en || c.context_de || dlg.title_en) && (
                    <P>{c.context_en || c.context_de || dlg.title_en}</P>
                  )}
                  {lines.length > 0 && (
                    <div style={{ margin: "16px 0", padding: "16px", background: "#FAFAFA", borderRadius: 12 }}>
                      {lines.map((line, li) => (
                        <DialogueExchange key={li} exchange={line} index={li} />
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
                  {showUpgradeCta && score >= content.exercises.length * 0.5 && (
                    <div style={{ marginTop: 24, padding: "16px 20px", borderRadius: 12, background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)", border: "1px solid #FDE68A" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                        <Sparkles size={16} style={{ color: "#D97706" }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#92400E" }}>Enjoying DeutschMeister?</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#78716C", margin: "0 0 12px", lineHeight: 1.5 }}>
                        Subscribe to keep learning after your trial ends.
                      </p>
                      <Link to="/pricing" style={{ display: "inline-block", padding: "8px 20px", borderRadius: 8, background: "linear-gradient(to right, #F59E0B, #EA580C)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                        Upgrade to Pro
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Quick Reference */}
        {content.summary && (
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "24px 28px", margin: "48px 0 0", border: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", margin: "0 0 14px" }}>Quick Reference</h3>

            {/* Golden Rule */}
            {(content.summary.golden_rule_en || content.summary.golden_rule_de) && (
              <div style={{ background: "#FFFBEB", borderRadius: 8, padding: "14px 18px", margin: "0 0 16px", borderLeft: "4px solid #F59E0B" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#D97706", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Golden Rule</div>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: "#92400E", margin: 0, fontWeight: 600 }}>
                  {content.summary.golden_rule_en || content.summary.golden_rule_de}
                </p>
              </div>
            )}

            {/* Key Formula (alternate field name) */}
            {content.summary.key_formula && !content.summary.golden_rule_en && (
              <KeyBox>{content.summary.key_formula}</KeyBox>
            )}

            {/* One-sentence summary */}
            {content.summary.one_sentence_summary_en && (
              <p style={{ fontSize: 15, color: "#333", margin: "12px 0", fontStyle: "italic", lineHeight: 1.65 }}>
                {content.summary.one_sentence_summary_en}
              </p>
            )}

            {/* Quick Reference bullet points */}
            {content.summary.quick_reference && Array.isArray(content.summary.quick_reference) && content.summary.quick_reference.length > 0 && (
              <div style={{ margin: "14px 0" }}>
                {content.summary.quick_reference.map((point, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, margin: "8px 0" }}>
                    <span style={{ color: "#3B82F6", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 14, color: "#444", lineHeight: 1.5 }}>{typeof point === 'string' ? point : point.en || point.text}</span>
                  </div>
                ))}
              </div>
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
            {(content.summary.memory_trick_en || content.summary.memory_trick_de) && (
              <MemoryTrickBox>{content.summary.memory_trick_en || content.summary.memory_trick_de}</MemoryTrickBox>
            )}

            {/* What Next / Next Step */}
            {(content.summary.what_next_en || content.summary.next_step_en) && (
              <p style={{ fontSize: 14, color: "#3B82F6", margin: "14px 0 0", fontWeight: 500 }}>
                Next → {content.summary.what_next_en || content.summary.next_step_en}
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

      {/* Related Topics / Continue Learning */}
      {(() => {
        const topics = grammarTopics[level] || [];
        const currentIndex = topics.findIndex(t => t.slug === slug);
        if (currentIndex === -1 || topics.length === 0) return null;

        const prevTopic = currentIndex > 0 ? topics[currentIndex - 1] : null;
        const nextTopic = currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null;

        // Pick up to 2 other topics from the same level (not prev/next/current)
        const otherTopics = topics.filter((_, i) =>
          i !== currentIndex && i !== currentIndex - 1 && i !== currentIndex + 1
        ).slice(0, 2);

        return (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 64px" }}>
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <BookOpen size={20} color="#1a1a1a" />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
                  Continue Learning
                </h3>
              </div>

              {/* Prev / Next navigation */}
              <div style={{ display: "grid", gridTemplateColumns: prevTopic && nextTopic ? "1fr 1fr" : "1fr", gap: 12, marginBottom: otherTopics.length > 0 ? 20 : 0 }}>
                {prevTopic && (
                  <Link
                    to={`/grammar/${level}/${prevTopic.slug}/`}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                      border: "1px solid #e5e7eb", borderRadius: 12, textDecoration: "none",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.boxShadow = "0 0 0 1px #3B82F6"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <ArrowLeft size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Previous</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3 }}>{prevTopic.titleEn}</div>
                    </div>
                  </Link>
                )}
                {nextTopic && (
                  <Link
                    to={`/grammar/${level}/${nextTopic.slug}/`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "14px 16px",
                      border: "1px solid #e5e7eb", borderRadius: 12, textDecoration: "none",
                      textAlign: "right", transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.boxShadow = "0 0 0 1px #3B82F6"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Next</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3 }}>{nextTopic.titleEn}</div>
                    </div>
                    <ArrowRight size={16} color="#6b7280" style={{ flexShrink: 0 }} />
                  </Link>
                )}
              </div>

              {/* More topics from this level */}
              {otherTopics.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    More from {level.toUpperCase()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {otherTopics.map(t => (
                      <Link
                        key={t.slug}
                        to={`/grammar/${level}/${t.slug}/`}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                          background: "#f9fafb", borderRadius: 8, textDecoration: "none",
                          fontSize: 14, color: "#374151", fontWeight: 500,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f0f4ff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; }}
                      >
                        <span style={{ color: "#3B82F6", fontSize: 16 }}>→</span>
                        {t.titleEn}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
