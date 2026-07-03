'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'

// Static candidate profile used for weight calculation simulation
const candidateMetrics = {
  cv: 86,
  voice: 79,
  code: 91,
  design: 68
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Sliders State
  const [wCc, setWCc] = useState(25)
  const [wVoice, setWVoice] = useState(35)
  const [wCode, setWCode] = useState(30)
  const [wDesign, setWDesign] = useState(10)

  // Button lock feedback state
  const [lockStatus, setLockStatus] = useState('Lock Evaluation weights')

  // Form State
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formCompany, setFormCompany] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Calculations
  const totalWeight = wCc + wVoice + wCode + wDesign
  const isValidSum = totalWeight === 100

  let score = 0
  if (isValidSum) {
    score = Math.round(
      (wCc * candidateMetrics.cv +
        wVoice * candidateMetrics.voice +
        wCode * candidateMetrics.code +
        wDesign * candidateMetrics.design) /
        100
    )
  } else if (totalWeight > 0) {
    // Normalized score for preview continuity when sliders are active
    const factor = 100 / totalWeight
    score = Math.round(
      (wCc * factor * candidateMetrics.cv +
        wVoice * factor * candidateMetrics.voice +
        wCode * factor * candidateMetrics.code +
        wDesign * factor * candidateMetrics.design) /
        100
    )
  }

  // Rec Tier & Color Output
  let recTier = 'Requires Review'
  let recColor = 'var(--accent-rose)'
  let confidence = 'Under Audit'
  let scoreColor = 'var(--text-primary)'

  if (score >= 80) {
    recTier = 'Strong Yes'
    recColor = 'var(--accent-teal)'
    confidence = 'Optimal'
    scoreColor = 'var(--accent-teal)'
  } else if (score >= 65) {
    recTier = 'Shortlist'
    recColor = 'var(--text-primary)'
    confidence = 'High'
    scoreColor = 'var(--text-primary)'
  }

  // Realistic Percentile Mapping
  const percentile = Math.min(99.8, Math.max(5.4, score * 1.18 - 2.5)).toFixed(1)

  const handleLockWeights = () => {
    if (!isValidSum) return
    setLockStatus('Configuration Saved ✓')
    setTimeout(() => {
      setLockStatus('Lock Evaluation weights')
    }, 2000)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1000)
  }

  return (
    <div className="landing-wrapper">
      {/* Background Glow Blob */}
      <div className="diffused-glow" id="glow-1"></div>

      {/* Header Navigation */}
      <header className="navbar-wrapper">
        <div className="navbar-container">
          <div className="navbar-logo">
            <span className="logo-main-text">RECRUITAI</span>
            <span className="logo-tagline">— The Technical Assessment Platform</span>
          </div>
          <nav className="navbar-links">
            <a href="#methodology" className="nav-link">Methodology</a>
            <a href="#calibrator" className="nav-link">Simulation</a>
            <a href="#inquiry" className="nav-link">Inquire</a>
          </nav>
          <div className="navbar-actions">
            <button 
              id="theme-toggle" 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="theme-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg className="theme-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              )}
            </button>
            <a href="#inquiry" className="cta-button-nav">Request a Demo</a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-scroller">

        {/* Hero Section */}
        <section className="section-hero">
          <div className="hero-content">
            <div className="label-container">
              <span className="label-clean">TECHNICAL SCREENING PLATFORM</span>
            </div>
            <h1 className="hero-title">
              Hire the Right Tech Talent, <span className="serif-italic">Faster</span>.
            </h1>
            <p className="hero-description">
              Evaluate engineering talent with mathematical objectivity. Conduct automated voice interviews and sandboxed coding challenges that score candidates in real-time — saving hours of developer review while removing bias.
            </p>
            <div className="hero-ctas">
              <a href="#inquiry" className="button-primary">Request a Demo</a>
              <a href="#methodology" className="button-secondary">Explore Platform</a>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="visual-editorial-pane">
              <div className="pane-header">
                <span className="pane-header-title">EVALUATION SUMMARY</span>
                <span className="pane-header-status">COMPLETED</span>
              </div>
              <div className="pane-body">
                <div className="record-meta">
                  <span className="meta-label">CANDIDATE:</span>
                  <span className="meta-value">Adrian Sterling</span>
                </div>
                <div className="record-meta">
                  <span className="meta-label">ROLE:</span>
                  <span className="meta-value">Senior Systems Engineer</span>
                </div>
                
                <div className="divider-line"></div>
                
                <div className="percentile-box">
                  <span className="percentile-lbl">OVERALL STANDING</span>
                  <span className="percentile-val">Top 5.8% of Applicants</span>
                </div>

                <div className="divider-line"></div>
                
                <div className="skills-summary-wrapper">
                  <span className="skills-summary-header">SKILLS ASSESSMENT (SCORES 0-100)</span>
                  
                  <div className="skill-meter-group">
                    <div className="skill-meter-info">
                      <span className="skill-name">Resume Fit</span>
                      <span className="skill-score">85</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div className="skill-meter-group">
                    <div className="skill-meter-info">
                      <span className="skill-name">Voice Simulation</span>
                      <span className="skill-score">78</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: '78%' }}></div>
                    </div>
                  </div>

                  <div className="skill-meter-group">
                    <div className="skill-meter-info">
                      <span className="skill-name">Coding Sandbox</span>
                      <span className="skill-score">92</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="divider-line"></div>
                
                <div className="record-summary">
                  <span className="summary-label">OVERALL RECOMMENDATION:</span>
                  <span className="summary-value text-teal">Strong Pass (Review Recommended)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section className="section-methodology" id="methodology">
          <div className="section-divider-line"></div>
          <div className="section-header-minimal">
            <span className="section-tag-mono">PIPELINE METHODOLOGY</span>
            <span className="section-desc-clean">Autonomous screening via voice simulations and code execution</span>
          </div>

          <div className="methodology-grid">
            {/* Column 1 */}
            <div className="methodology-column">
              <div className="column-num">01</div>
              <h3 className="column-title">Conversational Interviewing</h3>
              <p className="column-description">
                Conduct human-like voice assessments to evaluate communication, problem solving, and role fit using Vapi conversational logic.
              </p>
              <div className="minimal-visual-voice">
                <div className="wave-line"></div>
                <div className="wave-line wave-alt"></div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="methodology-column">
              <div className="column-num">02</div>
              <h3 className="column-title">Sandboxed Coding Challenges</h3>
              <p className="column-description">
                Execute code submissions against automated test suites in a secure sandbox to verify correctness and complexity using Judge0.
              </p>
              <div className="minimal-visual-code">
                <span className="code-lbl">// RUNNING AUTOMATED UNIT TESTS</span>
                <span className="code-res">PASS (14/14 cases) [O(N log N)]</span>
              </div>
            </div>

            {/* Column 3 */}
            <div className="methodology-column">
              <div className="column-num">03</div>
              <h3 className="column-title">Objective System Design</h3>
              <p className="column-description">
                Evaluate architectural logic and trade-offs dynamically, scoring results against standard industry rubrics to measure scalability.
              </p>
              <div className="minimal-visual-design">
                <div className="design-box">Client</div>
                <span className="arrow">→</span>
                <div className="design-box">Balancer</div>
              </div>
            </div>
          </div>
        </section>

        {/* Talent Calibrator Section (Simulation) */}
        <section className="section-calibrator" id="calibrator">
          <div className="section-divider-line"></div>
          <div className="section-header-minimal">
            <span className="section-tag-mono">PIPELINE CALIBRATOR</span>
            <span className="section-desc-clean">Dynamic weights simulation for composite scoring</span>
          </div>

          <div className="calibrator-container">
            <div className="calibrator-settings">
              <span className="section-mono-tag">CONFIGURATION DECK</span>
              <div className="sliders-wrapper" style={{ marginTop: '16px' }}>
                {/* Slider 1 */}
                <div className="slider-group">
                  <div className="slider-info">
                    <span className="slider-label">CV Relevance Weight</span>
                    <span className="slider-value">{wCc}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={wCc} 
                    onChange={(e) => setWCc(parseInt(e.target.value))}
                    className="range-slider"
                  />
                </div>

                {/* Slider 2 */}
                <div className="slider-group">
                  <div className="slider-info">
                    <span className="slider-label">Voice Resonance (Vapi)</span>
                    <span className="slider-value">{wVoice}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={wVoice} 
                    onChange={(e) => setWVoice(parseInt(e.target.value))}
                    className="range-slider"
                  />
                </div>

                {/* Slider 3 */}
                <div className="slider-group">
                  <div className="slider-info">
                    <span className="slider-label">Coding Sandbox (Judge0)</span>
                    <span className="slider-value">{wCode}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={wCode} 
                    onChange={(e) => setWCode(parseInt(e.target.value))}
                    className="range-slider"
                  />
                </div>

                {/* Slider 4 */}
                <div className="slider-group">
                  <div className="slider-info">
                    <span className="slider-label">System Design Evaluation</span>
                    <span className="slider-value">{wDesign}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={wDesign} 
                    onChange={(e) => setWDesign(parseInt(e.target.value))}
                    className="range-slider"
                  />
                </div>
                
                {!isValidSum && (
                  <div className="weight-status-box" id="weight-error-box">
                    <span className="error-msg">Pipeline Error: Weights must sum to 100%. Current sum: <span>{totalWeight}</span>%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="calibrator-preview">
              <div className="preview-editorial-card">
                <h3 className="preview-title">Simulation Output</h3>
                
                <div className="preview-score-display">
                  <span className="score-large" style={{ color: scoreColor }}>{score}</span>
                  <span className="score-label">Composite Score</span>
                </div>

                <div className="preview-metrics">
                  <div className="metric-row">
                    <span className="metric-lbl">Recommendation:</span>
                    <span className="metric-val" style={{ color: recColor }}>{recTier}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-lbl">Target Percentile:</span>
                    <span className="metric-val">{percentile}%</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-lbl">Analysis Integrity:</span>
                    <span className="metric-val text-teal">{confidence}</span>
                  </div>
                </div>

                <button 
                  className="btn-gauge-lock" 
                  onClick={handleLockWeights}
                  disabled={!isValidSum}
                  style={!isValidSum ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  {lockStatus}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Secure Intake Portal (Form) */}
        <section className="section-inquiry" id="inquiry">
          <div className="inquiry-editorial-card">
            <div className="section-divider-line"></div>
            <div className="section-header-minimal">
              <span className="section-tag-mono">INTAKE PORTAL</span>
              <span className="section-desc-clean">Secure demonstration request queue</span>
            </div>

            {!isSubmitted ? (
              <form className="inquiry-form" onSubmit={handleFormSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      required 
                      placeholder="e.g. Adrian Sterling" 
                      className="form-input"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Business Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      required 
                      placeholder="adrian@organization.com" 
                      className="form-input"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="company" className="form-label">Company Name</label>
                  <input 
                    type="text" 
                    id="company" 
                    required 
                    placeholder="e.g. Zenith Tech" 
                    className="form-input"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">Recruitment Volume / Details</label>
                  <textarea 
                    id="message" 
                    required 
                    placeholder="Briefly describe your annual technical hiring volume and current bottlenecks..." 
                    className="form-input form-textarea"
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="form-submit-btn"
                  disabled={isSubmitting}
                  style={isSubmitting ? { opacity: 0.7 } : {}}
                >
                  <span>{isSubmitting ? 'Requesting Demo...' : 'Request a Demo'}</span>
                </button>
              </form>
            ) : (
              <div 
                className="form-success-message" 
                style={{ 
                  opacity: 1, 
                  transition: 'opacity 0.5s ease' 
                }}
              >
                <h3>Inquiry Logged ✓</h3>
                <p>Your request has been registered. An integration engineer will contact your team's representative shortly.</p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="footer-wrapper">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="logo-main-text">RECRUITAI</span>
          </div>
          <p className="footer-copy">© 2026 RecruitAI Technologies Inc. All rights reserved. System configurations are fully compliant with ISO 27001.</p>
          <div className="footer-status">
            <span className="status-pulse"></span>
            <span className="status-lbl">Secure Node Live</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
