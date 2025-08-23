import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaHouse, FaUsers, FaCartShopping, FaChartLine, FaCalendar } from "react-icons/fa6";
import { FaSearch, FaFilter } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const API_URL = import.meta.env.VITE_API_URL;

const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

export default function Users() {
  const [isFetching, setIsFetching] = useState(true);
  const [users, setUsers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [timeRange, setTimeRange] = useState("month");
  const [error, setError] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Token manquant, veuillez vous reconnecter");
        setIsFetching(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const endpoints = [
        { url: `${API_URL}/users/`, key: "users" },
        { url: `${API_URL}/suppliers/`, key: "suppliers" },
        { url: `${API_URL}/orders/find/`, key: "orders" },
      ];

      try {
        const responses = await Promise.all(
          endpoints.map(async ({ url, key }) => {
            const response = await fetch(url, {
              method: "GET",
              headers,
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Erreur HTTP ${response.status} sur ${key}: ${errorText}`);
            }

            const data = await response.json();
            return { key, data };
          })
        );

        const usersData = responses.find((res) => res.key === "users").data || [];
        const suppliersData = responses.find((res) => res.key === "suppliers").data || [];
        const ordersData = responses.find((res) => res.key === "orders").data || [];

        const hanouts = usersData.map((user) => ({
          ...user,
          type: "Hanout",
          displayName: user.fullname,
          identifier: user.id
        }));

        const suppliers = suppliersData.map((supplier) => ({
          ...supplier,
          type: "Fournisseur",
          displayName: supplier.companyName,
          identifier: supplier.id
        }));

        setUsers(hanouts);
        setSuppliers(suppliers);
        setOrders(ordersData);
        setError(null);
      } catch (err) {
        console.error("=== FETCH ERROR DETAILS ===");
        console.error("Error message:", err.message);

        if (err instanceof TypeError && err.message.includes("fetch")) {
          setError("Erreur de connexion au serveur. Vérifiez que le backend est démarré sur " + API_URL);
        } else {
          setError(`Erreur lors de la récupération des données: ${err.message}`);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour extraire l'ID d'un objet DBRef ou string
  const extractId = (obj) => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj.$oid) return obj.$oid; // Format MongoDB
    if (obj.id) return obj.id;
    return null;
  };

  const calculateMonthlyStats = (ordersData, allUsers, year) => {
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
    ];

    return monthNames.map((month, index) => {
      const monthOrders = ordersData.filter((order) => {
        const orderDate = new Date(order.createdAt || order.date);
        return orderDate.getFullYear() === year && orderDate.getMonth() === index;
      });

      const monthData = {
        month,
        monthIndex: index,
        totalOrders: monthOrders.length,
        hanoutOrders: 0,
        supplierOrders: 0,
        users: [],
      };

      allUsers.forEach((user) => {
        let userOrders = 0;
        if (user.type === "Fournisseur") {
          userOrders = monthOrders.filter((order) => 
            extractId(order.supplier) === user.id
          ).length;
          monthData.supplierOrders += userOrders;
        } else {
          userOrders = monthOrders.filter((order) => 
            extractId(order.user) === user.id
          ).length;
          monthData.hanoutOrders += userOrders;
        }

        if (userOrders > 0) {
          monthData.users.push({
            ...user,
            orderCount: userOrders,
          });
        }
      });

      return monthData;
    });
  };

  const calculateDailyStats = (ordersData, allUsers, year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyStats = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOrders = ordersData.filter((order) => {
        const orderDate = new Date(order.createdAt || order.date);
        return (
          orderDate.getFullYear() === year &&
          orderDate.getMonth() === month &&
          orderDate.getDate() === day
        );
      });

      const dayData = {
        day: `${day}/${month + 1}`,
        date: new Date(year, month, day),
        totalOrders: dayOrders.length,
        hanoutOrders: 0,
        supplierOrders: 0,
      };

      allUsers.forEach((user) => {
        let userOrders = 0;
        if (user.type === "Fournisseur") {
          userOrders = dayOrders.filter((order) => 
            extractId(order.supplier) === user.id
          ).length;
          dayData.supplierOrders += userOrders;
        } else {
          userOrders = dayOrders.filter((order) => 
            extractId(order.user) === user.id
          ).length;
          dayData.hanoutOrders += userOrders;
        }
      });

      dailyStats.push(dayData);
    }

    return dailyStats;
  };

  useEffect(() => {
    if (orders.length > 0 && (users.length > 0 || suppliers.length > 0)) {
      const allUsers = [...users, ...suppliers];
      const monthlyStats = calculateMonthlyStats(orders, allUsers, selectedYear);
      const dailyStats = calculateDailyStats(orders, allUsers, selectedYear, selectedMonth);
      
      setMonthlyStats(monthlyStats);
      setDailyStats(dailyStats);
    }
  }, [selectedYear, selectedMonth, orders, users, suppliers]);

  const getOrderStats = (userId, type) => {
    let userOrders = [];
    
    if (type === "Fournisseur") {
      userOrders = orders.filter((order) => 
        extractId(order.supplier) === userId
      );
    } else {
      userOrders = orders.filter((order) => 
        extractId(order.user) === userId
      );
    }
    
    const totalOrders = userOrders.length;

    // Orders this month
    const currentMonthOrders = userOrders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.date);
      return orderDate.getMonth() === selectedMonth && orderDate.getFullYear() === selectedYear;
    });

    // Orders today
    const today = new Date();
    const todayOrders = userOrders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.date);
      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear()
      );
    });

    const statusCounts = userOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return { 
      totalOrders, 
      statusCounts, 
      monthlyOrders: currentMonthOrders.length,
      dailyOrders: todayOrders.length
    };
  };

  const allUsers = useMemo(() => [...users, ...suppliers], [users, suppliers]);
  
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      search === "" ||
      (user.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.phoneNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.address || "").toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === "Tous" || user.type?.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesType;
  });

  // Fonction pour trouver le nom d'un utilisateur par ID
  const findUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.displayName : "N/A";
  };

  // Fonction pour trouver le nom d'un fournisseur par ID
  const findSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.displayName : "N/A";
  };

  const totalUsers = allUsers.length;
  const hanoutsCount = users.length;
  const fournisseursCount = suppliers.length;
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

  const monthOptions = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const chartData = timeRange === "month" 
    ? monthlyStats.map((stat) => ({
        name: stat.month,
        "Commandes Hanouts": stat.hanoutOrders,
        "Commandes Fournisseurs": stat.supplierOrders,
        "Total": stat.totalOrders,
      }))
    : dailyStats.map((stat) => ({
        name: stat.day,
        "Commandes Hanouts": stat.hanoutOrders,
        "Commandes Fournisseurs": stat.supplierOrders,
        "Total": stat.totalOrders,
      }));

  const statusData = Object.entries(
    orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <main className="w-full flex flex-col items-center px-4 py-6 min-h-screen space-y-6 bg-gray-50">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#1E3A8A] tracking-tight flex items-center gap-3 mb-4 md:mb-0">
            <FaUsers size={32} />
            Tableau de Bord Business
          </h1>
          <Link
            to="/home"
            className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300 flex items-center gap-2"
          >
            <FaHouse size={24} />
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 font-medium text-sm ${activeTab === "users" ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]" : "text-gray-500"}`}
            onClick={() => setActiveTab("users")}
          >
            Utilisateurs
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${activeTab === "stats" ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]" : "text-gray-500"}`}
            onClick={() => setActiveTab("stats")}
          >
            Statistiques
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${activeTab === "orders" ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]" : "text-gray-500"}`}
            onClick={() => setActiveTab("orders")}
          >
            Commandes
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone ou adresse..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white appearance-none"
              >
                <option value="Tous">Tous</option>
                <option value="Hanout">Hanout</option>
                <option value="Fournisseur">Fournisseur</option>
              </select>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white"
            >
              {monthOptions.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeTab === "users" && (
          <>
            {/* User type distribution */}
            {!isFetching && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    <svg className="w-full h-full" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
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
                  <p className="text-lg font-medium text-[#1E3A8A]">
                    Hanouts ({hanoutsPercentage.toFixed(1)}%)
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    <svg className="w-full h-full" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
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
                  <p className="text-lg font-medium text-[#1E3A8A]">
                    Fournisseurs ({fournisseursPercentage.toFixed(1)}%)
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center">
                  <h3 className="text-xl font-semibold text-[#1E3A8A] mb-2">Total Utilisateurs</h3>
                  <p className="text-4xl font-bold text-[#1E3A8A]">{totalUsers}</p>
                </div>
              </div>
            )}

            {isFetching ? (
              <div className="flex justify-center">
                <Spinner />
              </div>
            ) : error ? (
              <p className="text-red-500 text-center bg-red-50 p-4 rounded-xl">{error}</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-gray-500 text-center bg-white p-8 rounded-xl">Aucun utilisateur trouvé</p>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#1E3A8A] text-white">
                      <th className="p-4 font-semibold">Nom/Entreprise</th>
                      <th className="p-4 font-semibold">Téléphone</th>
                      <th className="p-4 font-semibold">Adresse</th>
                      <th className="p-4 font-semibold">Type</th>
                      <th className="p-4 font-semibold">Patente</th>
                      <th className="p-4 font-semibold">Commandes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const orderStats = getOrderStats(user.id, user.type);

                      return (
                        <tr
                          key={`${user.type}-${user.id}`}
                          className="border-t border-gray-200 hover:bg-[#D4AF37]/10 transition-all duration-300"
                        >
                          <td className="p-4 text-gray-800 font-medium">{user.displayName || "N/A"}</td>
                          <td className="p-4 text-gray-800">{user.phoneNumber || "N/A"}</td>
                          <td className="p-4 text-gray-800">{user.address || "N/A"}</td>
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
                          <td className="p-4 text-gray-800">
                            {user.patente ? user.patente : "N/A"}
                          </td>
                          <td className="p-4">
                            {orderStats && orderStats.totalOrders > 0 ? (
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center gap-2">
                                  <FaCartShopping className="text-[#1E3A8A]" size={16} />
                                  <span className="font-semibold text-[#1E3A8A]">
                                    {orderStats.totalOrders} total
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                  <span className="text-blue-600">{orderStats.dailyOrders} aujourd'hui</span>
                                  <span className="text-green-600">{orderStats.monthlyOrders} ce mois</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(orderStats.statusCounts).map(([status, count]) => (
                                    <span
                                      key={status}
                                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}
                                    >
                                      {status}: {count}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Aucune commande</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === "stats" && (
          <div className="space-y-8">
            {/* Time range selector */}
            <div className="flex gap-4 mb-6">
              <button
                className={`px-4 py-2 rounded-lg ${timeRange === "month" ? "bg-[#1E3A8A] text-white" : "bg-white text-gray-700"}`}
                onClick={() => setTimeRange("month")}
              >
                Par Mois
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${timeRange === "day" ? "bg-[#1E3A8A] text-white" : "bg-white text-gray-700"}`}
                onClick={() => setTimeRange("day")}
              >
                Par Jour
              </button>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-[#1E3A8A] mb-6 flex items-center gap-2">
                  <FaChartLine />
                  Évolution des Commandes {timeRange === "month" ? selectedYear : `${monthOptions[selectedMonth]} ${selectedYear}`}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
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

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-[#1E3A8A] mb-6 flex items-center gap-2">
                  <FaChartLine />
                  Répartition des Statuts de Commandes
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold text-[#1E3A8A] mb-6 flex items-center gap-2">
                  <FaChartLine />
                  Commandes par {timeRange === "month" ? "Mois" : "Jour"} - {selectedYear}
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Commandes Hanouts" fill="#3B82F6" />
                    <Bar dataKey="Commandes Fournisseurs" fill="#D4AF37" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Global Order Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6 flex items-center gap-2">
                <FaCartShopping />
                Résumé des Commandes {selectedYear}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#1E3A8A]/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">Total des Commandes</h3>
                  <p className="text-3xl font-bold text-[#D4AF37]">
                    {monthlyStats.reduce((sum, month) => sum + month.totalOrders, 0)}
                  </p>
                </div>
                <div className="bg-[#3B82F6]/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">Commandes Hanouts</h3>
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
                <div className="bg-green-100/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">
                    Commandes {monthOptions[selectedMonth]}
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    {monthlyStats[selectedMonth]?.totalOrders || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">Détail des Commandes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#1E3A8A] text-white">
                    <th className="p-4 font-semibold">ID Commande</th>
                    <th className="p-4 font-semibold">Client</th>
                    <th className="p-4 font-semibold">Fournisseur</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Montant</th>
                    <th className="p-4 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => {
                    const userId = extractId(order.user);
                    const supplierId = extractId(order.supplier);
                    
                    return (
                      <tr key={order.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="p-4 text-gray-800">{order.readableId || order.id}</td>
                        <td className="p-4 text-gray-800">
                          {userId ? findUserName(userId) : "N/A"}
                        </td>
                        <td className="p-4 text-gray-800">
                          {supplierId ? findSupplierName(supplierId) : "N/A"}
                        </td>
                        <td className="p-4 text-gray-800">
                          {new Date(order.createdAt || order.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-gray-800">{order.amount || "N/A"} DH</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {orders.length > 10 && (
              <div className="mt-4 text-center">
                <button className="text-[#1E3A8A] hover:text-[#D4AF37] font-medium">
                  Voir plus de commandes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}