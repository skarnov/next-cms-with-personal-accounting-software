"use client";
import { useState, useEffect, useCallback } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiCheck, FiAlertTriangle } from "react-icons/fi";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import "react-datepicker/dist/react-datepicker.css";

const DatePicker = dynamic(() => import("react-datepicker").then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="w-full bg-gray-700 rounded-lg px-4 py-2 h-[42px] animate-pulse"></div>,
});

const DEFAULT_PAGE_SIZE = 50;
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

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [hasMounted, setHasMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [currency, setCurrency] = useState({ code: DEFAULT_CURRENCY, symbol: "£" });
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
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    document.title = "My Expenses";
  }, []);

  const { data: config } = useSWR("/api/config?name=paginate_rows&name=default_currency&name=currencies", fetcher);

  useEffect(() => {
    setHasMounted(true);
    setFormData((prev) => ({ ...prev, date: new Date() }));
  }, []);

  useEffect(() => {
    if (config) {
      const defaultCurrency = config.default_currency || DEFAULT_CURRENCY;
      const currencies = config.currencies || [];
      const currencyObj = currencies.find((c) => c.code === defaultCurrency) || {
        code: defaultCurrency,
        symbol: defaultCurrency,
      };
      setCurrency(currencyObj);
      if (!currentExpense) {
        setFormData((prev) => ({ ...prev, currency: defaultCurrency }));
      }
    }
  }, [config, currentExpense]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.data.length) return null;
    return `/api/expenses?page=${pageIndex + 1}${debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : ""}`;
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

  const allExpenses = data ? data.flatMap((page) => page.data) : [];
  const pageSize = config?.paginate_rows || DEFAULT_PAGE_SIZE;
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = size > 0 && data && typeof data[size - 1] === "undefined";
  const isEmpty = data?.[0]?.data?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data?.length < pageSize);

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

  const formatCurrency = (amount, currencyCode = currency.code) => {
    const currencies = config?.currencies || [];
    const currencyObj = currencies.find((c) => c.code === currencyCode) || {
      code: currencyCode,
      symbol: currencyCode,
    };

    if (!amount) return "-";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyObj.code,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch (e) {
      return `${currencyObj.symbol}${parseFloat(amount).toFixed(2)}`;
    }
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
    setCurrentExpense(null);
    setFormData({
      description: "",
      amount: "",
      walletId: wallets?.[0]?.id || null,
      currency: currency.code,
      date: new Date(),
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (expense) => {
    setCurrentExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      walletId: expense.wallet_id || null,
      currency: expense.currency || currency.code,
      date: new Date(expense.created_at),
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
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

      const url = currentExpense ? `/api/expenses/${currentExpense.id}` : "/api/expenses";
      const method = currentExpense ? "PUT" : "POST";

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
        throw new Error(errorData.error || "Failed to save expense");
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
    if (!expenseToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete expense");
      }

      mutate();
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(error.message || "Failed to delete expense");
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
        <h1 className="text-2xl font-bold">My Expenses</h1>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 px-4 py-2 rounded-lg transition shadow-md hover:shadow-lime-500/20" disabled={!session}>
          <FiPlus className="text-lg" /> Add New Expense
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" />
        </div>
        <input type="text" placeholder="Search expenses..." className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {isEmpty && !isLoadingInitialData ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700 flex-grow flex items-center justify-center">
          {debouncedSearchTerm ? (
            <p className="text-gray-300">No expenses match your search.</p>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <p className="mb-4 text-gray-300">You don't have any expenses yet.</p>
              <button onClick={openAddModal} className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 px-4 py-2 rounded-lg transition mx-auto shadow-md hover:shadow-lime-500/20" disabled={!session}>
                <FiPlus className="text-lg" /> Add your first expense
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
                {allExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{formatDate(expense.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{expense.description}</div>
                    </td>
                    <td className="px-6 py-4">{expense.wallet_name ? <div className="flex items-center text-gray-300">{expense.wallet_name}</div> : "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-medium ${expense.amount < 0 ? "text-rose-400" : "text-lime-400"}`}>{formatCurrency(expense.amount, expense.currency)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(expense)} className="p-2 border border-blue-400/30 hover:border-blue-400 rounded-md text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all duration-200" disabled={!session}>
                          <FiEdit2 />
                        </button>
                        <button onClick={() => handleDeleteClick(expense)} className="p-2 border border-rose-400/30 hover:border-rose-400 rounded-md text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all duration-200" disabled={!session}>
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

            {isReachingEnd && !isEmpty && <div className="text-center p-4 text-gray-400">You've reached the end of your expenses</div>}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700 shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{currentExpense ? "Edit Expense" : "Add New Expense"}</h2>
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
                          <span className="text-gray-400">{(config?.currencies || []).find((c) => c.code === formData.currency)?.symbol || formData.currency}</span>
                        </div>
                        <input type="number" name="amount" step="0.01" min="0.01" className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 text-white" value={formData.amount} onChange={handleInputChange} required disabled={isSubmitting} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Currency *</label>
                      <select name="currency" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 text-white" value={formData.currency} onChange={handleInputChange} disabled={isSubmitting}>
                        {(config?.currencies || []).map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code} ({curr.symbol})
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
                          {currentExpense ? "Updating..." : "Saving..."}
                        </>
                      ) : (
                        <>
                          <FiCheck />
                          {currentExpense ? "Update Expense" : "Save Expense"}
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
                Are you sure you want to delete <span className="font-semibold text-white">"{expenseToDelete?.description}"</span> expense of <span className="font-semibold text-white">{formatCurrency(expenseToDelete?.amount, expenseToDelete?.currency)}</span>?
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