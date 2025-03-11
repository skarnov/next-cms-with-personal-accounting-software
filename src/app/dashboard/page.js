import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <main style={{ padding: '20px' }}>
          <h1>Dashboard Overview</h1>
          <p>Welcome to your dashboard! Use the sidebar to navigate.</p>
        </main>
      </div>
    </div>
  );
}