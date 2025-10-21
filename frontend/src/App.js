import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./features/dashboard/Dashboard";
import Transactions from "./features/transactions/Transactions";
import AddTransaction from "./features/transactions/AddTranscations";

import Accounts from "./features/accounts/Accounts";
import AddEditAccount from "./features/accounts/AddEditAccount";
import Budget from "./features/budget/Budget";
import Reports from "./features/reports/Reports";

function App() {
  return (
    <Router>
      {/*<nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/transactions">Transactions</Link>
        <Link to="/accounts">Accounts</Link>
        <Link to="/budget">Budget</Link>
        <Link to="/reports">Reports</Link>
      </nav>*/}

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/*all transactions */}
        <Route path="/transactions" element={<Transactions />} />
        

        {/* transcation for specific account*/}
        <Route path="/transactions/:accountId" element={<Transactions />} />
         
          {/*  add transcation */}
        <Route path="/transactions/add" element={<AddTransaction />} />

        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/add" element={<AddEditAccount />} />
        <Route path="/accounts/edit/:id" element={<AddEditAccount />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Router>
  );
}

export default App;
