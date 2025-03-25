"use client";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiHome, FiTrendingUp, FiLogOut, FiFolder, FiTrendingDown } from "react-icons/fi";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") {
      setLoading(false);
    } else if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      setLoading(false);
    }
  }, [status, router]);

  // Exact match for active state
  const isActive = (path) => pathname === path;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 shadow-lg flex flex-col">
        <div className="p-5 text-center text-white text-xl font-bold tracking-wide border-b border-gray-700">Lime CMS</div>
        <nav className="flex-1 mt-4">
          <ul className="space-y-2 px-4">
            <li>
              <Link href="/dashboard" className={`flex items-center p-3 rounded-lg text-white ${isActive("/dashboard") ? "bg-lime-600" : "hover:bg-gray-700"}`}>
                <FiHome className="mr-3 text-lg" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard/incomes" className={`flex items-center p-3 rounded-lg text-white ${isActive("/dashboard/incomes") ? "bg-lime-600" : "hover:bg-gray-700"}`}>
                <FiTrendingUp className="mr-3 text-lg" />
                Incomes
              </Link>
            </li>
            <li>
              <Link href="/dashboard/expenses" className={`flex items-center p-3 rounded-lg text-white ${isActive("/dashboard/expenses") ? "bg-lime-600" : "hover:bg-gray-700"}`}>
                <FiTrendingDown className="mr-3 text-lg" />
                Expenses
              </Link>
            </li>
            <li>
              <Link href="/dashboard/cashbook" className={`flex items-center p-3 rounded-lg text-white ${isActive("/dashboard/cashbook") ? "bg-lime-600" : "hover:bg-gray-700"}`}>
                <FiFolder className="mr-3 text-lg" />
                Cashbook
              </Link>
            </li>
          </ul>
        </nav>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center justify-center p-3 mx-4 my-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          <FiLogOut className="mr-2" />
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold mt-4 text-white">
          Welcome, <span className="capitalize">{session?.user?.name || "Admin"}</span>
        </h2>
        {children}
      </main>
    </div>
  );
}
