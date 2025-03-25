"use client";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

export default function DashboardPage() {
  const chartData = {
    cashbook: [{ value: 3000 }, { value: 100 }, { value: 5000 }],
    income: [{ value: 8000 }, { value: 10000 }, { value: 12000 }],
    expense: [{ value: 4000 }, { value: 6000 }, { value: 7000 }]
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
      <DashboardCard 
        title="Cashbook" 
        value="£5000" 
        data={chartData.cashbook} 
        color="bg-lime-600"
      />
      <DashboardCard 
        title="Income" 
        value="£12000" 
        data={chartData.income} 
        color="bg-blue-600"
      />
      <DashboardCard 
        title="Expense" 
        value="£7000" 
        data={chartData.expense} 
        color="bg-red-600"
      />
    </div>
  );
}

function DashboardCard({ title, value, data, color }) {
  return (
    <div className={`p-4 rounded-xl shadow-md text-white ${color}`}>
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="text-white mt-2 font-bold">{value}</p>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="white" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}