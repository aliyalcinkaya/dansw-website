import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import {
  Home,
  PreviousTalks,
  BecomeMember,
  BecomeSpeaker,
  BecomeSponsor,
  About,
  CodeOfConduct,
} from './pages';

function App() {
  return (
    <Router>
      <Layout>
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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
