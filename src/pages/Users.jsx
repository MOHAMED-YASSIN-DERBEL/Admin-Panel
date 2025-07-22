import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaHouse, FaUsers, FaCartShopping, FaChartLine, FaCalendar } from "react-icons/fa6";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";


const API_URL = import.meta.env.VITE_API_URL;

const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

export default function Users() {
  const [isFetching, setIsFetching] = useState(true);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
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

        console.log("Fetching Orders from:", `${API_URL}/orders/find/`);
        const ordersResponse = await axios.get(`${API_URL}/orders/find/`);
        const ordersData = ordersResponse.data || [];
        setOrders(ordersData);

        const allUsers = [...hanouts, ...suppliers];
        setUsers(allUsers);

        // Calculate monthly statistics
        calculateMonthlyStats(ordersData, allUsers);

        setError(null);
        setIsFetching(false);
      } catch (error) {
        console.error("Fetch Error Details:", error);
        setError(
          error.response?.status === 404
            ? "Endpoint non trouvé (404)"
            : `Erreur lors de la récupération des données: ${error.message}`
        );
        setIsFetching(false);
      }
    };

    fetchData();
  }, []);

  const calculateMonthlyStats = (ordersData, allUsers) => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const stats = [];
    
    for (let month = 0; month < 12; month++) {
      const monthData = {
        month: monthNames[month],
        monthIndex: month,
        totalOrders: 0,
        hanoutOrders: 0,
        supplierOrders: 0,
        users: []
      };

      // Get orders for this month
      const monthOrders = ordersData.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getFullYear() === selectedYear && 
               orderDate.getMonth() === month;
      });

      monthData.totalOrders = monthOrders.length;

      // Calculate stats for each user
      allUsers.forEach(user => {
        let userOrders = 0;
        
        if (user.type === "Fournisseur") {
          userOrders = monthOrders.filter(order => order.supplierId === user.id).length;
          monthData.supplierOrders += userOrders;
        } else {
          userOrders = monthOrders.filter(order => order.userEmail === user.email).length;
          monthData.hanoutOrders += userOrders;
        }

        if (userOrders > 0) {
          monthData.users.push({
            ...user,
            orderCount: userOrders
          });
        }
      });

      stats.push(monthData);
    }

    setMonthlyStats(stats);
  };

  useEffect(() => {
    if (orders.length > 0 && users.length > 0) {
      calculateMonthlyStats(orders, users);
    }
  }, [selectedYear, orders, users]);

  const getOrderStats = (supplierId) => {
    const supplierOrders = orders.filter((order) => order.supplierId === supplierId);
    const totalOrders = supplierOrders.length;

    const statusCounts = supplierOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return { totalOrders, statusCounts };
  };

  const getHanoutOrderStats = (userEmail) => {
    const hanoutOrders = orders.filter((order) => order.userEmail === userEmail);
    const totalOrders = hanoutOrders.length;

    const statusCounts = hanoutOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return { totalOrders, statusCounts };
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      search === "" ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.phoneNumber?.toLowerCase().includes(search.toLowerCase());

    let matchesType;
    if (filterType === "Tous") {
      matchesType = true;
    } else {
      matchesType = user.type?.toLowerCase() === filterType.toLowerCase();
    }

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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "en_attente":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
      case "confirmé":
        return "bg-green-100 text-green-800";
      case "delivered":
      case "livré":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
      case "annulé":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const yearOptions = [];
  for (let year = 2020; year <= new Date().getFullYear(); year++) {
    yearOptions.push(year);
  }

  const chartData = monthlyStats.map(stat => ({
    month: stat.month,
    "Commandes Hanouts": stat.hanoutOrders,
    "Commandes Fournisseurs": stat.supplierOrders,
    "Total": stat.totalOrders
  }));

  return (
    <main className="w-full flex flex-col items-center px-8 py-10 min-h-screen space-y-8">
      <div className="w-full max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold text-[#1E3A8A] tracking-tight flex items-center gap-3">
            <FaUsers size={36} />
            Utilisateurs & Statistiques
          </h1>
          <Link
            to="/"
            className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300"
          >
            <FaHouse size={28} />
          </Link>
        </div>

        {/* Year selector */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-4">
            <FaCalendar className="text-[#1E3A8A]" size={20} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* User type distribution */}
        {!isFetching && (
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

        {/* Monthly Statistics Chart */}
        {!isFetching && (
          <div className="w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6 flex items-center gap-2">
              <FaChartLine />
              Statistiques Mensuelles {selectedYear}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Commandes Hanouts" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Commandes Fournisseurs" 
                  stroke="#D4AF37" 
                  strokeWidth={2}
                  dot={{ fill: "#D4AF37" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Total" 
                  stroke="#1E3A8A" 
                  strokeWidth={2}
                  dot={{ fill: "#1E3A8A" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Search and filter */}
        <section className="w-full flex space-x-4 mb-8">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou numéro..."
            className="w-1/3 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
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
          <>
            <div className="w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#1E3A8A]/10">
                    <th className="p-4 text-[#1E3A8A] font-semibold">Nom</th>
                    <th className="p-4 text-[#1E3A8A] font-semibold">Numéro</th>
                    <th className="p-4 text-[#1E3A8A] font-semibold">Email</th>
                    <th className="p-4 text-[#1E3A8A] font-semibold">Type</th>
                    <th className="p-4 text-[#1E3A8A] font-semibold">Commandes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const orderStats = user.type === "Fournisseur" 
                      ? getOrderStats(user.id) 
                      : getHanoutOrderStats(user.email);

                    return (
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
                        <td className="p-4">
                          {orderStats && orderStats.totalOrders > 0 ? (
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center gap-2">
                                <FaCartShopping className="text-[#1E3A8A]" size={16} />
                                <span className="font-semibold text-[#1E3A8A]">
                                  {orderStats.totalOrders} commandes
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(orderStats.statusCounts).map(([status, count]) => (
                                  <span
                                    key={status}
                                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                      status
                                    )}`}
                                  >
                                    {status}: {count}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Global Order Summary */}
            <div className="w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 p-6 mt-6">
              <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-4 flex items-center gap-2">
                <FaCartShopping />
                Résumé des Commandes {selectedYear}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1E3A8A]/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">
                    Total des Commandes
                  </h3>
                  <p className="text-3xl font-bold text-[#D4AF37]">
                    {monthlyStats.reduce((sum, month) => sum + month.totalOrders, 0)}
                  </p>
                </div>
                <div className="bg-[#3B82F6]/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">
                    Commandes Hanouts
                  </h3>
                  <p className="text-3xl font-bold text-[#3B82F6]">
                    {monthlyStats.reduce((sum, month) => sum + month.hanoutOrders, 0)}
                  </p>
                </div>
                <div className="bg-[#D4AF37]/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">
                    Commandes Fournisseurs
                  </h3>
                  <p className="text-3xl font-bold text-[#D4AF37]">
                    {monthlyStats.reduce((sum, month) => sum + month.supplierOrders, 0)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}