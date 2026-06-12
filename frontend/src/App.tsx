import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import SearchPage from "./pages/SearchPage";
import CompanyPage from "./pages/CompanyPage";
import PersonPage from "./pages/PersonPage";
import PathPage from "./pages/PathPage";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/path" element={<PathPage />} />
        <Route path="/company/:id" element={<CompanyPage />} />
        <Route path="/person/:id" element={<PersonPage />} />
      </Routes>
    </BrowserRouter>
  );
}
