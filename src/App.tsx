import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
// import ProtectedRoute from './components/ProtectedRoute';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/EditTask';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/employee" element={
            // <ProtectedRoute allowedRole="employee">
              <EmployeeDashboard />
            // </ProtectedRoute>
          } />
          
          <Route path="/employee/create-task" element={
            // <ProtectedRoute allowedRole="employee">
              <CreateTask />
            // </ProtectedRoute>
          } />
          
          <Route path="/employee/edit-task/:taskId" element={
            // <ProtectedRoute allowedRole="employee">
              <EditTask />
            // </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            // <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            // </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;