"use client";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { FiHome, FiTrendingUp, FiCreditCard, FiLogOut, FiFolder, FiTrendingDown, FiFileText, FiTag, FiMessageSquare, FiActivity, FiSettings } from "react-icons/fi";
import { TbCashBanknote } from "react-icons/tb";
import Link from "next/link";
import useSWR from "swr";

const navItems = [
  { path: "/dashboard", icon: FiHome, label: "Dashboard" },
  { path: "/dashboard/wallets", icon: FiCreditCard, label: "Wallets" },
  { path: "/dashboard/incomes", icon: FiTrendingUp, label: "Incomes" },
  { path: "/dashboard/expenses", icon: FiTrendingDown, label: "Expenses" },
  { path: "/dashboard/cashbook", icon: TbCashBanknote, label: "Cashbook" },
  { path: "/dashboard/messages", icon: FiMessageSquare, label: "Messages" },
  { path: "/dashboard/tags", icon: FiTag, label: "Tags" },
  { path: "/dashboard/articles", icon: FiFileText, label: "Articles" },
  { path: "/dashboard/projects", icon: FiFolder, label: "Projects" },
  { path: "/dashboard/activities", icon: FiActivity, label: "Activities" },
  { path: "/dashboard/settings", icon: FiSettings, label: "Settings" },
];

const SidebarSkeleton = () => (
  <div className="w-64 bg-gray-800 p-5">
    <div className="h-8 bg-gray-700 rounded mb-4 animate-pulse"></div>
    <div className="space-y-2">
      {[...Array(navItems.length)].map((_, i) => (
        <div key={i} className="h-10 bg-gray-700 rounded animate-pulse"></div>
      ))}
    </div>
  </div>
);

const ContentSkeleton = () => (
  <div className="flex-1 p-6">
    <div className="h-8 w-64 bg-gray-700 rounded mb-6 animate-pulse"></div>
    <div className="grid grid-cols-1 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-700 rounded-lg animate-pulse"></div>
      ))}
    </div>
  </div>
);

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  const { data: countData, error: countError } = useSWR("/api/messages/count", (url) => fetch(url).then((res) => res.json()), { refreshInterval: 60000 });

  const unseenCount = countData?.count || 0;

  const isActive = (path) => pathname === path;

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") {
      setLoading(false);
    } else if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      setLoading(false);
    }
  }, [status, router]);

  const handleNavigation = (e, href) => {
    if (pathname !== href) {
      setNavigating(true);
    }
  };

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-900">
        <SidebarSkeleton />
        <ContentSkeleton />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <aside className="w-64 bg-gray-800 shadow-lg flex flex-col">
        <div className="p-5 text-center text-white text-xl font-bold tracking-wide border-b border-gray-700">Lime CMS</div>
        <nav className="flex-1 mt-4">
          <ul className="space-y-1 px-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path} onClick={(e) => handleNavigation(e, item.path)} className={`flex items-center p-3 rounded-lg text-white ${isActive(item.path) ? "bg-lime-600" : "hover:bg-gray-700"}`} aria-current={isActive(item.path) ? "page" : undefined}>
                  <item.icon className="mr-3 text-lg" />
                  {item.label === "Messages" && unseenCount > 0 ? (
                    <span className="flex items-center">
                      Messages
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">{unseenCount}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center justify-center p-3 mx-4 my-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          <FiLogOut className="mr-2" />
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold mt-4 mb-4 text-white">
          Welcome, <span className="capitalize">{session?.user?.name || "Admin"}</span>
        </h2>

        {navigating ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
          </div>
        ) : (
          <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>
        )}
      </main>
    </div>
  );
}