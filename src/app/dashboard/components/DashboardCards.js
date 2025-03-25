import Link from 'next/link';

export default function DashboardCards() {
  const stats = {
    cashbook: 5000,
    income: 12000,
    expense: 7000,
    blogs: 15
  };

  return (
    <div className="row mt-3">
      <div className="col-md-4 mb-3">
        <div className="card">
          <div className="card-header bg-dark text-light">
            <Link href="/dashboard/cashbook" className="text-light text-decoration-none">
              Cashbook
            </Link>
          </div>
          <div className="card-body">
            <h1 className="card-title">£{stats.cashbook}</h1>
          </div>
        </div>
      </div>

      <div className="col-md-4 mb-3">
        <div className="card">
          <div className="card-header bg-success text-light">
            <Link href="/dashboard/incomes" className="text-light text-decoration-none">
              Income
            </Link>
          </div>
          <div className="card-body">
            <h1 className="card-title">£{stats.income}</h1>
          </div>
        </div>
      </div>

      <div className="col-md-4 mb-3">
        <div className="card">
          <div className="card-header bg-primary text-light">
            <Link href="/dashboard/expenses" className="text-light text-decoration-none">
              Expense
            </Link>
          </div>
          <div className="card-body">
            <h1 className="card-title">£{stats.expense}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}