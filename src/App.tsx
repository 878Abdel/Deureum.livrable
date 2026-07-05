import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage   from "./pages/LandingPage";
import Dashboard     from "./pages/Dashboard";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/reset"     element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}