import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import LoginForm from "./components/Auth/LoginForm";
import StudentDashboard from "./components/Dashboard/StudentDashboard";
import GameHost from "./components/Games/GameHost";
import StoryViewer from "./components/Stories/StoryViewer";
import { useAuth } from "./hooks/useAuth";
import "@fontsource/inter";

function App() {
  const { user, loading } = useAuth();
  const [showHighContrast, setShowHighContrast] = useState(false);

  useEffect(() => {
    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    setShowHighContrast(prefersHighContrast);
    
    // Apply high contrast class if needed
    if (prefersHighContrast) {
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando HablaConmigo...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginForm />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${showHighContrast ? 'high-contrast' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/story/:storyId" element={<StoryViewer />} />
          <Route path="/game/:gameId" element={<GameHost />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}

export default App;
