"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  // If already authenticated, prevent the login page from rendering
  if (status === "authenticated") {
    return null; // Do not render the login page if the user is already authenticated
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Admin Login</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" className="mt-1 w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring focus:ring-lime-500 focus:border-lime-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" className="mt-1 w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring focus:ring-lime-500 focus:border-lime-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="w-full bg-lime-600 hover:bg-lime-700 text-white py-2 rounded-lg font-semibold">
            Login
          </button>
        </form>
        <p className="mt-3 mb-3 text-muted text-center text-xs text-gray-500">&copy; Lime CMS 2018 - {new Date().getFullYear()} | All Rights Reserved</p>
      </div>
    </div>
  );
}