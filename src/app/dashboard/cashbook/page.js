"use client";
import { useState, useEffect, useCallback } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiCheck, FiAlertTriangle, FiWallet } from "react-icons/fi";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import "react-datepicker/dist/react-datepicker.css";

const DatePicker = dynamic(() => import("react-datepicker").then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="w-full bg-gray-700 rounded-lg px-4 py-2 h-[42px] animate-pulse"></div>,
});

const PAGE_SIZE = 50;

const CURRENCIES = [
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
];

const DEFAULT_CURRENCY = "GBP";

const fetcher = async (url) => {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const error = new Error("Failed to fetch data");
    error.info = await res.json().catch(() => ({}));
    throw error;
  }
  return res.json();
};

export default function CashbookPage() {
  const { data: session } = useSession();
  const [hasMounted, setHasMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCashbook, setCurrentCashbook] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    walletId: null,
    currency: DEFAULT_CURRENCY,
    date: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cashbookToDelete, setCashbookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setFormData((prev) => ({ ...prev, date: new Date() }));
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.data.length) return null;
    return `/api/cashbook?page=${pageIndex + 1}${debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : ""}`;
  };

  const { data, error, size, setSize, mutate } = useSWRInfinite(
    getKey,
    async (url) => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      if (!res.ok) {
        const error = new Error("Failed to fetch data");
        error.info = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      revalidateFirstPage: false,
    }
  );

  const allCashbook = data ? data.flatMap((page) => page.data) : [];
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = size > 0 && data && typeof data[size - 1] === "undefined";
  const isEmpty = data?.[0]?.data?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data?.length < PAGE_SIZE);

  const { data: wallets, error: walletsError } = useSWR(session ? "/api/wallets" : null, fetcher);

  useEffect(() => {
    if (wallets && wallets.length > 0) {
      setFormData((prev) => ({
        ...prev,
        walletId: prev.walletId || wallets[0].id,
      }));
    }
  }, [wallets]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || isReachingEnd) return;
    setSize(size + 1);
  }, [isLoadingMore, isReachingEnd, setSize, size]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setCurrentCashbook(null);
    setFormData({
      description: "",
      amount: "",
      walletId: null,
      currency: DEFAULT_CURRENCY,
      date: new Date(),
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };









  if (!hasMounted) {
    return <div className="text-white p-4">Loading...</div>;
  }

  if (error || walletsError) {
    return <div className="text-red-500 p-4">Error loading data: {error?.message || walletsError?.message}</div>;
  }

  return (
    <div className="text-white p-4 w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Cashbook</h1>

      </div>



      {isEmpty && !isLoadingInitialData ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700 flex-grow flex items-center justify-center">
          {debouncedSearchTerm ? (
            <p className="text-gray-300">No cashbooks match your search.</p>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <p className="mb-4 text-gray-300">You don't have any cashbooks yet.</p>
              <button onClick={openAddModal} className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 px-4 py-2 rounded-lg transition mx-auto shadow-md hover:shadow-lime-500/20" disabled={!session}>
                <FiPlus className="text-lg" /> Add your first cashbook
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700 flex-grow flex flex-col">
          <div className="overflow-auto flex-grow">
            <table className="w-full">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">In</th>
                  <th className="px-6 py-3 text-left">Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {allCashbook.map((cashbook) => (
                  <tr key={cashbook.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{formatDate(cashbook.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{cashbook.description}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-medium ${cashbook.in_amount < 0 ? "text-rose-400" : "text-lime-400"}`}>{cashbook.in_amount}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-medium ${cashbook.out_amount < 0 ? "text-rose-400" : "text-lime-400"}`}>{cashbook.out_amount}</div>
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

            {isReachingEnd && !isEmpty && <div className="text-center p-4 text-gray-400">You've reached the end of your cashbooks</div>}
          </div>
        </div>
      )}




    </div>
  );
}