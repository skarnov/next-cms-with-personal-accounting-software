"use client";
import { signOut } from 'next-auth/react';

export default function Navbar({ onToggleSidebar }) {
  return (
    <nav className="navbar fixed-top navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <button 
          className="navbar-brand text-light btn btn-link" 
          onClick={onToggleSidebar}
        >
          Admin Dashboard
        </button>
        <div className="d-flex">
          <button className="btn btn-outline-light" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}