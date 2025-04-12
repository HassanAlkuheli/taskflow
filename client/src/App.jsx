import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Outlet /> {/* This renders the matched route */}
    </div>
  );
}

export default App;
