import { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import SearchPage from "./pages/SearchPage";
import CompanyPage from "./pages/CompanyPage";
import PersonPage from "./pages/PersonPage";
import PathPage from "./pages/PathPage";

/** Header + sahifa. Header hamma sahifada bir xil. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ochiq sahifalar (login shart emas — SEO uchun bosh sahifa indekslanadi) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Shell><SearchPage /></Shell>} />

          {/* Auth talab qiladigan sahifalar */}
          <Route
            path="/path"
            element={<ProtectedRoute><Shell><PathPage /></Shell></ProtectedRoute>}
          />
          <Route
            path="/company/:id"
            element={<ProtectedRoute><Shell><CompanyPage /></Shell></ProtectedRoute>}
          />
          <Route
            path="/person/:id"
            element={<ProtectedRoute><Shell><PersonPage /></Shell></ProtectedRoute>}
          />

          {/* Noma'lum yo'l — bosh sahifaga */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
