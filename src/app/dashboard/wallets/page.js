"use client";
import { useState } from "react";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX } from "react-icons/fi";
import useSWR from "swr";

export default function WalletsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [walletName, setWalletName] = useState("");

  // Fetch wallets data
  const { data: wallets, error, mutate } = useSWR('/api/wallets', fetcher);

  const filteredWallets = wallets?.filter(wallet => 
    wallet.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const openAddModal = () => {
    setCurrentWallet(null);
    setWalletName("");
    setIsModalOpen(true);
  };

  const openEditModal = (wallet) => {
    setCurrentWallet(wallet);
    setWalletName(wallet.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = currentWallet ? `/api/wallets/${currentWallet._id}` : '/api/wallets';
      const method = currentWallet ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: walletName }),
      });

      if (response.ok) {
        mutate();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving wallet:", error);
    }
  };

  const handleDeleteWallet = async (id) => {
    if (confirm("Are you sure you want to delete this wallet?")) {
      try {
        const response = await fetch(`/api/wallets/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          mutate();
        }
      } catch (error) {
        console.error("Error deleting wallet:", error);
      }
    }
  };

  if (error) return <div>Failed to load wallets</div>;
  if (!wallets) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div></div>;

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Wallets</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 px-4 py-2 rounded-lg transition"
        >
          <FiPlus /> Add New Wallet
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search wallets..."
          className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredWallets.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          {searchTerm ? (
            <p>No wallets match your search.</p>
          ) : (
            <>
              <p className="mb-4">You don't have any wallets yet.</p>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 px-4 py-2 rounded-lg transition mx-auto"
              >
                <FiPlus /> Create your first wallet
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredWallets.map((wallet) => (
                <tr key={wallet._id} className="hover:bg-gray-750">
                  <td className="px-6 py-4">{wallet.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(wallet)}
                        className="text-gray-400 hover:text-lime-500 transition p-1"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteWallet(wallet._id)}
                        className="text-gray-400 hover:text-red-500 transition p-1"
                      >
                        <FiTrash2 />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {currentWallet ? "Edit Wallet" : "Add New Wallet"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="walletName" className="block mb-2 text-sm font-medium">
                  Wallet Name
                </label>
                <input
                  type="text"
                  id="walletName"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 transition"
                >
                  {currentWallet ? "Update Wallet" : "Save Wallet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Fetcher function for SWR
const fetcher = (url) => fetch(url).then((res) => res.json());