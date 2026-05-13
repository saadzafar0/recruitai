import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Editor, { type BeforeMount } from '@monaco-editor/react'
import { Play, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { useCodingProblems } from '@/hooks/useCodingProblems'
import { useAuth } from '@/context/AuthContext'

const starterCode: Record<string, string> = {
	Python: `def solve():
	    return []`,
	JavaScript: `function solve() {
	    return [];
}`,
	'C': `#include <stdio.h>

int main() {
	// TODO: implement solution
	return 0;
}`,
	Java: `class Solution {
	    public int[] solve() {
	        return new int[]{};
	    }
}`,

	'C++': `#include <vector>
using namespace std;

vector<int> solve(vector<int>& nums, int target) {
	// TODO: implement solution
	return {};
}`,
}

const monacoLanguageMap: Record<string, string> = {
	Python: 'python',
	JavaScript: 'javascript',
	Java: 'java',
	'C++': 'cpp',
}

const languageOptions = ['Python', 'JavaScript', 'Java', 'C++']

function formatTime(seconds: number) {
	const minutes = Math.floor(seconds / 60)
		.toString()
		.padStart(2, '0')

	const remainingSeconds = (seconds % 60)
		.toString()
		.padStart(2, '0')

	return `${minutes}:${remainingSeconds}`
}

export default function CodingAssessment({ applicationId }: { applicationId?: string }) {
	const router = useRouter()
	const { session } = useAuth()
	const { activeProblem, loading: problemLoading, error: problemError } = useCodingProblems()
	const [language, setLanguage] = useState('Python')
	const [code, setCode] = useState(starterCode.Python)
	const [consoleOutput, setConsoleOutput] = useState('')
	const [timeLeft, setTimeLeft] = useState(45 * 60)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submissionError, setSubmissionError] = useState('')
	const [submissionStatus, setSubmissionStatus] = useState('')
	const [lastVerdict, setLastVerdict] = useState('')
	const [jobId, setJobId] = useState('')
	const [hasRunOnce, setHasRunOnce] = useState(false)
	const [finalizeError, setFinalizeError] = useState('')

	const sampleTestCases = useMemo(() => {
		if (!activeProblem) {
			return []
		}

		return [{
			input: activeProblem.sample_input || 'No sample input available.',
			expected_output: activeProblem.sample_output || 'No sample output available.',
		}]
	}, [activeProblem])

	const selectedProblem = activeProblem
	const problemTitle = selectedProblem?.title || 'Loading problem...'
	const problemDifficulty = selectedProblem?.difficulty
		? `${selectedProblem.difficulty[0].toUpperCase()}${selectedProblem.difficulty.slice(1)}`
		: 'Loading'
	const problemDescription = selectedProblem?.description || 'Fetching the coding problem from the database...'

	// Log active problem
	useEffect(() => {
		if (selectedProblem) {
			console.log('[MonacoEditor] Active problem loaded:', {
				id: selectedProblem.id,
				title: selectedProblem.title,
				difficulty: selectedProblem.difficulty,
			})
		} else {
			console.log('[MonacoEditor] Problem still loading or not available')
		}
	}, [selectedProblem])

	const handleEditorWillMount: BeforeMount = () => {
		if (typeof self === 'undefined') {
			return
		}

		if ((self as any).MonacoEnvironment?.getWorker) {
			return
		}

		(self as any).MonacoEnvironment = {
			getWorker: (_workerId: string, label: string) => {
				if (label === 'json') {
					return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url))
				}
				if (label === 'css' || label === 'scss' || label === 'less') {
					return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url))
				}
				if (label === 'html' || label === 'handlebars' || label === 'razor') {
					return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url))
				}
				if (label === 'typescript' || label === 'javascript') {
					return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url))
				}
				return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url))
			},
		}
	}

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft(prev => Math.max(0, prev - 1))
		}, 1000)

		return () => clearInterval(timer)
	}, [])

	useEffect(() => {
		setCode(starterCode[language] || starterCode.Python)
	}, [language])

	useEffect(() => {
		if (!applicationId || !jobId || lastVerdict === 'accepted' || lastVerdict === 'wrong_answer' || lastVerdict === 'time_limit_exceeded' || lastVerdict === 'runtime_error' || lastVerdict === 'compilation_error') {
			return
		}

		const poll = async () => {
			try {
				const response = await fetch(`/api/v1/submissions/latest?application_id=${applicationId}`, {
					cache: 'no-store',
				})

				const data = await response.json()
				if (!response.ok || !data?.success) {
					return
				}

				const verdict = data?.data?.verdict as string | undefined
				if (verdict) {
					setLastVerdict(verdict)
					setSubmissionStatus(`Result: ${verdict.replace(/_/g, ' ')}`)

					if (verdict !== 'pending') {
						setConsoleOutput(data?.data?.output || 'Execution completed.')
					}
				}
			} catch {
				// Ignore polling failures.
			}
		}

		const interval = setInterval(poll, 2500)
		return () => clearInterval(interval)
	}, [applicationId, jobId, lastVerdict])

	const handleRun = async () => {
		if (!applicationId) {
			setConsoleOutput('Missing application id. Please return to the assessment lobby and try again.')
			return
		}

		if (!selectedProblem?.id) {
			setConsoleOutput('Loading coding problem. Please wait a moment and try again.')
			return
		}

		if (!code.trim()) {
			setConsoleOutput('Please write some code before running.')
			return
		}

		setIsSubmitting(true)
		setSubmissionError('')
		setFinalizeError('')
		setSubmissionStatus('Submitting...')
		setConsoleOutput('Submitting to Judge0...\n')

		try {
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 10000)

			const submissionPayload = {
				application_id: applicationId,
				coding_problem_id: selectedProblem.id,
				code,
				language: monacoLanguageMap[language],
				test_cases: sampleTestCases,
				time_limit: 2,
			}

			console.log('[MonacoEditor] Submitting code with payload:', {
				application_id: submissionPayload.application_id,
				coding_problem_id: submissionPayload.coding_problem_id,
				language: submissionPayload.language,
				code_length: submissionPayload.code.length,
			})

			const response = await fetch('/api/v1/submissions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(submissionPayload),
				signal: controller.signal,
			})

			clearTimeout(timeoutId)

			const data = await response.json()

			console.log('[MonacoEditor] Submission response:', data)

			if (!response.ok || !data?.success) {
				console.error('[MonacoEditor] Submission failed:', data?.error)
				throw new Error(data?.error || 'Failed to submit code')
			}

			console.log('[MonacoEditor] Submission successful:', {
				job_id: data.data?.job_id,
				status: data.data?.status,
			})
			setHasRunOnce(true)
			setJobId(data.data?.job_id || '')
			setSubmissionStatus('Queued')
			setConsoleOutput('Submission queued. Waiting for results...')
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
	}

	const handleFinalize = async () => {
		if (!hasRunOnce) {
			setFinalizeError('Run the code once to get results')
			return
		}

		if (!applicationId) {
			setFinalizeError('Missing application id. Return to the assessment lobby and try again.')
			return
		}

		if (!session?.access_token) {
			setFinalizeError('You must be signed in to finalise this round.')
			return
		}

		try {
			const response = await fetch('/api/v1/candidate/coding-finalize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`,
				},
				body: JSON.stringify({ application_id: applicationId }),
			})

			const data = await response.json()
			if (!response.ok) {
				throw new Error(data.error || 'Failed to finalise submission')
			}

			try {
				localStorage.setItem(`codingStatus:${applicationId}`, 'completed')
			} catch {
				// Ignore local storage failures.
			}

			router.push(`/candidate/${applicationId}/assessment`)
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to finalise submission'
			setFinalizeError(message)
		}
	}

	const isRed = timeLeft < 5 * 60
	const verdictLabel = lastVerdict ? lastVerdict.replace(/_/g, ' ') : 'pending'

	return (
		<div
			className="flex flex-col overflow-hidden"
			style={{
				backgroundColor: '#1D202A',
				minHeight: '100vh',
			}}
		>
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
						{problemTitle}
					</span>

					<span
						className="text-xs px-2 py-1 rounded"
						style={{
							backgroundColor: 'rgba(62,207,142,0.1)',
							color: '#3ECF8E',
						}}
					>
						{problemDifficulty}
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
							{problemDescription}
						</p>

						{selectedProblem?.sample_input ? (
							<div className="mt-6 space-y-4">
								<div>
									<p className="text-xs font-semibold uppercase mb-2" style={{ color: '#586074' }}>
										Sample Input
									</p>
									<pre className="p-3 rounded text-xs overflow-auto" style={{ backgroundColor: '#1D202A', color: '#D4D8E4' }}>
										{selectedProblem.sample_input}
									</pre>
								</div>

								<div>
									<p className="text-xs font-semibold uppercase mb-2" style={{ color: '#586074' }}>
										Sample Output
									</p>
									<pre className="p-3 rounded text-xs overflow-auto" style={{ backgroundColor: '#1D202A', color: '#D4D8E4' }}>
										{selectedProblem.sample_output || 'No sample output provided.'}
									</pre>
								</div>
							</div>
						) : null}

						{problemError ? (
							<p className="mt-4 text-xs" style={{ color: '#EF6B6B' }}>
								{problemError}
							</p>
						) : null}
					</div>
				</div>

				<div className="flex-1 flex flex-col min-w-0">
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
									const newLang = e.target.value

									setLanguage(newLang)
									setCode(starterCode[newLang] || starterCode.Python)
									setConsoleOutput('')
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
							disabled={isSubmitting || problemLoading || !selectedProblem}
							className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-opacity"
							style={{
								backgroundColor: '#3ECF8E',
								color: '#08120D',
								opacity: isSubmitting || problemLoading || !selectedProblem ? 0.7 : 1,
							}}
						>
							<Play size={14} />
							{isSubmitting ? 'Submitting...' : problemLoading ? 'Loading problem...' : 'Run Code'}
						</button>
					</div>

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
								{submissionError ? `Error: ${submissionError}` : `${submissionStatus}${lastVerdict ? ` (${verdictLabel})` : ''}`}
							</div>
						) : null}
					</div>
				</div>

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
							Sample Case
						</p>
					</div>

					<div className="p-3 space-y-3">
						{sampleTestCases.length > 0 ? sampleTestCases.map((tc, index) => (
							<div
								key={index}
								className="p-3 rounded border"
								style={{
									borderColor: 'rgba(255,255,255,0.06)',
									backgroundColor: '#1D202A',
								}}
							>
								<div className="flex items-center gap-2 mb-2">
									{lastVerdict && lastVerdict !== 'pending' ? (
										lastVerdict === 'accepted' ? (
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
											color: lastVerdict === 'accepted' ? '#3ECF8E' : '#7E8494',
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
									Expected: {tc.expected_output}
								</p>

								{lastVerdict && lastVerdict !== 'pending' ? (
									<p
										className="text-xs mt-1"
										style={{ color: lastVerdict === 'accepted' ? '#3ECF8E' : '#EF6B6B' }}
									>
										Verdict: {verdictLabel}
									</p>
								) : null}
							</div>
						)) : (
							<div className="p-3 rounded border" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#1D202A' }}>
								<p className="text-xs" style={{ color: '#7E8494' }}>
									Loading sample problem data...
								</p>
							</div>
						)}

						<div className="mt-4 border-t border-border pt-3">
							{finalizeError ? (
								<div className="mb-2 flex items-start gap-2 rounded border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
									{finalizeError}
								</div>
							) : null}
							<button
								type="button"
								onClick={handleFinalize}
								className="w-full py-2.5 text-xs font-bold rounded transition-colors cursor-pointer bg-accent-purple hover:bg-accent-purple-hover text-white"
							>
								Finalise Submission
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}