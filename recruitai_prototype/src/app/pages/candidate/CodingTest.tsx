import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Play, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { useCandidateContext } from '../../context/CandidateContext';

const problem = {
  title: 'Two Sum',
  difficulty: 'Easy',
  description: `Given an array of integers \`nums\` and an integer \`target\`, return **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
  constraints: [
    '2 ≤ nums.length ≤ 10⁴',
    '-10⁹ ≤ nums[i] ≤ 10⁹',
    '-10⁹ ≤ target ≤ 10⁹',
    'Only one valid answer exists.',
  ],
  examples: [
    { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' },
    { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'nums[1] + nums[2] == 6' },
  ],
};

const starterCode: Record<string, string> = {
  Python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
  JavaScript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const seen = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in seen) return [seen[complement], i];
        seen[nums[i]] = i;
    }
    return [];
};`,
  Java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
};

const testCases = [
  { input: '[2,7,11,15], target=9', expected: '[0,1]', actual: '[0,1]', passed: true },
  { input: '[3,2,4], target=6', expected: '[1,2]', actual: '[1,2]', passed: true },
  { input: '[3,3], target=6', expected: '[0,1]', actual: '[0,1]', passed: true },
  { input: '[1,5,3,7], target=10', expected: '[1,3]', actual: '[1,3]', passed: true },
];

