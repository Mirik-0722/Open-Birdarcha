import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import SearchPage from "./pages/SearchPage";
import CompanyPage from "./pages/CompanyPage";
import PersonPage from "./pages/PersonPage";
import PathPage from "./pages/PathPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ochiq sahifa */}
          <Route path="/login" element={<LoginPage />} />

          {/* Qolgan hammasi auth talab qiladi */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Header />
                <Routes>
                  <Route path="/" element={<SearchPage />} />
                  <Route path="/path" element={<PathPage />} />
                  <Route path="/company/:id" element={<CompanyPage />} />
                  <Route path="/person/:id" element={<PersonPage />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
