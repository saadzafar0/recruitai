import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { candidates, codeSnippet } from '../../data/mockData';

function getScoreColor(score: number) {
  if (score >= 80) return '#3ECF8E';
  if (score >= 65) return '#E5A93B';
  return '#EF6B6B';
}

function ScoreRow({
  label,
  score,
  comment,
}: {
  label: string;
  score: number;
  comment: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium" style={{ color: '#E2E4EB' }}>
          {label}
        </span>
        <span className="text-sm font-semibold" style={{ color: getScoreColor(score) }}>
          {score}%
        </span>
      </div>
      <div className="h-2.5 rounded-full mb-2" style={{ backgroundColor: '#1D202A' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: '#9585F5' }}
        />
      </div>
      <p className="text-xs italic" style={{ color: '#7E8494' }}>
        {comment}
      </p>
    </div>
  );
}

const codeLines = codeSnippet.split('\n');

export default function AssessmentDeepDive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const candidate = candidates.find(c => c.id === id) || candidates[0];

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      <button
        onClick={() => navigate(`/recruiter/candidates/${candidate.id}`)}
        className="flex items-center gap-1.5 text-sm mb-5 transition-colors cursor-pointer"
        style={{ color: '#7E8494' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7C6AEF'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7E8494'; }}
      >
        <ArrowLeft size={15} />
        Back to Profile
      </button>

      <div className="mb-5">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 600, color: '#E2E4EB' }}>
          Coding Assessment Review
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#7E8494' }}>
          {candidate.name} · Two Sum — Array Hashing · Python
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
        {/* Left panel – Code Editor */}
        <div className="flex-1 min-w-0" style={{ backgroundColor: '#0D1017' }}>
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: '#1A1D27' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: '#7C6AEF', color: '#fff' }}
              >
                Python 3.11
              </span>
              <span className="text-xs" style={{ color: '#7E8494' }}>
                Two Sum — Array Hashing
              </span>
            </div>
            <span className="text-xs" style={{ color: '#7E8494' }}>
              Submitted 2h ago
            </span>
          </div>

          {/* Code */}
          <div className="overflow-auto" style={{ maxHeight: 520, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
            <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
              <tbody>
                {codeLines.map((line, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td
                      className="px-4 py-0.5 text-right select-none"
                      style={{ color: '#7E8494', width: '3rem', userSelect: 'none' }}
                    >
                      {i + 1}
                    </td>
                    <td className="pl-2 pr-5 py-0.5" style={{ color: '#D4D8E4', whiteSpace: 'pre' }}>
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel – Evaluation */}
        <div
          className="w-full lg:w-96 flex-shrink-0 border-t lg:border-t-0 lg:border-l"
          style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
              {candidate.name}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: '#7E8494' }}>Two Sum — Array Hashing</p>
          </div>

          <div className="px-6 py-5">
            <ScoreRow
              label="Correctness"
              score={100}
              comment="All test cases passed. Correct hash map approach with proper index tracking."
            />
            <ScoreRow
              label="Efficiency"
              score={candidate.codingScore}
              comment={`O(n) time complexity achieved. Optimal space usage with a single-pass hash map. ${candidate.codingScore >= 85 ? 'No unnecessary allocations.' : 'Slight overhead from dict initialization could be avoided.'}`}
            />
            <ScoreRow
              label="Coding Standards"
              score={Math.min(candidate.codingScore + 5, 100)}
              comment="Clean variable naming, proper type hints, and well-structured docstring with complexity analysis."
            />

            {/* Full evaluation */}
            <div
              className="mt-4 p-4 rounded-lg border"
              style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#1D202A' }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: '#7C6AEF' }}>
                AI WRITTEN EVALUATION
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#7E8494' }}>
                {candidate.name} demonstrated strong algorithmic thinking by immediately
                identifying the optimal hash map approach, avoiding the brute-force O(n²)
                solution. The use of Python type hints and a comprehensive docstring reflects
                professional-grade coding habits. The solution correctly handles all edge
                cases including duplicate values. Overall, this submission reflects
                {candidate.codingScore >= 85 ? ' excellent' : ' solid'} technical proficiency
                appropriate for a {candidate.role} role.
              </p>
            </div>

            {/* Overall */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#7E8494' }}>Coding Score</span>
              <span
                className="text-lg font-semibold"
                style={{ color: getScoreColor(candidate.codingScore) }}
              >
                {candidate.codingScore}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Test results */}
      <div
        className="rounded-lg border mt-4 p-5"
        style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      >
        <h3 className="mb-4" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
          Test Case Results
        </h3>
        <div className="space-y-2.5">
          {[
            { input: '[2, 7, 11, 15], target=9', expected: '[0, 1]', actual: '[0, 1]', pass: true },
            { input: '[3, 2, 4], target=6', expected: '[1, 2]', actual: '[1, 2]', pass: true },
            { input: '[3, 3], target=6', expected: '[0, 1]', actual: '[0, 1]', pass: true },
            { input: '[1, 5, 3, 7], target=10', expected: '[1, 3]', actual: '[1, 3]', pass: true },
            { input: '[], target=0', expected: '[]', actual: '[]', pass: true },
          ].map((tc, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-2.5 rounded border text-sm"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <span
                className="text-xs font-medium w-12 flex-shrink-0"
                style={{ color: tc.pass ? '#3ECF8E' : '#EF6B6B' }}
              >
                {tc.pass ? '✓ Pass' : '✗ Fail'}
              </span>
              <span className="flex-1 font-mono text-xs" style={{ color: '#7E8494' }}>Input: {tc.input}</span>
              <span className="font-mono text-xs" style={{ color: '#7E8494' }}>Expected: {tc.expected}</span>
              <span className="font-mono text-xs" style={{ color: tc.pass ? '#3ECF8E' : '#EF6B6B' }}>
                Got: {tc.actual}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
