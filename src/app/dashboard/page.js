"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiData = await response.json();
        setData(apiData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load financial data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-100 rounded-full mb-4"></div>
          <p className="text-gray-500">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm max-w-md">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const incomes = (data.walletIncomes || []).map((w) => ({
    name: w.wallet_name || "Other Income",
    value: w.total_income || 0,
  }));

  const expenses = (data.walletExpenses || []).map((w) => ({
    name: w.wallet_name || "Other Expenses",
    value: w.total_expense || 0,
  }));

  const totalIncome = incomes.reduce((sum, item) => sum + item.value, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.value, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">💰 Financial Dashboard</h1>
        <p className="text-gray-500">Updated in real-time</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <FinanceCard title="Balance" value={balance} icon="💰" isPositive={balance >= 0} changeText={balance >= 0 ? "Positive cash flow" : "Negative cash flow"} />
        <FinanceCard title="Incomes" value={totalIncome} icon="↑" isPositive={true} changeText={`From ${incomes.length} source${incomes.length !== 1 ? "s" : ""}`} />
        <FinanceCard title="Expenses" value={totalExpense} icon="↓" isPositive={false} changeText={`Across ${expenses.length} categor${expenses.length !== 1 ? "ies" : "y"}`} />
      </div>

      <div className="space-y-8">
        <MoneyFlowChart
          title="Income Sources"
          data={incomes}
          color="#10B981"
          emptyMessage="No income data available"
        />
        <MoneyFlowChart
          title="Expense Breakdown"
          data={expenses}
          color="#EF4444"
          emptyMessage="No expense data available"
        />
      </div>
      <div className="mt-8 text-sm text-gray-400 text-center">Last updated: {new Date().toLocaleString()}</div>
    </div>
  );
}

function FinanceCard({ title, value, icon, isPositive, changeText }) {
  const valueColor = isPositive ? "text-green-600" : "text-red-600";
  const bgColor = isPositive ? "bg-green-50" : "bg-red-50";

  return (
    <div className={`p-6 rounded-xl shadow-sm ${bgColor} border border-gray-100 transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${valueColor}`}>£{Math.abs(value).toFixed(2)}</p>
        </div>
        <span className="text-2xl p-2 rounded-lg bg-white shadow-xs">{icon}</span>
      </div>
      <p className="text-xs mt-2 text-gray-500">{changeText}</p>
    </div>
  );
}

function MoneyFlowChart({ title, data, color, emptyMessage }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        <div className="h-48 flex items-center justify-center text-gray-400">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="h-72 w-full">
        {isMounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 30, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" tickFormatter={(value) => `£${value}`} tick={{ fill: "#6B7280" }} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fill: "#6B7280" }} />
              <Tooltip
                formatter={(value) => [`£${Number(value).toFixed(2)}`, "Amount"]}
                labelFormatter={(name) => `Source: ${name}`}
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.96)",
                  border: "1px solid #E5E7EB",
                  borderRadius: "0.5rem",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}