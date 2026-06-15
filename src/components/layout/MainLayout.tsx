import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
