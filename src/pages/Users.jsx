import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaHouse, FaUsers, FaCartShopping, FaChartLine, FaCalendar, FaCheck, FaXmark, FaToggleOn, FaToggleOff, FaMoneyBill1Wave } from "react-icons/fa6";
import { FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
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
  const [updatingUser, setUpdatingUser] = useState(null);
  const [revenueSortField, setRevenueSortField] = useState("revenue");
  const [revenueSortDir, setRevenueSortDir] = useState("desc");

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

  // Fonction stable pour extraire l'ID d'un objet DBRef ou string
  const extractId = useCallback((obj) => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj.$oid) return obj.$oid;
    if (obj.id) return obj.id;
    return null;
  }, []);

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

  const getOrderStats = useCallback((userId, type) => {
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

    // Commandes fusionnées (mergedTo != null)
    const mergedOrders = userOrders.filter((order) => 
      order.mergedTo != null
    ).length;

    // Commandes commissionnables: completed/delivered ET mergedTo == null
    const commissionableOrders = userOrders.filter((order) => {
      const status = order.status?.toLowerCase();
      const isCommissionableStatus = status === "completed" || status === "delivered" || 
                                     status === "confirmé" || status === "livré";
      return isCommissionableStatus && (order.mergedTo == null || order.mergedTo === undefined);
    }).length;

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
      dailyOrders: todayOrders.length,
      mergedOrders,
      commissionableOrders
    };
  }, [orders, extractId, selectedMonth, selectedYear]);

  const allUsers = useMemo(() => [...users, ...suppliers], [users, suppliers]);
  
  const filteredUsers = useMemo(() => allUsers.filter((user) => {
    const matchesSearch =
      search === "" ||
      (user.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.phoneNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.address || "").toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === "Tous" || user.type?.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesType;
  }), [allUsers, search, filterType]);

  // Fonction stable pour trouver le nom d'un utilisateur par ID
  const findUserName = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.displayName : "N/A";
  }, [users]);

  // Fonction stable pour trouver le nom d'un fournisseur par ID
  const findSupplierName = useCallback((supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.displayName : "N/A";
  }, [suppliers]);

  // Fonction stable pour mettre à jour le statut de vérification d'un utilisateur
  const updateUserVerification = useCallback(async (userId, userType, currentValue) => {
    setUpdatingUser(userId);
    const token = localStorage.getItem("token");
    const endpoint = userType === "Fournisseur" ? "suppliers/update-supplier" : "users/update-user";
    
    try {
      const response = await fetch(`${API_URL}/${endpoint}/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ isVerified: !currentValue }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      // Mettre à jour localement
      if (userType === "Fournisseur") {
        setSuppliers(prev => prev.map(s => 
          s.id === userId ? { ...s, isVerified: !currentValue } : s
        ));
      } else {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isVerified: !currentValue } : u
        ));
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setUpdatingUser(null);
    }
  }, []);

  // Fonction stable pour mettre à jour l'autorisation de subvention
  const updateSubsidyAuthorization = useCallback(async (userId, userType, currentValue) => {
    setUpdatingUser(userId);
    const token = localStorage.getItem("token");
    const endpoint = userType === "Fournisseur" ? "suppliers/update-supplier" : "users/update-user";
    
    try {
      const response = await fetch(`${API_URL}/${endpoint}/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ hasSubsidyAuthorization: !currentValue }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      // Mettre à jour localement
      if (userType === "Fournisseur") {
        setSuppliers(prev => prev.map(s => 
          s.id === userId ? { ...s, hasSubsidyAuthorization: !currentValue } : s
        ));
      } else {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, hasSubsidyAuthorization: !currentValue } : u
        ));
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setUpdatingUser(null);
    }
  }, []);

  const totalUsers = useMemo(() => allUsers.length, [allUsers]);
  const hanoutsCount = useMemo(() => users.length, [users]);
  const fournisseursCount = useMemo(() => suppliers.length, [suppliers]);
  const hanoutsPercentage = useMemo(() => totalUsers > 0 ? (hanoutsCount / totalUsers) * 100 : 0, [totalUsers, hanoutsCount]);
  const fournisseursPercentage = useMemo(() => totalUsers > 0 ? (fournisseursCount / totalUsers) * 100 : 0, [totalUsers, fournisseursCount]);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const hanoutsOffset = useMemo(() => circumference - (hanoutsPercentage / 100) * circumference, [circumference, hanoutsPercentage]);
  const fournisseursOffset = useMemo(() => circumference - (fournisseursPercentage / 100) * circumference, [circumference, fournisseursPercentage]);

  const getStatusColor = useCallback((status) => {
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
  }, []);

  const yearOptions = useMemo(() => {
    const options = [];
    for (let year = 2020; year <= new Date().getFullYear(); year++) {
      options.push(year);
    }
    return options;
  }, []);

  const monthOptions = useMemo(() => [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ], []);

  const chartData = useMemo(() => timeRange === "month" 
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
      })), [timeRange, monthlyStats, dailyStats]);

  const statusData = useMemo(() => Object.entries(
    orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })), [orders]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Revenu Hanoutik par fournisseur (1 DT par commande commissionnable)
  const supplierRevenueData = useMemo(() => {
    return suppliers.map((supplier) => {
      const supplierOrders = orders.filter((order) => extractId(order.supplier) === supplier.id);
      const total = supplierOrders.length;
      const commissionable = supplierOrders.filter((order) => {
        const status = order.status?.toLowerCase();
        const isOk = status === "completed" || status === "delivered" || status === "confirmé" || status === "livré";
        return isOk && (order.mergedTo == null || order.mergedTo === undefined);
      }).length;
      const merged = supplierOrders.filter((order) => order.mergedTo != null).length;
      const monthOrders = supplierOrders.filter((order) => {
        const d = new Date(order.createdAt || order.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
      const monthCommissionable = monthOrders.filter((order) => {
        const status = order.status?.toLowerCase();
        const isOk = status === "completed" || status === "delivered" || status === "confirmé" || status === "livré";
        return isOk && (order.mergedTo == null || order.mergedTo === undefined);
      }).length;
      return {
        id: supplier.id,
        name: supplier.displayName || "N/A",
        phone: supplier.phoneNumber || "",
        isVerified: supplier.isVerified,
        totalOrders: total,
        commissionable,
        merged,
        revenue: commissionable * 1,
        monthCommissionable,
        monthRevenue: monthCommissionable * 1,
      };
    });
  }, [suppliers, orders, extractId, selectedMonth, selectedYear]);

  const sortedSupplierRevenue = useMemo(() => {
    return [...supplierRevenueData].sort((a, b) => {
      const aVal = a[revenueSortField] ?? 0;
      const bVal = b[revenueSortField] ?? 0;
      return revenueSortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [supplierRevenueData, revenueSortField, revenueSortDir]);

  const totalHanoutikRevenue = useMemo(() => supplierRevenueData.reduce((s, r) => s + r.revenue, 0), [supplierRevenueData]);
  const totalMonthRevenue = useMemo(() => supplierRevenueData.reduce((s, r) => s + r.monthRevenue, 0), [supplierRevenueData]);
  const totalCommissionableOrders = useMemo(() => supplierRevenueData.reduce((s, r) => s + r.commissionable, 0), [supplierRevenueData]);
  const monthCommissionableTotal = useMemo(() => supplierRevenueData.reduce((s, r) => s + r.monthCommissionable, 0), [supplierRevenueData]);

  const toggleRevenueSort = useCallback((field) => {
    setRevenueSortField((prev) => {
      if (prev === field) {
        setRevenueSortDir((d) => (d === "desc" ? "asc" : "desc"));
        return prev;
      }
      setRevenueSortDir("desc");
      return field;
    });
  }, []);

  return (
    <main className="w-full flex flex-col items-center px-4 lg:px-6 py-6 pt-20 lg:pt-6 min-h-screen space-y-6 bg-gray-50">
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
          <button
            className={`py-3 px-6 font-medium text-sm flex items-center gap-2 ${activeTab === "revenu" ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]" : "text-gray-500"}`}
            onClick={() => setActiveTab("revenu")}
          >
            <FaMoneyBill1Wave size={16} />
            Revenu Hanoutik
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
              <>
              {/* Vue desktop - Table */}
              <div className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#1E3A8A] text-white">
                        <th className="p-4 font-semibold">Nom/Entreprise</th>
                        <th className="p-4 font-semibold">Téléphone</th>
                        <th className="p-4 font-semibold">Adresse</th>
                        <th className="p-4 font-semibold">Type</th>
                        <th className="p-4 font-semibold">Patente</th>
                        <th className="p-4 font-semibold">Vérifié</th>
                        <th className="p-4 font-semibold">Subvention</th>
                        <th className="p-4 font-semibold">Commandes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const orderStats = getOrderStats(user.id, user.type);
                        const isUpdating = updatingUser === user.id;

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
                              <button
                                onClick={() => updateUserVerification(user.id, user.type, user.isVerified)}
                                disabled={isUpdating}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                                  user.isVerified
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                title={user.isVerified ? "Utilisateur vérifié - Cliquer pour déverifier" : "Utilisateur non vérifié - Cliquer pour vérifier"}
                              >
                                {user.isVerified ? <FaCheck size={16} /> : <FaXmark size={16} />}
                                <span className="text-xs font-medium">
                                  {isUpdating ? "..." : user.isVerified ? "Vérifié" : "Non vérifié"}
                                </span>
                              </button>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => updateSubsidyAuthorization(user.id, user.type, user.hasSubsidyAuthorization)}
                                disabled={isUpdating}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                                  user.hasSubsidyAuthorization
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                title={user.hasSubsidyAuthorization ? "Autorisation active - Cliquer pour désactiver" : "Autorisation inactive - Cliquer pour activer"}
                              >
                                {user.hasSubsidyAuthorization ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                                <span className="text-xs font-medium">
                                  {isUpdating ? "..." : user.hasSubsidyAuthorization ? "Oui" : "Non"}
                                </span>
                              </button>
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
                                  {user.type === "Fournisseur" && (
                                    <div className="grid grid-cols-2 gap-1 text-xs mt-2 pt-2 border-t border-gray-200">
                                      <span className="text-purple-600 font-medium" title="Commandes completed/delivered sans fusion">
                                        💰 {orderStats.commissionableOrders} commissionnables
                                      </span>
                                      <span className="text-orange-600 font-medium" title="Commandes fusionnées">
                                        🔗 {orderStats.mergedOrders} fusionnées
                                      </span>
                                    </div>
                                  )}
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
              </div>

              {/* Vue mobile - Cards */}
              <div className="lg:hidden space-y-4">
                {filteredUsers.map((user) => {
                  const orderStats = getOrderStats(user.id, user.type);
                  const isUpdating = updatingUser === user.id;

                  return (
                    <div
                      key={`${user.type}-${user.id}`}
                      className="bg-white rounded-xl shadow-lg p-4 space-y-3 border border-gray-200 hover:shadow-xl transition-all duration-300"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-[#1E3A8A]">{user.displayName || "N/A"}</h3>
                          <p className="text-sm text-gray-600">{user.phoneNumber || "N/A"}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.type === "Fournisseur"
                              ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                              : "bg-[#3B82F6]/20 text-[#3B82F6]"
                          }`}
                        >
                          {user.type}
                        </span>
                      </div>

                      {/* Adresse & Patente */}
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700"><span className="font-semibold">Adresse:</span> {user.address || "N/A"}</p>
                        <p className="text-gray-700"><span className="font-semibold">Patente:</span> {user.patente || "N/A"}</p>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updateUserVerification(user.id, user.type, user.isVerified)}
                          disabled={isUpdating}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                            user.isVerified
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          } ${isUpdating ? "opacity-50" : ""}`}
                        >
                          {user.isVerified ? <FaCheck size={14} /> : <FaXmark size={14} />}
                          <span className="text-xs font-medium">
                            {isUpdating ? "..." : user.isVerified ? "Vérifié" : "Non vérifié"}
                          </span>
                        </button>

                        <button
                          onClick={() => updateSubsidyAuthorization(user.id, user.type, user.hasSubsidyAuthorization)}
                          disabled={isUpdating}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                            user.hasSubsidyAuthorization
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          } ${isUpdating ? "opacity-50" : ""}`}
                        >
                          {user.hasSubsidyAuthorization ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                          <span className="text-xs font-medium">
                            {isUpdating ? "..." : user.hasSubsidyAuthorization ? "Subv. Oui" : "Subv. Non"}
                          </span>
                        </button>
                      </div>

                      {/* Commandes */}
                      {orderStats && orderStats.totalOrders > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <FaCartShopping className="text-[#1E3A8A]" size={14} />
                            <span className="font-semibold text-[#1E3A8A] text-sm">
                              {orderStats.totalOrders} commandes
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <span className="text-blue-600">{orderStats.dailyOrders} aujourd'hui</span>
                            <span className="text-green-600">{orderStats.monthlyOrders} ce mois</span>
                          </div>
                          {user.type === "Fournisseur" && (
                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-200">
                              <span className="text-purple-600 font-medium">💰 {orderStats.commissionableOrders}</span>
                              <span className="text-orange-600 font-medium">🔗 {orderStats.mergedOrders}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
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
                        <p className="text-gray-400 text-sm text-center py-2">Aucune commande</p>
                      )}
                    </div>
                  );
                })}
              </div>
              </>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
                <div className="bg-purple-100/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">
                    💰 Commissionnables
                  </h3>
                  <p className="text-3xl font-bold text-purple-600" title="Commandes completed/delivered sans fusion">
                    {orders.filter(order => {
                      const status = order.status?.toLowerCase();
                      const isCommissionableStatus = status === "completed" || status === "delivered" || 
                                                     status === "confirmé" || status === "livré";
                      return isCommissionableStatus && (order.mergedTo == null || order.mergedTo === undefined);
                    }).length}
                  </p>
                </div>
                <div className="bg-orange-100/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">
                    🔗 Fusionnées
                  </h3>
                  <p className="text-3xl font-bold text-orange-600" title="Commandes fusionnées">
                    {orders.filter(order => order.mergedTo != null).length}
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

        {activeTab === "revenu" && (
          <div className="space-y-6">
            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-amber-500">
                <p className="text-sm font-medium text-gray-500 mb-1">Revenu Total Hanoutik</p>
                <p className="text-3xl font-bold text-amber-600">{totalHanoutikRevenue.toFixed(2)} DT</p>
                <p className="text-xs text-gray-400 mt-1">1 DT × {totalCommissionableOrders} commandes</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                <p className="text-sm font-medium text-gray-500 mb-1">Revenu {monthOptions[selectedMonth]}</p>
                <p className="text-3xl font-bold text-blue-600">{totalMonthRevenue.toFixed(2)} DT</p>
                <p className="text-xs text-gray-400 mt-1">1 DT × {monthCommissionableTotal} commandes</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                <p className="text-sm font-medium text-gray-500 mb-1">Fournisseurs Actifs</p>
                <p className="text-3xl font-bold text-green-600">{supplierRevenueData.filter((s) => s.totalOrders > 0).length}</p>
                <p className="text-xs text-gray-400 mt-1">sur {suppliers.length} total</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
                <p className="text-sm font-medium text-gray-500 mb-1">Revenu Moyen / Fournisseur</p>
                <p className="text-3xl font-bold text-purple-600">
                  {supplierRevenueData.filter((s) => s.commissionable > 0).length > 0
                    ? (totalHanoutikRevenue / supplierRevenueData.filter((s) => s.commissionable > 0).length).toFixed(2)
                    : "0.00"} DT
                </p>
                <p className="text-xs text-gray-400 mt-1">par fournisseur actif</p>
              </div>
            </div>

            {/* Commission explanation */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl p-5">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FaMoneyBill1Wave className="text-amber-600" />
                Système de Revenu Hanoutik
              </h4>
              <div className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                <p>• <strong>1 DT prélevé</strong> par commande commissionnable</p>
                <p>• Statuts éligibles : <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">completed</span> <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">delivered</span></p>
                <p>• Commandes fusionnées (<span className="text-orange-600">mergedTo ≠ null</span>) = <strong>pas de revenu</strong></p>
                <p>• Revenu = 1 DT × nombre de commandes commissionnables</p>
              </div>
            </div>

            {/* Supplier Revenue Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <FaMoneyBill1Wave />
                  Revenu par Fournisseur
                </h2>
                <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                  {monthOptions[selectedMonth]} {selectedYear}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fournisseur</th>
                      <th
                        className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-amber-600 transition-colors select-none"
                        onClick={() => toggleRevenueSort("totalOrders")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Commandes
                          {revenueSortField === "totalOrders" && (revenueSortDir === "desc" ? <FaSortAmountDown size={10} /> : <FaSortAmountUp size={10} />)}
                        </span>
                      </th>
                      <th
                        className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-green-600 transition-colors select-none"
                        onClick={() => toggleRevenueSort("commissionable")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Commissionnables
                          {revenueSortField === "commissionable" && (revenueSortDir === "desc" ? <FaSortAmountDown size={10} /> : <FaSortAmountUp size={10} />)}
                        </span>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Fusionnées</th>
                      <th
                        className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors select-none"
                        onClick={() => toggleRevenueSort("monthRevenue")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Ce Mois
                          {revenueSortField === "monthRevenue" && (revenueSortDir === "desc" ? <FaSortAmountDown size={10} /> : <FaSortAmountUp size={10} />)}
                        </span>
                      </th>
                      <th
                        className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-amber-600 transition-colors select-none"
                        onClick={() => toggleRevenueSort("revenue")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Revenu Total
                          {revenueSortField === "revenue" && (revenueSortDir === "desc" ? <FaSortAmountDown size={10} /> : <FaSortAmountUp size={10} />)}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedSupplierRevenue.length > 0 ? (
                      sortedSupplierRevenue.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-400 font-medium">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {row.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{row.name}</p>
                                <p className="text-xs text-gray-500">{row.phone}</p>
                              </div>
                              {row.isVerified && (
                                <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">✓</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-gray-800">{row.totalOrders}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              {row.commissionable}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                              {row.merged}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div>
                              <span className="font-bold text-blue-600">{row.monthRevenue.toFixed(2)} DT</span>
                              <p className="text-xs text-gray-400">{row.monthCommissionable} cmd</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-lg font-bold text-amber-600">{row.revenue.toFixed(2)} DT</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                          Aucun fournisseur trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {sortedSupplierRevenue.length > 0 && (
                    <tfoot>
                      <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-t-2 border-amber-300">
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4 font-bold text-gray-900 text-sm">TOTAL ({suppliers.length} fournisseurs)</td>
                        <td className="px-6 py-4 text-center font-bold text-gray-900">
                          {supplierRevenueData.reduce((s, r) => s + r.totalOrders, 0)}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-green-700">
                          {totalCommissionableOrders}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-orange-700">
                          {supplierRevenueData.reduce((s, r) => s + r.merged, 0)}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-blue-700">
                          {totalMonthRevenue.toFixed(2)} DT
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-2xl font-bold text-amber-600">{totalHanoutikRevenue.toFixed(2)} DT</span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
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
                        <td className="p-4 text-gray-800">{order.amount || "N/A"} TND</td>
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