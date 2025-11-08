import { NavLink, Link, useLocation } from "react-router-dom";
import { FaBoxArchive, FaCircleUser, FaUsers, FaComment, FaHandshake, FaArrowRightFromBracket, FaGauge, FaBars, FaXmark } from "react-icons/fa6";
import { useState, useEffect } from "react";

export default function SideBar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Fermer la sidebar automatiquement lors du changement de route
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleLinkClick = () => {
    // Sur mobile, fermer la sidebar après le clic
    setIsOpen(false);
  };

  return (
    <>
      {/* Bouton hamburger - toujours visible sur tous les écrans */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[60] bg-[#1E3A8A] text-white p-3 rounded-xl shadow-lg hover:bg-[#D4AF37] transition-all duration-300"
      >
        {isOpen ? <FaXmark className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
      </button>

      {/* Overlay pour fermer la sidebar */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        />
      )}

      {/* Sidebar - cachée par défaut sur tous les écrans */}
      <div className={`w-64 bg-gradient-to-b from-[#1E3A8A] to-[#3B82F6] text-white shadow-2xl h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
      <div className="p-6 border-b border-blue-800/50">
        <Link to="/home" className="flex items-center space-x-3 group"> {/* 👈 Changé de "/" à "/home" */}
          <FaCircleUser className="w-8 h-8 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300" />
          <h1 className="text-2xl font-semibold tracking-wide text-[#F9FAFB] group-hover:text-[#D4AF37] transition-colors duration-300">
            Admin Panel
          </h1>
        </Link>
      </div>
      <nav className="mt-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/home"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-white hover:bg-blue-600 hover:rounded-r-full transition-all duration-300 group ${
                  isActive ? "bg-blue-600 rounded-r-full shadow-lg" : ""
                }`
              }
            >
              <FaGauge className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              <span className="ml-4 text-lg font-medium group-hover:text-[#D4AF37] transition-colors duration-300">
                Tableau de Bord
              </span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pending-products"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-white hover:bg-blue-600 hover:rounded-r-full transition-all duration-300 group ${
                  isActive ? "bg-blue-600 rounded-r-full shadow-lg" : ""
                }`
              }
            >
              <FaBoxArchive className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              <span className="ml-4 text-lg font-medium group-hover:text-[#D4AF37] transition-colors duration-300">
                Produits en attente
              </span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/users"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-white hover:bg-blue-600 hover:rounded-r-full transition-all duration-300 group ${
                  isActive ? "bg-blue-600 rounded-r-full shadow-lg" : ""
                }`
              }
            >
              <FaUsers className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              <span className="ml-4 text-lg font-medium group-hover:text-[#D4AF37] transition-colors duration-300">
                Utilisateurs
              </span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/products"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-white hover:bg-blue-600 hover:rounded-r-full transition-all duration-300 group ${
                  isActive ? "bg-blue-600 rounded-r-full shadow-lg" : ""
                }`
              }
            >
              <FaBoxArchive className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              <span className="ml-4 text-lg font-medium group-hover:text-[#D4AF37] transition-colors duration-300">
                Tous Les Produits
              </span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/partners"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-white hover:bg-blue-600 hover:rounded-r-full transition-all duration-300 group ${
                  isActive ? "bg-blue-600 rounded-r-full shadow-lg" : ""
                }`
              }
            >
              <FaHandshake className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              <span className="ml-4 text-lg font-medium group-hover:text-[#D4AF37] transition-colors duration-300">
                Partenaires
              </span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/feedback"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-white hover:bg-blue-600 hover:rounded-r-full transition-all duration-300 group ${
                  isActive ? "bg-blue-600 rounded-r-full shadow-lg" : ""
                }`
              }
            >
              <FaComment className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              <span className="ml-4 text-lg font-medium group-hover:text-[#D4AF37] transition-colors duration-300">
                Avis
              </span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-blue-800/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-white bg-red-600/20 hover:bg-red-600 rounded-xl transition-all duration-300 group"
        >
          <FaArrowRightFromBracket className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
          <span className="ml-4 text-lg font-medium">
            Déconnexion
          </span>
        </button>
      </div>
    </div>
    </>
  );
}