const difficultyConfig: Record<string, { color: string }> = {
  Easy: { color: '#3ECF8E' },
  Medium: { color: '#E5A93B' },
  Hard: { color: '#EF6B6B' },
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CodingTest() {
  const navigate = useNavigate();
  const { setCodingStatus } = useCandidateContext();
  const [language, setLanguage] = useState('Python');
  const [code, setCode] = useState(starterCode['Python']);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [ran, setRan] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRun = () => {
    setConsoleOutput('Running test cases…\n');
    setTimeout(() => {
      setConsoleOutput(`Running test cases…

[PASS] Test 1: twoSum([2,7,11,15], 9) → [0, 1]  ✓
[PASS] Test 2: twoSum([3,2,4], 6)     → [1, 2]  ✓
[PASS] Test 3: twoSum([3,3], 6)       → [0, 1]  ✓
[PASS] Test 4: twoSum([1,5,3,7], 10)  → [1, 3]  ✓

All 4/4 test cases passed.
Runtime: 0.003s  |  Memory: 14.2 MB`);
      setRan(true);
    }, 1200);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setCodingStatus('completed');
      navigate('/candidate');
    }, 2000);
  };

  const isRed = timeLeft < 5 * 60;

  return (
    <div className="flex flex-col overflow-hidden" style={{ backgroundColor: '#1D202A', minHeight: 'calc(100vh - 3.5rem)' }}>
      {/* Top bar */}
      <div
        className="border-b flex items-center justify-between px-3 sm:px-5 py-2.5 flex-shrink-0 gap-2"
        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#171921' }}
      >
        <span className="text-sm font-medium" style={{ color: '#E2E4EB' }}>
          Two Sum
        </span>
        <span
          className="text-sm font-semibold px-3 py-1 rounded"
          style={{
            color: isRed ? '#EF6B6B' : '#E2E4EB',
            backgroundColor: isRed ? 'rgba(239,107,107,0.08)' : '#1D202A',
          }}
        >
          {formatTime(timeLeft)}
        </span>
        <span className="text-xs sm:text-sm hidden sm:inline" style={{ color: '#7E8494' }}>Senior Frontend Engineer Assessment</span>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-auto lg:overflow-hidden">
        {/* Left panel – Problem */}
        <div
          className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r overflow-y-auto flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#171921' }}
        >
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#E2E4EB' }}>
                {problem.title}
              </h2>
              <span
                className="text-xs font-medium"
                style={{ color: difficultyConfig[problem.difficulty].color }}
              >
                {problem.difficulty}
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap" style={{ color: '#7E8494' }}>
              {problem.description}
            </p>
            <div className="mb-4">
              <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#7E8494', opacity: 0.5 }}>Constraints</p>
              <ul className="space-y-1">
                {problem.constraints.map(c => (
                  <li key={c} className="text-xs flex gap-1.5" style={{ color: '#7E8494' }}>
                    <span style={{ color: '#7C6AEF' }}>•</span>{c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#7E8494', opacity: 0.5 }}>Examples</p>
              {problem.examples.map((ex, i) => (
                <div
                  key={i}
                  className="mb-3 p-3 rounded border text-xs"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#1D202A', fontFamily: 'monospace' }}
                >
                  <p className="mb-1" style={{ color: '#7E8494' }}>Input: {ex.input}</p>
                  <p className="mb-1" style={{ color: '#7E8494' }}>Output: {ex.output}</p>
                  <p style={{ color: '#7E8494', opacity: 0.6 }}>{ex.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center panel – Editor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ backgroundColor: '#0D1017' }}>
          {/* Editor header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{ borderColor: '#1A1D27' }}
          >
            <div className="relative">
              <select
                value={language}
                onChange={e => {
                  setLanguage(e.target.value);
                  setCode(starterCode[e.target.value]);
                  setRan(false);
                  setConsoleOutput('');
                }}
                className="appearance-none pl-3 pr-7 py-1.5 text-sm rounded border cursor-pointer"
                style={{
                  borderColor: '#1A1D27',
                  backgroundColor: '#1A1D27',
                  color: '#D4D8E4',
                  fontFamily: 'monospace',
                }}
              >
                {['Python', 'JavaScript', 'Java'].map(l => <option key={l}>{l}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white rounded cursor-pointer transition-colors"
              style={{ backgroundColor: '#3ECF8E' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              <Play size={13} />
              Run Code
            </button>
          </div>

          {/* Code editor */}
          <div className="flex-1 overflow-auto">
            <div className="flex min-h-full">
              {/* Line numbers */}
              <div
                className="px-3 py-3 text-right select-none flex-shrink-0"
                style={{ color: '#3D4250', backgroundColor: '#0A0D14', fontFamily: 'monospace', fontSize: '0.8125rem', minWidth: '2.5rem' }}
              >
                {code.split('\n').map((_, i) => (
                  <div key={i} style={{ lineHeight: '1.6' }}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="flex-1 p-3 outline-none resize-none"
                style={{
                  backgroundColor: '#0D1017',
                  color: '#D4D8E4',
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  lineHeight: '1.6',
                  caretColor: '#D4D8E4',
                }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Console */}
          <div
            className="border-t flex-shrink-0"
            style={{ borderColor: '#1A1D27', backgroundColor: '#080A10', height: 140 }}
          >
            <div
              className="px-4 py-1.5 border-b text-xs font-medium"
              style={{ borderColor: '#1A1D27', color: '#3D4250' }}
            >
              Console Output
            </div>
            <pre
              className="px-4 py-3 text-xs overflow-auto"
              style={{ color: consoleOutput.includes('[PASS]') ? '#3ECF8E' : '#8A8F9E', fontFamily: 'monospace', height: 105 }}
            >
              {consoleOutput || 'Click "Run Code" to see output…'}
            </pre>
          </div>
        </div>

        {/* Right panel – Test cases */}
        <div
          className="w-full lg:w-56 border-t lg:border-t-0 lg:border-l flex flex-col flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#171921' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold uppercase" style={{ color: '#7E8494' }}>Test Cases</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {testCases.map((tc, i) => (
              <div
                key={i}
                className="p-2.5 rounded border text-xs"
                style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#1D202A' }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {ran ? (
                    tc.passed ? (
                      <CheckCircle size={11} style={{ color: '#3ECF8E' }} />
                    ) : (
                      <XCircle size={11} style={{ color: '#EF6B6B' }} />
                    )
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1D202A', border: '1px solid #7E8494', opacity: 0.4 }} />
                  )}
                  <span className="font-medium" style={{ color: ran ? (tc.passed ? '#3ECF8E' : '#EF6B6B') : '#7E8494' }}>
                    Case {i + 1}
                  </span>
                </div>
                <p className="font-mono mb-0.5" style={{ color: '#7E8494', opacity: 0.7 }}>{tc.input}</p>
                <p style={{ color: '#7E8494', opacity: 0.7 }}>Expected: {tc.expected}</p>
                {ran && <p style={{ color: tc.passed ? '#3ECF8E' : '#EF6B6B' }}>Got: {tc.actual}</p>}
              </div>
            ))}
          </div>
          <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 text-sm text-white rounded disabled:opacity-70 cursor-pointer transition-colors"
              style={{ backgroundColor: '#7C6AEF' }}
              onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#9585F5'; }}
              onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLElement).style.backgroundColor = '#7C6AEF'; }}
            >
              {submitting ? 'Submitting…' : 'Submit Solution'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}