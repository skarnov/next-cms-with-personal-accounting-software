"use client";
import { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiCheck, FiAlertTriangle } from "react-icons/fi";
import useSWR from "swr";
import { useSession } from "next-auth/react";

const fetcher = async (url) => {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = new Error("Failed to fetch wallets");
    error.status = res.status;
    try {
      error.info = await res.json();
    } catch (e) {
      error.info = { error: "Network error" };
    }
    throw error;
  }
  return res.json();
};

export default function WalletsPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [walletName, setWalletName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: wallets, error, mutate } = useSWR(session ? "/api/wallets" : null, fetcher);
  const filteredWallets = wallets?.filter((wallet) => wallet.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  useEffect(() => {
    document.title = "My Wallets";
  }, []);

  const openAddModal = () => {
    setCurrentWallet(null);
    setWalletName("");
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (wallet) => {
    setCurrentWallet(wallet);
    setWalletName(wallet.name);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (wallet) => {
    setWalletToDelete(wallet);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!walletName.trim()) {
      setErrorMessage("Wallet name cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const url = currentWallet ? `/api/wallets/${currentWallet.id}` : "/api/wallets";
      const method = currentWallet ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: walletName.trim(),
          userId: session?.user?.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || currentWallet ? "Failed to update wallet" : "Failed to create wallet");
      }

      mutate();
      setIsModalOpen(false);
      setWalletName("");
    } catch (error) {
      console.error("Error saving wallet:", error);
      setErrorMessage(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!walletToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/wallets/${walletToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete wallet");
      }

      mutate();
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting wallet:", error);
      alert(error.message || "Failed to delete wallet");
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading wallets: {error.info?.error || error.message}
        {error.status === 401 && (
          <button onClick={() => signIn()} className="ml-2 text-blue-400 hover:text-blue-600">
            Please login
          </button>
        )}
      </div>
    );
  }

  if (!wallets) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  return (
    <div className="text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Wallets</h1>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 px-4 py-2 rounded-lg transition shadow-md hover:shadow-lime-500/20" disabled={!session}>
          <FiPlus className="text-lg" /> Add New Wallet
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" />
        </div>
        <input type="text" placeholder="Search wallets..." className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {filteredWallets.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
          {searchTerm ? (
            <p className="text-gray-300">No wallets match your search.</p>
          ) : (
            <>
              <p className="mb-4 text-gray-300">You don't have any wallets yet.</p>
              <button onClick={openAddModal} className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 px-4 py-2 rounded-lg transition mx-auto shadow-md hover:shadow-lime-500/20" disabled={!session}>
                <FiPlus className="text-lg" /> Create your first wallet
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Name</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredWallets.map((wallet) => (
                <tr key={wallet.id} className="table-row-hover relative group">
                  <td className="px-6 py-4 font-medium">
                    <div className="flex items-center">
                      <span className="group-hover:text-lime-400 transition-colors">{wallet.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(wallet)} className="p-2 border border-blue-400/30 hover:border-blue-400 rounded-md text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all duration-200" title="Edit wallet" disabled={!session}>
                        <FiEdit2 className="text-lg" />
                      </button>
                      <button onClick={() => handleDeleteClick(wallet)} className="p-2 border border-rose-400/30 hover:border-rose-400 rounded-md text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all duration-200" title="Delete wallet" disabled={!session}>
                        <FiTrash2 className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Wallet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-600 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{currentWallet ? "Edit Wallet" : "Add New Wallet"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 transition" disabled={isSubmitting}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="walletName" className="block mb-2 text-sm font-medium text-gray-300">
                  Wallet Name
                </label>
                <input
                  type="text"
                  id="walletName"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-white"
                  value={walletName}
                  onChange={(e) => {
                    setWalletName(e.target.value);
                    setErrorMessage(null);
                  }}
                  required
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              {errorMessage && <div className="mb-4 text-red-500 text-sm">{errorMessage}</div>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition flex items-center gap-2" disabled={isSubmitting}>
                  <FiX /> Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 transition flex items-center gap-2 disabled:opacity-70" disabled={isSubmitting || !walletName.trim()}>
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {currentWallet ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      {currentWallet ? "Update Wallet" : "Save Wallet"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-rose-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <FiAlertTriangle className="text-rose-500 text-2xl flex-shrink-0" />
              <h2 className="text-xl font-bold">Confirm Deletion</h2>
            </div>

            <p className="mb-6 text-gray-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{walletToDelete?.name}"</span>? This action cannot be undone.
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
      )}
    </div>
  );
}