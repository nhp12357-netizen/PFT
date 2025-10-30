import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./features/login/Login";
import Register from "./features/login/Register";

import Dashboard from "./features/dashboard/Dashboard";

import Transactions from "./features/transactions/Transcations";
import AddTransaction from "./features/transactions/AddTranscations";
import Categories from "./features/transactions/Categories";
import EditTransaction from "./features/transactions/EditTransaction";


import Accounts from "./features/accounts/Accounts";
import AddEditAccount from "./features/accounts/AddEditAccount";  
import EditAccount from "./features/accounts/EditAccountName"; 
import DeleteAccount from "./features/accounts/DeleteAccount"; 
 

import Budget from "./features/budget/BudgetPage";
import SetBudget from "./features/budget/SetBudgetPage";
import Reports from "./features/reports/Reports";

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Transactions */}
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:accountId" element={<Transactions />} />
        <Route path="/transactions/add" element={<AddTransaction />} />
        <Route path="/transactions/edit/:id" element={<EditTransaction />} />
        <Route path="/categories" element={<Categories />} />

        {/* Accounts */}
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/add" element={<AddEditAccount />} /> 
        <Route path="/accounts/edit/:id" element={<EditAccount />} /> 
       <Route path="/accounts/delete/:id" element={<DeleteAccount />} />

        {/* Budget & Reports */}
        <Route path="/budget" element={<Budget />} />
        <Route path="/budget/set" element={<SetBudget />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Router>
  );
}

export default App;
