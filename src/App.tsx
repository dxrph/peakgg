import { BrowserRouter, Routes, Route } from "react-router-dom";

function ResetScreen() {
  return (
    <main className="reset-screen">
      <h1>PEAKGG — RESET COMPLETE</h1>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<ResetScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
