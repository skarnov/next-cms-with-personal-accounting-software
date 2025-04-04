"use client";
import { useState, useEffect, useCallback } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import useSWRInfinite from "swr/infinite";
import { useSession } from "next-auth/react";

const PAGE_SIZE = 50;

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Failed to fetch data");
    error.info = await res.json();
    throw error;
  }
  return res.json();
};

export default function CashbookPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // SWR infinite loading setup
  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.data.length) return null;
    return `/api/cashbook?page=${pageIndex + 1}&pageSize=${PAGE_SIZE}${
      debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : ""
    }`;
  };

  const { data, error, size, setSize, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
  });

  // Data processing
  const allCashbook = data ? data.flatMap((page) => page.data) : [];
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = size > 0 && data && typeof data[size - 1] === "undefined";
  const isEmpty = data?.[0]?.data?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data?.length < PAGE_SIZE);

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (isLoadingMore || isReachingEnd) return;
    setSize(size + 1);
  }, [isLoadingMore, isReachingEnd, setSize, size]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading data: {error.message}
        {error.info?.error && ` - ${error.info.error}`}
      </div>
    );
  }

  return (
    <div className="text-white p-4 w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cashbook</h1>
        <div className="relative w-64">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search entries..."
            className="bg-gray-700 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-lime-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isEmpty && !isLoadingInitialData ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700 flex-grow flex items-center justify-center">
          {debouncedSearchTerm ? (
            <p className="text-gray-300">No entries match your search.</p>
          ) : (
            <p className="text-gray-300">No cashbook entries found.</p>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700 flex-grow flex flex-col">
          <div className="overflow-auto flex-grow">
            <table className="w-full">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-right">Income</th>
                  <th className="px-6 py-3 text-right">Expense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {allCashbook.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {entry.income_description || entry.expense_description || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-lime-400">
                      {formatCurrency(entry.in_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-rose-400">
                      {formatCurrency(entry.out_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isLoadingMore && (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lime-500"></div>
              </div>
            )}

            {isReachingEnd && !isEmpty && (
              <div className="text-center p-4 text-gray-400">No more entries to load</div>
            )}
          </div>

          <div className="p-4 border-t border-gray-700 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Showing {allCashbook.length} entries
            </div>
            {!isReachingEnd && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}