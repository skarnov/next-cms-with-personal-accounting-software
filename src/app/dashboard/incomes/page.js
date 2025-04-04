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

export default function IncomesPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIncome, setCurrentIncome] = useState(null);
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
  const [incomeToDelete, setIncomeToDelete] = useState(null);
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
    return `/api/incomes?page=${pageIndex + 1}${debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : ""}`;
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

  const allIncomes = data ? data.flatMap((page) => page) : [];
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

  const formatCurrency = (amount, currencyCode = DEFAULT_CURRENCY) => {
    const currencyObj = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
    return `${currencyObj.symbol}${parseFloat(amount).toFixed(2)}`;
  };

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
    setCurrentIncome(null);
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

  const openEditModal = (income) => {
    setCurrentIncome(income);
    setFormData({
      description: income.description,
      amount: income.amount.toString(),
      walletId: income.wallet_id || null,
      currency: income.currency || DEFAULT_CURRENCY,
      date: new Date(income.created_at),
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (income) => {
    setIncomeToDelete(income);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description.trim() || !formData.amount || isNaN(formData.amount)) {
      setErrorMessage("Please fill all required fields correctly");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const dateToSend = formData.date instanceof Date ? formData.date : new Date(formData.date);

      const requestBody = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        walletId: formData.walletId || null,
        date: dateToSend.toISOString(),
      };

      const url = currentIncome ? `/api/incomes/${currentIncome.id}` : "/api/incomes";
      const method = currentIncome ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save income");
      }

      mutate();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(error.message || "An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!incomeToDelete?.id) {
      setErrorMessage("Invalid income ID");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/incomes/${incomeToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete income");
      }

      mutate();
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(error.message || "Failed to delete income");
    } finally {
      setIsDeleting(false);
    }
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
        <h1 className="text-2xl font-bold">My Incomes</h1>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 px-4 py-2 rounded-lg transition shadow-md hover:shadow-lime-500/20" disabled={!session}>
          <FiPlus className="text-lg" /> Add New Income
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" />
        </div>
        <input type="text" placeholder="Search incomes..." className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {isEmpty && !isLoadingInitialData ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700 flex-grow flex items-center justify-center">
          {debouncedSearchTerm ? (
            <p className="text-gray-300">No incomes match your search.</p>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <p className="mb-4 text-gray-300">You don't have any incomes yet.</p>
              <button onClick={openAddModal} className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 px-4 py-2 rounded-lg transition mx-auto shadow-md hover:shadow-lime-500/20" disabled={!session}>
                <FiPlus className="text-lg" /> Add your first income
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
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-left">Wallet</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {allIncomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{formatDate(income.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{income.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      {income.wallet_name ? (
                        <div className="flex items-center text-gray-300">
                          {FiWallet && <FiWallet className="mr-2" />}
                          {income.wallet_name}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-medium ${income.amount < 0 ? "text-rose-400" : "text-lime-400"}`}>{formatCurrency(income.amount, income.currency)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(income)} className="p-2 border border-blue-400/30 hover:border-blue-400 rounded-md text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all duration-200" disabled={!session}>
                          <FiEdit2 />
                        </button>
                        <button onClick={() => handleDeleteClick(income)} className="p-2 border border-rose-400/30 hover:border-rose-400 rounded-md text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all duration-200" disabled={!session}>
                          <FiTrash2 />
                        </button>
                      </div>
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

            {isReachingEnd && !isEmpty && <div className="text-center p-4 text-gray-400">You've reached the end of your incomes</div>}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700 shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{currentIncome ? "Edit Income" : "Add New Income"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition" disabled={isSubmitting}>
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                    <input type="text" name="description" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 text-white" value={formData.description} onChange={handleInputChange} required disabled={isSubmitting} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Amount *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400">{CURRENCIES.find((c) => c.code === formData.currency)?.symbol}</span>
                        </div>
                        <input type="number" name="amount" step="0.01" min="0.01" className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 text-white" value={formData.amount} onChange={handleInputChange} required disabled={isSubmitting} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Currency *</label>
                      <select name="currency" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 text-white" value={formData.currency} onChange={handleInputChange} disabled={isSubmitting}>
                        {CURRENCIES.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.name} ({curr.symbol})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Wallet</label>
                      <select name="walletId" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 text-white" value={formData.walletId ?? ""} onChange={(e) => setFormData({ ...formData, walletId: e.target.value ? parseInt(e.target.value) : null })} disabled={isSubmitting || !wallets}>
                        <option value="">No wallet</option>
                        {wallets?.map((wallet) => (
                          <option key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                      {formData.date && <DatePicker selected={formData.date} onChange={(date) => setFormData({ ...formData, date })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 text-white" dateFormat="MMMM d, yyyy" disabled={isSubmitting} />}
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-4 mb-4 text-red-400 bg-red-900/30 rounded-lg border border-red-800">
                      <div className="flex items-center gap-2">
                        <FiAlertTriangle />
                        <span>{errorMessage}</span>
                      </div>
                      {error?.info?.details && <div className="mt-2 text-sm text-red-300">{error.info.details}</div>}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition flex items-center gap-2" disabled={isSubmitting}>
                      <FiX /> Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 transition flex items-center gap-2 disabled:opacity-70" disabled={isSubmitting || !formData.description.trim() || !formData.amount}>
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {currentIncome ? "Updating..." : "Saving..."}
                        </>
                      ) : (
                        <>
                          <FiCheck />
                          {currentIncome ? "Update Income" : "Save Income"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md border border-rose-500/30 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FiAlertTriangle className="text-rose-500 text-2xl" />
                <h2 className="text-xl font-bold">Confirm Deletion</h2>
              </div>

              <p className="mb-6 text-gray-300">
                Are you sure you want to delete <span className="font-semibold text-white">"{incomeToDelete?.description}"</span> income of <span className="font-semibold text-white">{formatCurrency(incomeToDelete?.amount, incomeToDelete?.currency)}</span>?
              </p>

              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition flex items-center gap-2" disabled={isDeleting}>
                  <FiX /> Cancel
                </button>
                <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 transition flex items-center gap-2 disabled:opacity-70" disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiCheck /> Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}