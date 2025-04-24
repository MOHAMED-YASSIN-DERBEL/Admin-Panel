import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Spinner from "../components/Spinner";
import { FaHouse, FaUsers } from "react-icons/fa6";

const API_URL = import.meta.env.VITE_API_URL;

export default function Users() {
  const [isFetching, setIsFetching] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log("Fetching Hanouts from:", `${API_URL}/users`);
        const hanoutsResponse = await axios.get(`${API_URL}/users/`);
        const hanouts = (hanoutsResponse.data || []).map((user) => ({
          ...user,
          type: "Hanout",
        }));

        console.log("Fetching Fournisseurs from:", `${API_URL}/suppliers`);
        const suppliersResponse = await axios.get(`${API_URL}/suppliers/`);
        const suppliers = (suppliersResponse.data || []).map((supplier) => ({
          ...supplier,
          type: "Fournisseur",
        }));

        const allUsers = [...hanouts, ...suppliers];
        setUsers(allUsers);

        console.log("User types:", allUsers.map((u) => u.type));

        setError(null);
        setIsFetching(false);
      } catch (error) {
        console.error("Fetch Error Details:", {
          message: error.message,
          code: error.code,
          response: error.response ? error.response.data : null,
        });
        setError(
          error.response?.status === 404
            ? "Endpoint non trouvé (404)"
            : `Erreur lors de la récupération des utilisateurs: ${error.message}`
        );
        setIsFetching(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      search === "" ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.phoneNumber?.toLowerCase().includes(search.toLowerCase());

    console.log(`FilterType: ${filterType}, User Type: ${user.type}`);

    let matchesType;
    if (filterType === "Tous") {
      matchesType = true;
    } else {
      matchesType = user.type === filterType;
    }

    console.log(`Matches Type: ${matchesType}`);

    return matchesSearch && matchesType;
  });

  const totalUsers = users.length;
  const hanoutsCount = users.filter((user) => user.type === "Hanout").length;
  const fournisseursCount = users.filter((user) => user.type === "Fournisseur").length;
  const hanoutsPercentage = totalUsers > 0 ? (hanoutsCount / totalUsers) * 100 : 0;
  const fournisseursPercentage = totalUsers > 0 ? (fournisseursCount / totalUsers) * 100 : 0;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const hanoutsOffset = circumference - (hanoutsPercentage / 100) * circumference;
  const fournisseursOffset = circumference - (fournisseursPercentage / 100) * circumference;

  return (
    <main className="w-full flex flex-col items-center px-8 py-10 min-h-screen space-y-8">
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold text-[#1E3A8A] tracking-tight flex items-center gap-3">
            <FaUsers size={36} />
            Utilisateurs
          </h1>
          <Link to="/" className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300">
            <FaHouse size={28} />
          </Link>
        </div>

        {isFetching ? null : (
          <div className="flex justify-center space-x-12 mb-12">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={hanoutsOffset}
                    transform="rotate(-90 60 60)"
                  />
                  <text
                    x="60"
                    y="60"
                    textAnchor="middle"
                    dy=".3em"
                    className="text-lg font-semibold text-[#1E3A8A]"
                  >
                    {hanoutsCount}
                  </text>
                </svg>
              </div>
              <p className="mt-2 text-lg font-medium text-[#1E3A8A]">
                Hanouts ({hanoutsPercentage.toFixed(1)}%)
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={fournisseursOffset}
                    transform="rotate(-90 60 60)"
                  />
                  <text
                    x="60"
                    y="60"
                    textAnchor="middle"
                    dy=".3em"
                    className="text-lg font-semibold text-[#1E3A8A]"
                  >
                    {fournisseursCount}
                  </text>
                </svg>
              </div>
              <p className="mt-2 text-lg font-medium text-[#1E3A8A]">
                Fournisseurs ({fournisseursPercentage.toFixed(1)}%)
              </p>
            </div>
          </div>
        )}

        <section className="w-full flex space-x-4 mb-8">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou numéro..."
            className="w-1/3 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
            }}
            className="w-1/4 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
          >
            <option value="Tous">Tous</option>
            <option value="Hanout">Hanout</option>
            <option value="Fournisseur">Fournisseur</option>
          </select>
        </section>

        {isFetching ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-gray-500 text-center">Aucun utilisateur trouvé</p>
        ) : (
          <div className="w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#1E3A8A]/10">
                  <th className="p-4 text-[#1E3A8A] font-semibold">Nom</th>
                  <th className="p-4 text-[#1E3A8A] font-semibold">Numéro</th>
                  <th className="p-4 text-[#1E3A8A] font-semibold">Email</th>
                  <th className="p-4 text-[#1E3A8A] font-semibold">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={`${user.type}-${user.id}`}
                    className="border-t border-gray-200 hover:bg-[#D4AF37]/10 transition-all duration-300"
                  >
                    <td className="p-4 text-gray-800">{user.name || "N/A"}</td>
                    <td className="p-4 text-gray-800">{user.number || "N/A"}</td>
                    <td className="p-4 text-gray-800">{user.email || "N/A"}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.type === "Fournisseur"
                            ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                            : "bg-[#3B82F6]/20 text-[#3B82F6]"
                        }`}
                      >
                        {user.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}