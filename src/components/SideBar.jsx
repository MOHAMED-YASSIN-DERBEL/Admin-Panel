import { NavLink, Link } from "react-router-dom";
import { FaBoxArchive, FaCircleUser, FaUsers, FaComment, FaHandshake } from "react-icons/fa6"; // 👈 Ajout de FaHandshake

export default function SideBar() {
  return (
    <div className="w-64 bg-gradient-to-b from-[#1E3A8A] to-[#3B82F6] text-white shadow-2xl h-full flex flex-col">
      <div className="p-6 border-b border-blue-800/50">
        <Link to="/home" className="flex items-center space-x-3 group"> {/* 👈 Changé de "/" à "/home" */}
          <FaCircleUser className="w-8 h-8 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300" />
          <h1 className="text-2xl font-semibold tracking-wide text-[#F9FAFB] group-hover:text-[#D4AF37] transition-colors duration-300">
            Admin Panel
          </h1>
        </Link>
      </div>
      <nav className="mt-4 flex-1">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/pending-products"
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
    </div>
  );
}