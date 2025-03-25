import Link from 'next/link';

export default function Sidebar({ isOpen, currentPath }) {
  if (!isOpen) return null;

  const isActive = (path) => currentPath.startsWith(path);

  return (
    <div className="col-md-3 col-lg-2 d-md-block bg-dark sidebar">
      <div className="position-sticky pt-3">
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link 
              className={`nav-link text-white ${isActive('/dashboard') ? 'active bg-primary' : ''}`}
              href="/dashboard"
            >
              Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className={`nav-link text-white ${isActive('/dashboard/incomes') ? 'active bg-primary' : ''}`}
              href="/dashboard/incomes"
            >
              Incomes
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className={`nav-link text-white ${isActive('/dashboard/expenses') ? 'active bg-primary' : ''}`}
              href="/dashboard/expenses"
            >
              Expenses
            </Link>
          </li>
          {/* Add other menu items */}
        </ul>
      </div>
    </div>
  );
}