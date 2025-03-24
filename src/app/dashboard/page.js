"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiHome, FiTrendingUp, FiDollarSign, FiLogOut } from "react-icons/fi";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

const cashbookData = [{ value: 3000 }, { value: 100 }, { value: 5000 }];
const incomeData = [{ value: 8000 }, { value: 10000 }, { value: 12000 }];
const expenseData = [{ value: 4000 }, { value: 6000 }, { value: 7000 }];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      setLoading(false);
    }
  }, [status, router]);

  if (loading) {
    return <p className="text-center text-gray-700 mt-10">Loading...</p>;
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 shadow-lg flex flex-col">
        <div className="p-5 text-center text-white text-xl font-bold tracking-wide border-b border-gray-700">Lime CMS</div>
        <nav className="flex-1 mt-4">
          <ul className="space-y-2 px-4">
            <li>
              <a href="/dashboard" className="flex items-center p-3 rounded-lg text-white bg-lime-600">
                <FiHome className="mr-3 text-lg" />
                Dashboard
              </a>
            </li>
            <li>
              <a href="/incomes" className="flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white">
                <FiTrendingUp className="mr-3 text-lg" />
                Incomes
              </a>
            </li>
            <li>
              <a href="/expenses" className="flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white">
                <FiDollarSign className="mr-3 text-lg" />
                Expenses
              </a>
            </li>
          </ul>
        </nav>
        <button onClick={() => signOut()} className="flex items-center justify-center p-3 mx-4 my-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          <FiLogOut className="mr-2" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold mt-4 text-white">Welcome, {session?.user?.name || "Admin"}</h2>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          {/* Cashbook Card */}
          <div className="bg-lime-600 p-4 rounded-xl shadow-md text-white">
            <h4 className="text-lg font-semibold">Cashbook</h4>
            <p className="text-white mt-2 font-bold">£5000</p>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashbookData}>
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="white" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income Card */}
          <div className="bg-blue-600 p-4 rounded-xl shadow-md text-white">
            <h4 className="text-lg font-semibold">Income</h4>
            <p className="text-white mt-2 font-bold">£12000</p>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeData}>
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="white" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Card */}
          <div className="bg-red-600 p-4 rounded-xl shadow-md text-white">
            <h4 className="text-lg font-semibold">Expense</h4>
            <p className="text-white mt-2 font-bold">£7000</p>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={expenseData}>
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="white" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}