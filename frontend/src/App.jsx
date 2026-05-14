import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/authStore';   // ← imported from separate file now
import LoginPage from './pages/LoginPage';
import TasksPage from './pages/TasksPage';

// If not logged in, redirect to /login
const Protected = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <Protected>
            <TasksPage />
          </Protected>
        } />
      </Routes>
    </BrowserRouter>
  );
}