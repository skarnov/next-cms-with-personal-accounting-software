export default function ExpensesPage() {
  return (
    <div className="mt-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Expense Management</h3>
        <div className="grid gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-white">Recent Expenses</h4>
            <p className="text-gray-300 mt-2">Expense data will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
}