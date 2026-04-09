import { NavLink, Link, useLocation } from "react-router-dom";
import { FaBoxArchive, FaCircleUser, FaUsers, FaComment, FaHandshake, FaArrowRightFromBracket, FaGauge, FaBars, FaXmark, FaBox } from "react-icons/fa6";
import { useState, useEffect, useCallback, useMemo, memo } from "react";

const NAV_ITEMS = [
  { to: "/home", icon: FaGauge, label: "Tableau de Bord" },
  { to: "/pending-products", icon: FaBoxArchive, label: "Produits en attente" },
  { to: "/users", icon: FaUsers, label: "Utilisateurs" },
  { to: "/products", icon: FaBox, label: "Tous Les Produits" },
  { to: "/partners", icon: FaHandshake, label: "Partenaires" },
  { to: "/feedback", icon: FaComment, label: "Avis" },
];

const NavItem = memo(function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <li>
      <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center px-4 py-3 mx-2 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200 group ${
            isActive ? "bg-white/15 text-white shadow-sm" : ""
          }`
        }
      >
        <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
        <span className="ml-3 text-sm font-medium">{label}</span>
      </NavLink>
    </li>
  );
});

const SideBar = memo(function SideBar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }, []);

  const handleLinkClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Hamburger - mobile only */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-[#1E3A8A] text-white p-2.5 rounded-xl shadow-lg hover:bg-[#2D4A9E] transition-all duration-200"
        aria-label="Menu"
      >
        {isOpen ? <FaXmark className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
      </button>

      {/* Overlay - mobile only */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-gradient-to-b from-[#0F2557] via-[#1E3A8A] to-[#2D4A9E] text-white h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link to="/home" className="flex items-center gap-3 group">
            <div className="bg-[#D4AF37] p-2 rounded-lg group-hover:scale-105 transition-transform duration-200">
              <FaCircleUser className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide text-white">
                Hanoutik
              </h1>
              <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1 pb-4">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                onClick={handleLinkClick}
              />
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-white/80 bg-red-500/10 hover:bg-red-500/25 hover:text-white rounded-xl transition-all duration-200 group"
          >
            <FaArrowRightFromBracket className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="ml-3 text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
});

export default SideBar;