import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./features/dashboard/Dashboard";
import Transactions from "./features/transactions/Transactions";
import Accounts from "./features/accounts/Accounts";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/accounts" element={<Accounts />} />
      </Routes>
    </Router>
  );
}

export default App;
