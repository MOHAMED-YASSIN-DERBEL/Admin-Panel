import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import { 
  FaHandshake, 
  FaHouse, 
  FaCartShopping, 
  FaLocationDot, 
  FaPercent,
  FaChartLine, 
  FaChartPie 
} from "react-icons/fa6"; 

const API_URL = import.meta.env.VITE_API_URL;

export default function Partners() {
  const [isFetching, setIsFetching] = useState(true);
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [expandedPartner, setExpandedPartner] = useState(null);
  const [partnerOrders, setPartnerOrders] = useState({});
  const [partnerStats, setPartnerStats] = useState({});
  const [revenueEvolution, setRevenueEvolution] = useState([]);
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const [revenueDistribution, setRevenueDistribution] = useState({ distribution: [], totalRevenue: 0 });
  const [topPerformers, setTopPerformers] = useState([]);
  const [orderFilters, setOrderFilters] = useState({
    supplierId: "",
    search: "",
    status: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    sortBy: "createdAt",
    sortDir: "desc",
    page: 0,
    size: 10,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchPartners = async () => {
      setIsFetching(true);

      if (!token) {
        setError("Token manquant, veuillez vous reconnecter");
        setIsFetching(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/partners/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }

        const fetchedPartners = await response.json();
        setPartners(fetchedPartners || []);
        setError(null);
      } catch (err) {
        if (err instanceof TypeError && err.message.includes("fetch")) {
          setError("Erreur de connexion au serveur. Vérifiez que le backend est démarré sur " + API_URL);
        } else if (err.message.includes("401")) {
          setError("Non autorisé (401). Vérifiez votre token.");
        } else if (err.message.includes("404")) {
          setError("Endpoint non trouvé (404).");
        } else {
          setError(`Erreur lors de la récupération des partenaires: ${err.message}`);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchPartners();
  }, [token]);

  const fetchPartnerData = async (partnerId) => {
    if (!token) {
      setError("Token manquant, veuillez vous reconnecter");
      return;
    }

    try {
      const statsResponse = await fetch(`${API_URL}/partners/orders/${partnerId}/statistics`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        throw new Error(`Erreur HTTP ${statsResponse.status}: ${errorText}`);
      }

      const stats = await statsResponse.json();
      // Chaque commande = 1 DT, partenaire prend 10% (0.1 DT par commande)
      const updatedStats = {
        ...stats,
        partnerRevenue: stats.totalOrders ? stats.totalOrders * 0.1 : 0,
      };
      setPartnerStats((prev) => ({ ...prev, [partnerId]: updatedStats }));

      const queryParams = new URLSearchParams({
        page: orderFilters.page.toString(),
        size: orderFilters.size.toString(),
        sortBy: orderFilters.sortBy,
        sortDir: orderFilters.sortDir,
        ...(orderFilters.supplierId && { supplierId: orderFilters.supplierId }),
        ...(orderFilters.search && { search: orderFilters.search }),
        ...(orderFilters.status && { status: orderFilters.status }),
        ...(orderFilters.minAmount && { minAmount: orderFilters.minAmount }),
        ...(orderFilters.maxAmount && { maxAmount: orderFilters.maxAmount }),
        ...(orderFilters.startDate && { startDate: orderFilters.startDate }),
      });

      const ordersResponse = await fetch(`${API_URL}/partners/orders/${partnerId}?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!ordersResponse.ok) {
        const errorText = await ordersResponse.text();
        throw new Error(`Erreur HTTP ${ordersResponse.status}: ${errorText}`);
      }

      const ordersData = await ordersResponse.json();
      setPartnerOrders((prev) => ({ ...prev, [partnerId]: ordersData }));

      const analyticsResponse = await fetch(`${API_URL}/partners/analytics/${partnerId}/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!analyticsResponse.ok) {
        const errorText = await analyticsResponse.text();
        throw new Error(`Erreur HTTP ${analyticsResponse.status}: ${errorText}`);
      }

      const analyticsData = await analyticsResponse.json();
      setRevenueEvolution(analyticsData.revenueEvolution?.map(item => ({
        ...item,
        revenue: item.orders * 0.1 // 10% de 1 DT par commande
      })) || []);
      setMonthlyOrders(analyticsData.monthlyOrders || []);
      setRevenueDistribution({
        distribution: analyticsData.revenueDistribution?.distribution?.map(item => ({
          ...item,
          revenue: item.orders * 0.1 // 10% de 1 DT par commande
        })) || [],
        totalRevenue: analyticsData.revenueDistribution?.totalOrders * 0.1 || 0
      });
      setTopPerformers(analyticsData.topPerformers?.map(performer => ({
        ...performer,
        revenue: performer.totalOrders * 0.1 // 10% de 1 DT par commande
      })) || []);
    } catch (err) {
      setError(`Erreur lors de la récupération des données du partenaire: ${err.message}`);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setOrderFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 0,
    }));
  };

  const handlePageChange = (newPage) => {
    setOrderFilters((prev) => ({ ...prev, page: newPage }));
  };

  const togglePartner = (partnerId) => {
    const newExpanded = expandedPartner === partnerId ? null : partnerId;
    setExpandedPartner(newExpanded);
    if (newExpanded) {
      fetchPartnerData(newExpanded);
    }
  };

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      search === "" ||
      partner.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      partner.email?.toLowerCase().includes(search.toLowerCase()) ||
      partner.phoneNumber?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalPartners = partners.length;
  const totalCommission = Object.values(partnerStats).reduce((sum, stats) => sum + (stats.partnerRevenue || 0), 0);

  const renderSimpleChart = (data, type = "bar") => {
    if (!data || data.length === 0) {
      return <p className="text-gray-500 text-center p-4">Aucune donnée disponible</p>;
    }

    const maxValue = Math.max(...data.map(item => item.value || item.revenue || item.orders || 0));

    return (
      <div className="space-y-2">
        {data.map((item, index) => {
          const value = item.value || item.revenue || item.orders || 0;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const label = item.label || `${item.month}/${item.year}` || item.supplierName || `Item ${index + 1}`;
          
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="w-24 text-xs text-gray-600 truncate">{label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div 
                  className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="w-20 text-xs text-right font-medium">
                {typeof value === 'number' ? value.toFixed(2) : value}
                {item.revenue !== undefined ? ' DT' : ''}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="w-full flex flex-col items-center px-8 py-10 min-h-screen space-y-8">
      <div className="w-full max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold text-[#1E3A8A] tracking-tight flex items-center gap-3">
            <FaHandshake size={36} />
            Partenaires & Statistiques
          </h1>
          <Link
            to="/home"
            className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300"
          >
            <FaHouse size={28} />
          </Link>
        </div>



        {!isFetching && (
          <div className="w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-4">Résumé Global</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1E3A8A]/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">Total Partenaires</h3>
                <p className="text-3xl font-bold text-[#D4AF37]">{totalPartners}</p>
              </div>
              <div className="bg-[#3B82F6]/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">Total Commissions (10%)</h3>
                <p className="text-3xl font-bold text-[#3B82F6]">{totalCommission.toFixed(2)} DT</p>
              </div>
              <div className="bg-[#10B981]/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">Fournisseurs Actifs</h3>
                <p className="text-3xl font-bold text-[#10B981]">
                  {Object.values(partnerStats).reduce((sum, stats) => sum + (stats.activeSuppliers || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="w-full flex space-x-4 mb-8">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou numéro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-1/3 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
          />
        </section>

        {expandedPartner && (revenueEvolution.length > 0 || monthlyOrders.length > 0 || revenueDistribution.distribution.length > 0) && (
          <div className="w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-4 flex items-center gap-2">
              <FaChartLine size={24} />
              Analyses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {revenueEvolution.length > 0 && (
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Évolution des Revenus</h3>
                  {renderSimpleChart(revenueEvolution.map(item => ({
                    label: `${item.month}/${item.year}`,
                    value: item.revenue
                  })))}
                </div>
              )}
              {monthlyOrders.length > 0 && (
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Volume des Commandes</h3>
                  {renderSimpleChart(monthlyOrders.map(item => ({
                    label: `${item.month}/${item.year}`,
                    value: item.orders
                  })))}
                </div>
              )}
              {revenueDistribution.distribution.length > 0 && (
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Distribution des Revenus</h3>
                  {renderSimpleChart(revenueDistribution.distribution.map(item => ({
                    label: item.supplierName,
                    value: item.revenue
                  })))}
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    Total: {revenueDistribution.totalRevenue.toFixed(2)} DT
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isFetching ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : filteredPartners.length === 0 ? (
          <p className="text-gray-500 text-center">Aucun partenaire trouvé</p>
        ) : (
          <ul className="w-full space-y-6">
            {filteredPartners.map((partner) => {
              const stats = partnerStats[partner.id] || {};
              const orders = partnerOrders[partner.id]?.content || [];
              const totalPages = partnerOrders[partner.id]?.totalPages || 1;

              return (
                <li
                  key={partner.id}
                  className="p-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold text-[#1E3A8A]">{partner.companyName || "N/A"}</h3>
                      <p className="text-sm text-gray-600">Email: {partner.email || "N/A"}</p>
                      <p className="text-sm text-gray-600">Téléphone: {partner.phoneNumber || "N/A"}</p>
                      <p className="text-sm text-gray-600">Adresse: {partner.address || "N/A"}</p>
                      <p className="text-sm text-gray-600">
                        Dernière connexion: {partner.lastLogin ? new Date(partner.lastLogin).toLocaleString() : "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() => togglePartner(partner.id)}
                      className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300 px-4 py-2 border border-[#1E3A8A] rounded-lg hover:bg-[#1E3A8A] hover:text-white"
                    >
                      {expandedPartner === partner.id ? "Masquer" : "Afficher"} Détails
                    </button>
                  </div>
                  <div className="flex gap-4 mb-4">
                    <div className="bg-[#D4AF37]/10 p-3 rounded-lg flex items-center gap-2">
                      <FaCartShopping className="text-[#D4AF37]" size={20} />
                      <p className="text-sm font-medium">Total Commandes: {stats.totalOrders || 0}</p>
                    </div>
                    <div className="bg-[#3B82F6]/10 p-3 rounded-lg">
                      <p className="text-sm font-medium">Revenus (10%): {(stats.partnerRevenue || 0).toFixed(2)} DT</p>
                    </div>
                    <div className="bg-[#10B981]/10 p-3 rounded-lg">
                      <p className="text-sm font-medium">Fournisseurs Actifs: {stats.activeSuppliers || 0}</p>
                    </div>
                  </div>
                  {expandedPartner === partner.id && (
                    <div className="mt-4 space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-[#1E3A8A] mb-2">Fournisseurs</h4>
                        {(!partner.suppliers || partner.suppliers.length === 0) ? (
                          <p className="text-gray-500">Aucun fournisseur associé</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#1E3A8A]/10">
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Nom</th>
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Zone</th>
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Statut</th>
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Commandes</th>
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Revenus (10%)</th>
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Probabilité</th>
                                </tr>
                              </thead>
                              <tbody>
                                {partner.suppliers.map((supplier) => {
                                  const performer = topPerformers.find((p) => p.supplierId === supplier.supplier?.id);
                                  return (
                                    <tr key={supplier.supplier?.id || supplier.id} className="border-t border-gray-200">
                                      <td className="p-2">{supplier.supplier?.companyName || "N/A"}</td>
                                      <td className="p-2">
                                        <div className="flex items-center gap-1">
                                          <FaLocationDot className="text-[#D4AF37]" size={14} />
                                          <span className="truncate max-w-[150px]">
                                            {supplier.supplier?.companyAddress || "N/A"}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            supplier.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {supplier.status || "N/A"}
                                        </span>
                                      </td>
                                      <td className="p-2">{performer?.totalOrders || 0}</td>
                                      <td className="p-2">{((performer?.totalOrders || 0) * 0.1).toFixed(2)} DT</td>
                                      <td className="p-2">
                                        <div className="flex items-center gap-1">
                                          <FaPercent className="text-[#10B981]" size={14} />
                                          <span>{(performer?.completionRate || 0).toFixed(1)}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                   

                      <div>
                        <h4 className="text-lg font-semibold text-[#1E3A8A] mb-2 flex items-center gap-2">
                          <FaChartPie size={20} />
                          Top Fournisseurs
                        </h4>
                        {topPerformers.length === 0 ? (
                          <p className="text-gray-500">Aucun top fournisseur</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#1E3A8A]/10">
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Rang</th>
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Nom</th>
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Zone</th>
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Commandes</th>
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Revenus (10%)</th>
                                  <th className="p-2 text-[#1E3A8A] font-semibold">Taux de Complétion</th>
                                </tr>
                              </thead>
                              <tbody>
                                {topPerformers.map((performer, index) => (
                                  <tr key={performer.supplierId || index} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="p-2">
                                      <span className="inline-flex items-center justify-center w-8 h-8 bg-[#D4AF37] text-white rounded-full text-sm font-bold">
                                        {performer.rank || index + 1}
                                      </span>
                                    </td>
                                    <td className="p-2 font-medium">{performer.supplierName || "N/A"}</td>
                                    <td className="p-2">{performer.supplierAddress || performer.companyAddress || "N/A"}</td>
                                    <td className="p-2">{performer.totalOrders || 0}</td>
                                    <td className="p-2 font-semibold text-[#10B981]">{(performer.revenue || 0).toFixed(2)} DT</td>
                                    <td className="p-2">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-[#10B981] h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((performer.completionRate || 0), 100)}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-sm font-medium">
                                          {(performer.completionRate || 0).toFixed(1)}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}