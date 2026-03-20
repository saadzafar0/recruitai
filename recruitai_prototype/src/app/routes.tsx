import { createBrowserRouter } from 'react-router';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import RecruiterLayout from './components/layout/RecruiterLayout';
import CandidateLayout from './components/layout/CandidateLayout';
import Dashboard from './pages/recruiter/Dashboard';
import Candidates from './pages/recruiter/Candidates';
import CandidateProfile from './pages/recruiter/CandidateProfile';
import InterviewAnalytics from './pages/recruiter/InterviewAnalytics';
import AssessmentDeepDive from './pages/recruiter/AssessmentDeepDive';
import SystemDesignReview from './pages/recruiter/SystemDesignReview';
import Interviews from './pages/recruiter/Interviews';
import Assessments from './pages/recruiter/Assessments';
import Settings from './pages/recruiter/Settings';
import CVViewer from './pages/recruiter/CVViewer';
import RecruiterProfile from './pages/recruiter/RecruiterProfile';
import AssessmentLobby from './pages/candidate/AssessmentLobby';
import VoiceInterview from './pages/candidate/VoiceInterview';
import CodingTest from './pages/candidate/CodingTest';
import SystemDesign from './pages/candidate/SystemDesign';
import Confirmation from './pages/candidate/Confirmation';
import CandidateProfilePage from './pages/candidate/CandidateProfilePage';
import { CandidateProvider } from './context/CandidateContext';

function CandidateProviderWrapper() {
  return (
    <CandidateProvider>
      <CandidateLayout />
    </CandidateProvider>
  );
}

export const router = createBrowserRouter([
  { path: '/', Component: Homepage },
  { path: '/login', Component: Login },
  { path: '/signup', Component: SignUp },
  {
    path: '/recruiter',
    Component: RecruiterLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'candidates', Component: Candidates },
      { path: 'candidates/:id', Component: CandidateProfile },
      { path: 'candidates/:id/interview', Component: InterviewAnalytics },
      { path: 'candidates/:id/assessment', Component: AssessmentDeepDive },
      { path: 'candidates/:id/system-design', Component: SystemDesignReview },
      { path: 'candidates/:id/cv', Component: CVViewer },
      { path: 'profile', Component: RecruiterProfile },
      { path: 'interviews', Component: Interviews },
      { path: 'assessments', Component: Assessments },
      { path: 'settings', Component: Settings },
    ],
  },
  {
    path: '/candidate',
    Component: CandidateProviderWrapper,
    children: [
      { index: true, Component: AssessmentLobby },
      { path: 'voice-interview', Component: VoiceInterview },
      { path: 'coding-test', Component: CodingTest },
      { path: 'system-design', Component: SystemDesign },
      { path: 'confirmation', Component: Confirmation },
      { path: 'profile', Component: CandidateProfilePage },
    ],
  },
]);
