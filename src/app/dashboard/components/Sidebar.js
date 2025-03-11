export default function Sidebar() {
    return (
      <aside style={{ width: '200px', background: '#f4f4f4', padding: '20px' }}>
        <h2>Dashboard</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><a href="/dashboard">Overview</a></li>
          <li><a href="/dashboard/articles">Manage Articles</a></li>
          <li><a href="/dashboard/messages">Manage Messages</a></li>
          <li><a href="/dashboard/projects">Manage Projects</a></li>
        </ul>
      </aside>
    );
  }