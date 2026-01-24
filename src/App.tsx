import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages';

// Lazy load non-critical routes
const PreviousTalks = lazy(() => import('./pages/PreviousTalks').then(m => ({ default: m.PreviousTalks })));
const BecomeMember = lazy(() => import('./pages/BecomeMember').then(m => ({ default: m.BecomeMember })));
const BecomeSpeaker = lazy(() => import('./pages/BecomeSpeaker').then(m => ({ default: m.BecomeSpeaker })));
const BecomeSponsor = lazy(() => import('./pages/BecomeSponsor').then(m => ({ default: m.BecomeSponsor })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const CodeOfConduct = lazy(() => import('./pages/CodeOfConduct').then(m => ({ default: m.CodeOfConduct })));
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
  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/previous-talks" element={<PreviousTalks />} />
            <Route path="/join" element={<BecomeMember />} />
            <Route path="/become-a-member" element={<Navigate to="/join" replace />} />
            <Route path="/get-involved" element={<Navigate to="/join#volunteer" replace />} />
            <Route path="/become-a-speaker" element={<BecomeSpeaker />} />
            <Route path="/become-a-sponsor" element={<BecomeSponsor />} />
            <Route path="/about" element={<About />} />
            <Route path="/code-of-conduct" element={<CodeOfConduct />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
