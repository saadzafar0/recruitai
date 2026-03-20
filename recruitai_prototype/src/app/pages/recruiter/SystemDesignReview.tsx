import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { candidates, systemDesignResponse } from '../../data/mockData';

function getScoreColor(score: number) {
  if (score >= 80) return '#3ECF8E';
  if (score >= 65) return '#E5A93B';
  return '#EF6B6B';
}

function ScoreSection({
  title,
  score,
  comment,
}: {
  title: string;
  score: number;
  comment: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold" style={{ color: '#E2E4EB' }}>
          {title}
        </span>
        <span className="text-sm font-semibold" style={{ color: getScoreColor(score) }}>
          {score}/100
        </span>
      </div>
      <div className="h-2 rounded-full mb-2.5" style={{ backgroundColor: '#1D202A' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: '#9585F5' }}
        />
      </div>
      <p className="text-sm leading-relaxed" style={{ color: '#7E8494' }}>{comment}</p>
    </div>
  );
}

export default function SystemDesignReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const candidate = candidates.find(c => c.id === id) || candidates[0];
  const designScore = Math.round((candidate.codingScore + candidate.communicationScore) / 2);

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
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
          System Design Review
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#7E8494' }}>
          {candidate.name} · Design a URL Shortener · Submitted Feb 23, 2026
        </p>
      </div>

      {/* Scenario question */}
      <div
        className="rounded-lg px-5 py-4 mb-5 border"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          borderLeft: '4px solid #7C6AEF',
          backgroundColor: '#1D202A',
        }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: '#7C6AEF' }}>
          SCENARIO QUESTION
        </p>
        <p className="text-sm leading-relaxed" style={{ color: '#E2E4EB' }}>
          Design a URL shortening service (similar to bit.ly) that can handle 100 million
          requests per day. Your design should cover the write path (shortening a URL),
          the read path (expanding a short URL), the data model, caching strategy, and
          how you would scale the system to meet traffic demand. Discuss trade-offs where
          applicable.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Candidate response */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-lg border overflow-hidden"
            style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
                Candidate's Written Response
              </h3>
            </div>
            <div
              className="px-5 py-4 overflow-y-auto text-sm leading-relaxed"
              style={{ maxHeight: 460, whiteSpace: 'pre-wrap', color: '#7E8494' }}
            >
              {systemDesignResponse}
            </div>
          </div>
        </div>

        {/* AI Feedback */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-5">
          <div
            className="rounded-lg p-5 border"
            style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            <h3 className="mb-4" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
              AI Feedback
            </h3>
            <ScoreSection
              title="Scalability Understanding"
              score={Math.min(designScore + 4, 100)}
              comment="Strong grasp of horizontal scaling and caching strategies. Correctly identified read-heavy workload and addressed it with CDN and Redis layers. Could benefit from deeper discussion of database sharding strategies."
            />
            <ScoreSection
              title="Architecture Clarity"
              score={designScore}
              comment="The write and read paths were clearly separated and logically described. Component responsibilities are well-defined. The inclusion of a BFF pattern consideration shows mature thinking."
            />
            <ScoreSection
              title="Design Principles"
              score={Math.max(designScore - 3, 0)}
              comment="Demonstrates understanding of CAP theorem trade-offs implicitly. Data retention and cleanup strategy is a positive inclusion. Rate limiting mention shows awareness of real-world concerns."
            />
          </div>

          {/* Overall verdict */}
          <div
            className="rounded-lg p-5 border"
            style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#E2E4EB' }}>
                Overall AI Verdict
              </h3>
              <span
                className="text-sm font-semibold px-2.5 py-1 rounded"
                style={{
                  backgroundColor: designScore >= 80 ? 'rgba(62,207,142,0.08)' : designScore >= 65 ? 'rgba(229,169,59,0.08)' : 'rgba(239,107,107,0.08)',
                  color: getScoreColor(designScore),
                }}
              >
                {designScore}/100
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#7E8494' }}>
              {candidate.name}'s system design response demonstrates a strong command of
              distributed systems fundamentals. The solution is well-structured,
              covers all key components, and shows practical awareness of production
              concerns. Recommended for{' '}
              <span style={{ color: designScore >= 80 ? '#3ECF8E' : '#E5A93B' }}>
                {designScore >= 80 ? 'advancement to final round' : 'further technical screening'}.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
