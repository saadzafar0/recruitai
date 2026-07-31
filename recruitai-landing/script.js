/* -------------------------------------------------------------
 * RecruitAI Landing Page — Redesign 2.0 JS
 * Includes Light Mode Theme Toggling and Calculators
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {

  // Theme Toggling Logic
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  // Load saved theme preference
  const savedTheme = localStorage.getItem('recruitai-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  } else if (savedTheme === 'dark') {
    document.body.classList.remove('light-mode');
  } else {
    // Fallback to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.body.classList.add('light-mode');
    }
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    
    // Save preference
    if (document.body.classList.contains('light-mode')) {
      localStorage.setItem('recruitai-theme', 'light');
    } else {
      localStorage.setItem('recruitai-theme', 'dark');
    }
  });


  // Candidate metrics (simulated default profile)
  const candidateMetrics = {
    cv: 86,
    voice: 79,
    code: 91,
    design: 68
  };

  // Selectors
  const sliderCv = document.getElementById('slide-cv');
  const sliderVoice = document.getElementById('slide-voice');
  const sliderCode = document.getElementById('slide-code');
  const sliderDesign = document.getElementById('slide-design');

  const valCv = document.getElementById('val-cv');
  const valVoice = document.getElementById('val-voice');
  const valCode = document.getElementById('val-code');
  const valDesign = document.getElementById('val-design');

  const calcScoreEl = document.getElementById('calc-score');
  const calcTierEl = document.getElementById('calc-tier');
  const calcPercentileEl = document.getElementById('calc-percentile');
  const calcConfidenceEl = document.getElementById('calc-confidence');
  
  const errorBox = document.getElementById('weight-error-box');
  const currentSumEl = document.getElementById('weight-current-sum');
  const btnLock = document.getElementById('btn-lock-pipeline');

  const contactForm = document.getElementById('contact-form');
  const successBox = document.getElementById('success-box');

  function calculateScore() {
    const wCv = parseInt(sliderCv.value);
    const wVoice = parseInt(sliderVoice.value);
    const wCode = parseInt(sliderCode.value);
    const wDesign = parseInt(sliderDesign.value);

    // Update text labels
    valCv.textContent = `${wCv}%`;
    valVoice.textContent = `${wVoice}%`;
    valCode.textContent = `${wCode}%`;
    valDesign.textContent = `${wDesign}%`;

    const totalWeight = wCv + wVoice + wCode + wDesign;
    currentSumEl.textContent = totalWeight;

    if (totalWeight !== 100) {
      errorBox.style.display = 'flex';
      btnLock.disabled = true;
      btnLock.style.opacity = '0.5';
      btnLock.style.cursor = 'not-allowed';
      
      // Calculate normalized score for display continuity
      if (totalWeight > 0) {
        const factor = 100 / totalWeight;
        const normalizedScore = Math.round(
          ((wCv * factor * candidateMetrics.cv) +
           (wVoice * factor * candidateMetrics.voice) +
           (wCode * factor * candidateMetrics.code) +
           (wDesign * factor * candidateMetrics.design)) / 100
        );
        calcScoreEl.textContent = normalizedScore;
        updateOutputMetrics(normalizedScore);
      }
    } else {
      errorBox.style.display = 'none';
      btnLock.disabled = false;
      btnLock.style.opacity = '1';
      btnLock.style.cursor = 'pointer';

      // Standard weighted average
      const score = Math.round(
        (wCv * candidateMetrics.cv +
         wVoice * candidateMetrics.voice +
         wCode * candidateMetrics.code +
         wDesign * candidateMetrics.design) / 100
      );

      calcScoreEl.textContent = score;
      updateOutputMetrics(score);
    }
  }

  function updateOutputMetrics(score) {
    // Recommendation Tier
    if (score >= 80) {
      calcTierEl.textContent = 'Strong Yes';
      calcTierEl.style.color = 'var(--accent-teal)';
      calcConfidenceEl.textContent = 'Optimal';
      calcScoreEl.style.color = 'var(--accent-teal)';
    } else if (score >= 65) {
      calcTierEl.textContent = 'Shortlist';
      calcTierEl.style.color = 'var(--text-primary)';
      calcConfidenceEl.textContent = 'High';
      calcScoreEl.style.color = 'var(--text-primary)';
    } else {
      calcTierEl.textContent = 'Requires Review';
      calcTierEl.style.color = 'var(--accent-rose)';
      calcConfidenceEl.textContent = 'Under Audit';
      calcScoreEl.style.color = 'var(--accent-rose)';
    }

    // Realistic Percentile Mapping
    const percentile = Math.min(99.8, Math.max(5.4, (score * 1.18) - 2.5)).toFixed(1);
    calcPercentileEl.textContent = `${percentile}%`;
  }

  // Event Listeners for Sliders
  [sliderCv, sliderVoice, sliderCode, sliderDesign].forEach(slider => {
    slider.addEventListener('input', calculateScore);
  });

  // Lock Assessment Pipeline Visual Feedback
  btnLock.addEventListener('click', () => {
    btnLock.textContent = 'Configuration Saved ✓';
    btnLock.style.borderColor = 'var(--accent-teal)';
    btnLock.style.color = 'var(--accent-teal)';
    
    setTimeout(() => {
      btnLock.textContent = 'Lock Evaluation weights';
      btnLock.style.borderColor = 'var(--border-muted)';
      btnLock.style.color = 'var(--text-primary)';
    }, 2000);
  });

  // Inquiry Form Submission
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Visual loading state
    const submitBtn = contactForm.querySelector('.form-submit-btn');
    const btnSpan = submitBtn.querySelector('span');
    btnSpan.textContent = 'Requesting Demo...';
    submitBtn.style.opacity = '0.7';

    setTimeout(() => {
      // Hide form, show success message
      contactForm.style.display = 'none';
      successBox.style.display = 'flex';
      
      // Smooth fade-in
      successBox.style.opacity = '0';
      setTimeout(() => {
        successBox.style.transition = 'opacity 0.5s ease';
        successBox.style.opacity = '1';
      }, 50);
    }, 1000);
  });

  // Run Initial Calculations
  calculateScore();
});
