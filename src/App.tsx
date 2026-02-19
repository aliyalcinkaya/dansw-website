import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { trackPageView } from './services/analytics';
import {
  About,
  AdminEvents,
  AdminFormRouting,
  AdminJobs,
  AdminLogin,
  AdminPanel,
  AdminSocialPosts,
  AdminSpeakers,
  AdminUsers,
  BecomeMember,
  BecomeSpeaker,
  BecomeSponsor,
  CodeOfConduct,
  Contact,
  Events,
  Home,
  JobDetail,
  JobPostPlans,
  Jobs,
  JobSubmit,
  NotFound,
  PrivacyPolicy,
  TalkDetails,
} from './pages';

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
      </Layout>
    </Router>
  );
}

export default App;
