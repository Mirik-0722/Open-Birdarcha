import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import CompanyPage from "./pages/CompanyPage";
import PersonPage from "./pages/PersonPage";

export default function App() {
  return (
    <BrowserRouter>
      <header className="topbar">
        <Link to="/">Aloqalar grafi</Link>
      </header>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/company/:id" element={<CompanyPage />} />
        <Route path="/person/:id" element={<PersonPage />} />
      </Routes>
    </BrowserRouter>
  );
}
