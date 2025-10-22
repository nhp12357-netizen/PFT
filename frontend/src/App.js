import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./features/dashboard/Dashboard";

import Transactions from "./features/transactions/Transcations";

import AddTransaction from "./features/transactions/AddTranscations";

import Accounts from "./features/accounts/Accounts";
import AddEditAccount from "./features/accounts/AddEditAccount";  
import EditAccount from "./features/accounts/EditAccount";       

import Budget from "./features/budget/Budget";
import Reports from "./features/reports/Reports";

function App() {
  return (
    <Router>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Transactions */}
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:accountId" element={<Transactions />} />
        <Route path="/transactions/add" element={<AddTransaction />} />

        {/* Accounts */}
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/add" element={<AddEditAccount />} /> {/* Add account */}
        <Route path="/accounts/edit/:id" element={<EditAccount />} /> {/* Edit account */}

        {/* Budget & Reports */}
        <Route path="/budget" element={<Budget />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Router>
  );
}

export default App;
