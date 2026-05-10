import { useState, useEffect } from 'react';
import Editor, { type BeforeMount } from '@monaco-editor/react';
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
  TypeScript: `function twoSum(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();

    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];

        if (seen.has(complement)) {
            return [seen.get(complement)!, i];
        }

        seen.set(nums[i], i);
    }

    return [];
}`,
  Java: `class Solution {
    public int[] twoSum(int[] nums, int target) {

    }
}`,
  C: `#include <stdio.h>

int main() {
    // TODO: Implement Two Sum
    return 0;
}`,
  'C++': `#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // TODO: Implement Two Sum
    return {};
}`,
};

const monacoLanguageMap: Record<string, string> = {
  Python: 'python',
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  Java: 'java',
  C: 'c',
  'C++': 'cpp',
};

const languageOptions = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C', 'C++'];

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

export default function CodingAssessment({ applicationId }: { applicationId?: string }) {
  const [language, setLanguage] = useState('Python');
  const [code, setCode] = useState(starterCode['Python']);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [ran, setRan] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [lastVerdict, setLastVerdict] = useState('');
  const [jobId, setJobId] = useState('');

  const handleEditorWillMount: BeforeMount = () => {
    if (typeof self === 'undefined') {
      return;
    }

    if ((self as any).MonacoEnvironment?.getWorker) {
      return;
    }

    (self as any).MonacoEnvironment = {
      getWorker: (_workerId: string, label: string) => {
        if (label === 'json') {
          return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url));
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url));
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url));
        }
        if (label === 'typescript' || label === 'javascript') {
          return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url));
        }
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
      },
    };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRun = async () => {
    if (!applicationId) {
      setConsoleOutput('Missing application id. Please return to the assessment lobby and try again.');
      return;
    }

    if (!code.trim()) {
      setConsoleOutput('Please write some code before running.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError('');
    setSubmissionStatus('Submitting...');
    setConsoleOutput('Submitting to Judge0...\n');

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('/api/v1/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: applicationId,
          code,
          language: monacoLanguageMap[language],
          test_cases: testCases,
          time_limit: 2,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to submit code')
      }

      setJobId(data.data?.job_id || '')
      setSubmissionStatus('Queued')
      setConsoleOutput('Submission queued. Waiting for results...')
      setRan(true)
      setLastVerdict('pending')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit code'
      if ((err as any)?.name === 'AbortError') {
        setSubmissionError('Request timed out (10s). Check network or backend and try again.')
        setSubmissionStatus('Timed out')
        setConsoleOutput('Submission timed out after 10s. Please try again.')
      } else {
        setSubmissionError(message)
        setSubmissionStatus('Failed')
        setConsoleOutput(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  };

  const isRed = timeLeft < 5 * 60;

  useEffect(() => {
    if (!applicationId || !jobId || lastVerdict === 'accepted' || lastVerdict === 'wrong_answer') {
      return;
    }

    const poll = async () => {
      try {
        const response = await fetch(`/api/v1/submissions/latest?application_id=${applicationId}`, {
          cache: 'no-store',
        });

        const data = await response.json();
        if (!response.ok || !data?.success) {
          return;
        }

        const verdict = data?.data?.verdict as string | undefined;
        if (verdict) {
          setLastVerdict(verdict);
          setSubmissionStatus(`Result: ${verdict.replace(/_/g, ' ')}`);

          if (verdict !== 'pending') {
            setConsoleOutput(data?.data?.output || 'Execution completed.');
          }
        }
      } catch {
        // Ignore polling failures.
      }
    };

    const interval = setInterval(poll, 2500);
    return () => clearInterval(interval);
  }, [applicationId, jobId, lastVerdict]);

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
                {languageOptions.map(lang => (
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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-opacity"
              style={{
                backgroundColor: '#3ECF8E',
                color: '#08120D',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              <Play size={14} />
              {isSubmitting ? 'Submitting...' : 'Run Code'}
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={monacoLanguageMap[language]}
              value={code}
              onChange={value => setCode(value || '')}
              beforeMount={handleEditorWillMount}
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
            {submissionStatus ? (
              <div
                className="px-4 pb-3 text-xs"
                style={{ color: submissionError ? '#EF6B6B' : '#7E8494' }}
              >
                {submissionError ? `Error: ${submissionError}` : submissionStatus}
              </div>
            ) : null}
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