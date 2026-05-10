import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

const problem = {
  title: 'Two Sum',
  difficulty: 'Easy',
  description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.`,
};

const starterCode: Record<string, string> = {
  Python: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
  JavaScript: `function twoSum(nums, target) {
    const seen = {};

    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];

        if (complement in seen) {
            return [seen[complement], i];
        }

        seen[nums[i]] = i;
    }

    return [];
}`,
  Java: `class Solution {
    public int[] twoSum(int[] nums, int target) {

    }
}`,
};

const monacoLanguageMap: Record<string, string> = {
  Python: 'python',
  JavaScript: 'javascript',
  Java: 'java',
};

const testCases = [
  { input: '[2,7,11,15], target=9', expected: '[0,1]', actual: '[0,1]', passed: true },
  { input: '[3,2,4], target=6', expected: '[1,2]', actual: '[1,2]', passed: true },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');

  const s = (seconds % 60)
    .toString()
    .padStart(2, '0');

  return `${m}:${s}`;
}

export default function CodingAssessment() {
  const [language, setLanguage] = useState('Python');
  const [code, setCode] = useState(starterCode['Python']);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [ran, setRan] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRun = () => {
    setConsoleOutput('Running test cases...\n');

    setTimeout(() => {
      setConsoleOutput(`Running test cases...

[PASS] Test 1 ✓
[PASS] Test 2 ✓

All test cases passed.
Runtime: 0.003s`);
      setRan(true);
    }, 1200);
  };

  const isRed = timeLeft < 5 * 60;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        backgroundColor: '#1D202A',
        minHeight: '100vh',
      }}
    >
      {/* Top Bar */}
      <div
        className="border-b flex items-center justify-between px-4 py-3"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          backgroundColor: '#171921',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-semibold"
            style={{ color: '#E2E4EB' }}
          >
            {problem.title}
          </span>

          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: 'rgba(62,207,142,0.1)',
              color: '#3ECF8E',
            }}
          >
            Easy
          </span>
        </div>

        <div
          className="text-sm font-semibold px-3 py-1 rounded"
          style={{
            color: isRed ? '#EF6B6B' : '#E2E4EB',
            backgroundColor: '#1D202A',
          }}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Problem Panel */}
        <div
          className="w-[340px] border-r overflow-y-auto"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            backgroundColor: '#171921',
          }}
        >
          <div className="p-5">
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: '#E2E4EB' }}
            >
              Problem Description
            </h2>

            <p
              className="text-sm leading-7"
              style={{ color: '#7E8494' }}
            >
              {problem.description}
            </p>
          </div>
        </div>

        {/* Editor Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor Header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{
              borderColor: '#1A1D27',
              backgroundColor: '#11141C',
            }}
          >
            <div className="relative">
              <select
                value={language}
                onChange={e => {
                  const newLang = e.target.value;

                  setLanguage(newLang);
                  setCode(starterCode[newLang]);
                  setRan(false);
                  setConsoleOutput('');
                }}
                className="appearance-none pl-3 pr-8 py-1.5 rounded text-sm outline-none"
                style={{
                  backgroundColor: '#1A1D27',
                  color: '#D4D8E4',
                  border: '1px solid #262B38',
                }}
              >
                {['Python', 'JavaScript', 'Java'].map(lang => (
                  <option key={lang}>{lang}</option>
                ))}
              </select>

              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            <button
              onClick={handleRun}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-opacity"
              style={{
                backgroundColor: '#3ECF8E',
                color: '#08120D',
              }}
            >
              <Play size={14} />
              Run Code
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={monacoLanguageMap[language]}
              value={code}
              onChange={value => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: {
                  enabled: false,
                },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: {
                  top: 16,
                },
                fontFamily: 'JetBrains Mono, monospace',
                lineHeight: 22,
                tabSize: 4,
                wordWrap: 'on',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderLineHighlight: 'gutter',
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          </div>

          {/* Console */}
          <div
            className="border-t"
            style={{
              borderColor: '#1A1D27',
              backgroundColor: '#080A10',
              height: 180,
            }}
          >
            <div
              className="px-4 py-2 border-b text-xs font-medium"
              style={{
                borderColor: '#1A1D27',
                color: '#586074',
              }}
            >
              Console Output
            </div>

            <pre
              className="p-4 text-xs overflow-auto h-[140px]"
              style={{
                color: consoleOutput.includes('[PASS]')
                  ? '#3ECF8E'
                  : '#8A8F9E',
                fontFamily: 'monospace',
              }}
            >
              {consoleOutput || 'Run your code to see output...'}
            </pre>
          </div>
        </div>

        {/* Right Test Case Panel */}
        <div
          className="w-[260px] border-l overflow-y-auto"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            backgroundColor: '#171921',
          }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <p
              className="text-xs font-semibold uppercase"
              style={{ color: '#7E8494' }}
            >
              Test Cases
            </p>
          </div>

          <div className="p-3 space-y-3">
            {testCases.map((tc, index) => (
              <div
                key={index}
                className="p-3 rounded border"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  backgroundColor: '#1D202A',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {ran ? (
                    tc.passed ? (
                      <CheckCircle size={14} color="#3ECF8E" />
                    ) : (
                      <XCircle size={14} color="#EF6B6B" />
                    )
                  ) : (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: '#7E8494',
                        opacity: 0.3,
                      }}
                    />
                  )}

                  <span
                    className="text-xs font-medium"
                    style={{
                      color: tc.passed ? '#3ECF8E' : '#7E8494',
                    }}
                  >
                    Case {index + 1}
                  </span>
                </div>

                <p
                  className="text-xs font-mono mb-1"
                  style={{ color: '#7E8494' }}
                >
                  {tc.input}
                </p>

                <p
                  className="text-xs"
                  style={{ color: '#7E8494' }}
                >
                  Expected: {tc.expected}
                </p>

                {ran && (
                  <p
                    className="text-xs mt-1"
                    style={{
                      color: tc.passed ? '#3ECF8E' : '#EF6B6B',
                    }}
                  >
                    Got: {tc.actual}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}