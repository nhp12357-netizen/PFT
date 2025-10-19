import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./features/dashboard/Dashboard";
import Transactions from "./features/transactions/Transactions";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
    </Router>
  );
}

export default App;
