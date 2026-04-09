import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SideBar />
      <div className="lg:ml-64 min-h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
