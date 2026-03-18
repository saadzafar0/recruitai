import type { NextPage } from 'next'

const Home: NextPage = () => {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>RecruitAI API</h1>
      <p>Automated recruitment and candidate evaluation system</p>

      <h2>Available Endpoints</h2>
      <ul>
        <li>
          <code>POST /api/v1/applications</code> - Submit a new job application
        </li>
      </ul>

      <h3>Example Request</h3>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
{`curl -X POST https://your-domain.com/api/v1/applications \\
  -H "Content-Type: application/json" \\
  -d '{
    "job_id": "a0000000-0000-0000-0000-000000000100",
    "email": "candidate@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+92-300-1234567",
    "linkedin_url": "https://linkedin.com/in/johndoe"
  }'`}
      </pre>
    </div>
  )
}

export default Home
