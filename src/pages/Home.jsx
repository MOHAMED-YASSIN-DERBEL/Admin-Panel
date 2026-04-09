import { useEffect, useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { 
  FaUsers, 
  FaBox, 
  FaHandshake, 
  FaCartShopping, 
  FaChartLine,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaClock,
  FaCircleCheck,
  FaBoxArchive
} from "react-icons/fa6";
import Spinner from "../components/Spinner";

const API_URL = import.meta.env.VITE_API_URL;

// Extracted memoized StatCard component
const StatCard = memo(function StatCard({ icon: Icon, title, value, color, trend, trendValue, link }) {
  return (
    <Link 
      to={link}
      className="bg-white rounded-2xl shadow-md p-6 border-l-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="text-2xl" style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <FaArrowTrendUp /> : <FaArrowTrendDown />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </Link>
  );
});

// Extracted memoized QuickActionCard component
const QuickActionCard = memo(function QuickActionCard({ icon: Icon, title, description, color, link }) {
  return (
    <Link
      to={link}
      className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all duration-200 border border-gray-100 group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="text-xl" style={{ color }} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#1E3A8A] transition-colors">{title}</h3>
      </div>
      <p className="text-gray-500 text-sm">{description}</p>
    </Link>
  );
});

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState({
    users: [],
    suppliers: [],
    orders: [],
    products: [],
    partners: []
  });
  const [error, setError] = useState(null);

  // Mémorisation des calculs de statistiques
  const stats = useMemo(() => {
    const { users, suppliers, orders, products, partners } = rawData;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersToday = orders.filter(order => {
      const orderDate = new Date(order.createdAt || order.date);
      return orderDate >= today;
    }).length;

    const ordersThisMonth = orders.filter(order => {
      const orderDate = new Date(order.createdAt || order.date);
      return orderDate.getMonth() === today.getMonth() && 
             orderDate.getFullYear() === today.getFullYear();
    }).length;

    const commissionableOrders = orders.filter(order => {
      const status = order.status?.toLowerCase();
      const isCommissionable = status === "completed" || status === "delivered" || 
                               status === "confirmé" || status === "livré";
      return isCommissionable && (order.mergedTo == null || order.mergedTo === undefined);
    }).length;

    const mergedOrders = orders.filter(order => order.mergedTo != null).length;
    const pendingProducts = products.filter(p => p.status === "pending").length;
    const approvedProducts = products.filter(p => p.status === "approved").length;

    return {
      users: users.length || 0,
      suppliers: suppliers.length || 0,
      orders: orders.length || 0,
      pendingProducts,
      approvedProducts,
      partners: partners.length || 0,
      ordersToday,
      ordersThisMonth,
      commissionableOrders,
      mergedOrders,
      totalRevenue: commissionableOrders * 1.0
    };
  }, [rawData]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Token manquant, veuillez vous reconnecter");
        setLoading(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      try {
        const [usersRes, suppliersRes, ordersRes, productsRes, partnersRes] = await Promise.all([
          fetch(`${API_URL}/users/`, { headers }),
          fetch(`${API_URL}/suppliers/`, { headers }),
          fetch(`${API_URL}/orders/find/`, { headers }),
          fetch(`${API_URL}/product/find/all/`, { headers }),
          fetch(`${API_URL}/partners/`, { headers })
        ]);

        const [users, suppliers, orders, products, partners] = await Promise.all([
          usersRes.ok ? usersRes.json() : [],
          suppliersRes.ok ? suppliersRes.json() : [],
          ordersRes.ok ? ordersRes.json() : [],
          productsRes.ok ? productsRes.json() : [],
          partnersRes.ok ? partnersRes.json() : []
        ]);

        setRawData({ users, suppliers, orders, products, partners });
        setError(null);
      } catch (err) {
        setError("Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <main className="p-6 pt-20 lg:pt-6 min-h-screen flex items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 pt-20 lg:pt-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 pt-20 lg:pt-6 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Tableau de Bord
          </h1>
          <p className="text-gray-600">
            Bienvenue sur votre panneau d'administration Hanoutik
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FaUsers}
            title="Total Utilisateurs"
            value={stats.users + stats.suppliers}
            color="#3B82F6"
            link="/users"
          />
          <StatCard
            icon={FaCartShopping}
            title="Total Commandes"
            value={stats.orders}
            color="#10B981"
            link="/users"
          />
          <StatCard
            icon={FaBox}
            title="Produits Approuvés"
            value={stats.approvedProducts}
            color="#D4AF37"
            link="/products"
          />
          <StatCard
            icon={FaHandshake}
            title="Partenaires"
            value={stats.partners}
            color="#8B5CF6"
            link="/partners"
          />
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FaCircleCheck className="text-4xl opacity-80" />
              <FaClock className="text-2xl opacity-60" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-2">Commandes Aujourd'hui</h3>
            <p className="text-4xl font-bold">{stats.ordersToday}</p>
            <p className="text-sm opacity-75 mt-2">Ce mois: {stats.ordersThisMonth}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FaChartLine className="text-4xl opacity-80" />
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">💰</span>
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-2">Commandes Commissionnables</h3>
            <p className="text-4xl font-bold">{stats.commissionableOrders}</p>
            <p className="text-sm opacity-75 mt-2">Revenue: {stats.totalRevenue.toFixed(2)} DT</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FaBoxArchive className="text-4xl opacity-80" />
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">⏳</span>
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-2">Produits en Attente</h3>
            <p className="text-4xl font-bold">{stats.pendingProducts}</p>
            <p className="text-sm opacity-75 mt-2">Nécessitent une validation</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard
              icon={FaBoxArchive}
              title="Produits en Attente"
              description={`${stats.pendingProducts} produits à valider`}
              color="#F59E0B"
              link="/pending-products"
            />
            <QuickActionCard
              icon={FaUsers}
              title="Gérer les Utilisateurs"
              description={`${stats.users} Hanouts, ${stats.suppliers} Fournisseurs`}
              color="#3B82F6"
              link="/users"
            />
            <QuickActionCard
              icon={FaHandshake}
              title="Gestion Partenaires"
              description={`${stats.partners} partenaires actifs`}
              color="#8B5CF6"
              link="/partners"
            />
          </div>
        </div>

        {/* System Info */}
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <FaChartLine className="text-white text-2xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">💰 Système de Commission</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• <strong>Hanoutik:</strong> 1 DT par commande commissionnable (completed/delivered, non fusionnée)</p>
                <p>• <strong>Partenaires:</strong> Commission % basée sur le 1 DT</p>
                <p>• <strong>Commandes fusionnées:</strong> {stats.mergedOrders} (pas de commission)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
