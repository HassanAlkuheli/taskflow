import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ darkMode, toggleDarkMode }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex">
        <h1 className="font-bold text-4xl dark:text-[var(--color-text)]">Today</h1>
        <h1 className="flex justify-center font-bold text-4xl pl-4 opacity-50 dark:text-[var(--color-text)/80]">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀' : '🌙'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          aria-label="Logout"
        >
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Header;