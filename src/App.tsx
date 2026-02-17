import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages';

// Lazy load non-critical routes
const Events = lazy(() => import('./pages/Events').then(m => ({ default: m.Events })));
const Jobs = lazy(() => import('./pages/Jobs').then(m => ({ default: m.Jobs })));
const JobPostPlans = lazy(() => import('./pages/JobPostPlans').then(m => ({ default: m.JobPostPlans })));
const JobDetail = lazy(() => import('./pages/JobDetail').then(m => ({ default: m.JobDetail })));
const JobSubmit = lazy(() => import('./pages/JobSubmit').then(m => ({ default: m.JobSubmit })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const AdminJobs = lazy(() => import('./pages/AdminJobs').then(m => ({ default: m.AdminJobs })));
const BecomeMember = lazy(() => import('./pages/BecomeMember').then(m => ({ default: m.BecomeMember })));
const BecomeSpeaker = lazy(() => import('./pages/BecomeSpeaker').then(m => ({ default: m.BecomeSpeaker })));
const BecomeSponsor = lazy(() => import('./pages/BecomeSponsor').then(m => ({ default: m.BecomeSponsor })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const CodeOfConduct = lazy(() => import('./pages/CodeOfConduct').then(m => ({ default: m.CodeOfConduct })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading...
      </div>
    </div>
  );
}

function App() {
  const basename = import.meta.env.BASE_URL || '/';

  return (
    <Router basename={basename}>
      <ScrollToTop />
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event" element={<Navigate to="/events" replace />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/post" element={<JobPostPlans />} />
            <Route path="/jobs/submit" element={<JobSubmit />} />
            <Route path="/jobs/:slug" element={<JobDetail />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/jobs" element={<AdminJobs />} />
            <Route path="/job-board" element={<Navigate to="/jobs" replace />} />
            <Route path="/previous-talks" element={<Navigate to="/events" replace />} />
            <Route path="/join" element={<BecomeMember />} />
            <Route path="/become-a-member" element={<Navigate to="/join" replace />} />
            <Route path="/get-involved" element={<Navigate to="/join#volunteer" replace />} />
            <Route path="/become-a-speaker" element={<BecomeSpeaker />} />
            <Route path="/become-a-sponsor" element={<BecomeSponsor />} />
            <Route path="/about" element={<About />} />
            <Route path="/code-of-conduct" element={<CodeOfConduct />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
