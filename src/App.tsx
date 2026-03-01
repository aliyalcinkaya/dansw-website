import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { trackPageView } from './services/analytics';

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Events = lazy(() => import('./pages/Events').then((module) => ({ default: module.Events })));
const TalkDetails = lazy(() => import('./pages/TalkDetails').then((module) => ({ default: module.TalkDetails })));
const Jobs = lazy(() => import('./pages/Jobs').then((module) => ({ default: module.Jobs })));
const JobPostPlans = lazy(() => import('./pages/JobPostPlans').then((module) => ({ default: module.JobPostPlans })));
const JobSubmit = lazy(() => import('./pages/JobSubmit').then((module) => ({ default: module.JobSubmit })));
const JobDetail = lazy(() => import('./pages/JobDetail').then((module) => ({ default: module.JobDetail })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then((module) => ({ default: module.AdminPanel })));
const AdminJobs = lazy(() => import('./pages/AdminJobs').then((module) => ({ default: module.AdminJobs })));
const AdminEvents = lazy(() => import('./pages/AdminEvents').then((module) => ({ default: module.AdminEvents })));
const AdminSpeakers = lazy(() => import('./pages/AdminSpeakers').then((module) => ({ default: module.AdminSpeakers })));
const AdminSocialPosts = lazy(
  () => import('./pages/AdminSocialPosts').then((module) => ({ default: module.AdminSocialPosts }))
);
const AdminFormRouting = lazy(
  () => import('./pages/AdminFormRouting').then((module) => ({ default: module.AdminFormRouting }))
);
const AdminUsers = lazy(() => import('./pages/AdminUsers').then((module) => ({ default: module.AdminUsers })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then((module) => ({ default: module.AdminLogin })));
const BecomeMember = lazy(() => import('./pages/BecomeMember').then((module) => ({ default: module.BecomeMember })));
const BecomeSpeaker = lazy(
  () => import('./pages/BecomeSpeaker').then((module) => ({ default: module.BecomeSpeaker }))
);
const BecomeSponsor = lazy(
  () => import('./pages/BecomeSponsor').then((module) => ({ default: module.BecomeSponsor }))
);
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Contact = lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })));
const CodeOfConduct = lazy(
  () => import('./pages/CodeOfConduct').then((module) => ({ default: module.CodeOfConduct }))
);
const PrivacyPolicy = lazy(
  () => import('./pages/PrivacyPolicy').then((module) => ({ default: module.PrivacyPolicy }))
);
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));

function RouteAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(fullPath);
  }, [location.hash, location.pathname, location.search]);

  return null;
}

function App() {
  const basename = import.meta.env.BASE_URL || '/';

  return (
    <Router basename={basename}>
      <RouteAnalyticsTracker />
      <ScrollToTop />
      <Layout>
        <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-16 text-[var(--color-text-muted)]">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event" element={<Navigate to="/events" replace />} />
            <Route path="/talks/:eventId" element={<TalkDetails />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/post" element={<JobPostPlans />} />
            <Route path="/jobs/submit" element={<JobSubmit />} />
            <Route path="/jobs/:slug" element={<JobDetail />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/jobs" element={<AdminJobs />} />
            <Route path="/admin/events" element={<AdminEvents mode="list" />} />
            <Route path="/admin/events/new" element={<AdminEvents mode="create" />} />
            <Route path="/admin/speakers" element={<AdminSpeakers mode="list" />} />
            <Route path="/admin/speakers/new" element={<AdminSpeakers mode="create" />} />
            <Route path="/admin/social-posts" element={<AdminSocialPosts mode="list" />} />
            <Route path="/admin/social-posts/new" element={<AdminSocialPosts mode="create" />} />
            <Route path="/admin/social-posts/edit/:postIndex" element={<AdminSocialPosts mode="edit" />} />
            <Route path="/admin/form-routing" element={<AdminFormRouting />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/job-board" element={<Navigate to="/jobs" replace />} />
            <Route path="/previous-talks" element={<Navigate to="/events" replace />} />
            <Route path="/join" element={<BecomeMember />} />
            <Route path="/become-a-member" element={<Navigate to="/join" replace />} />
            <Route path="/get-involved" element={<Navigate to="/join#volunteer" replace />} />
            <Route path="/become-a-speaker" element={<BecomeSpeaker />} />
            <Route path="/become-a-sponsor" element={<BecomeSponsor />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
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
