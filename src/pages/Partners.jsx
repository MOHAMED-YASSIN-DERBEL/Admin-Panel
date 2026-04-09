import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  FaHandshake, 
  FaHome,
  FaSearch,
  FaChartLine,
  FaTrophy,
  FaStore,
  FaEuroSign,
  FaEye,
  FaTimes,
  FaPercent,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaMoneyBillWave
} from "react-icons/fa";
import Spinner from "../components/Spinner";

const API_URL = import.meta.env.VITE_API_URL;

export default function Partners() {
  const [isFetching, setIsFetching] = useState(true);
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerDetails, setPartnerDetails] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [createForm, setCreateForm] = useState({
    companyName: "",
    email: "",
    phoneNumber: "",
    address: "",
    password: ""
  });
  const [createError, setCreateError] = useState(null);
  const [expandedRevenue, setExpandedRevenue] = useState({});

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPartners();
  }, [currentMonth]);

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

      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

      const fetchedPartners = await response.json();
      setPartners(fetchedPartners || []);
      
      await Promise.all(
        fetchedPartners.map(partner => fetchPartnerStatistics(partner.id, currentMonth))
      );
      
      setError(null);
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchPartnerStatistics = async (partnerId, month) => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/partners/orders/${partnerId}/statistics?month=${month}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/partners/analytics/${partnerId}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!statsRes.ok) throw new Error(`Erreur stats HTTP ${statsRes.status}`);
      if (!analyticsRes.ok) throw new Error(`Erreur analytics HTTP ${analyticsRes.status}`);

      const stats = await statsRes.json();
      const analytics = await analyticsRes.json();
        
      setPartnerDetails(prev => ({
        ...prev,
        [partnerId]: {
          stats,
          analytics
        }
      }));
    } catch (err) {
      console.error("Erreur stats:", err);
      setPartnerDetails(prev => ({
        ...prev,
        [partnerId]: {
          ...prev[partnerId],
          error: err.message
        }
      }));
    }
  };

  const openPartnerModal = async (partner) => {
    setSelectedPartner(partner);
    setShowModal(true);
    if (!partnerDetails[partner.id]?.suppliers) {
      await fetchPartnerSuppliers(partner.id, currentMonth);
    }
  };

  const fetchPartnerSuppliers = async (partnerId, month) => {
    try {
      const response = await fetch(`${API_URL}/partners/get-suppliers/${partnerId}?page=0&size=100&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

      const data = await response.json();
      setPartnerDetails(prev => ({
        ...prev,
        [partnerId]: {
          ...prev[partnerId],
          suppliers: data.content || []
        }
      }));
    } catch (err) {
      console.error("Erreur suppliers:", err);
      setPartnerDetails(prev => ({
        ...prev,
        [partnerId]: {
          ...prev[partnerId],
          suppliersError: err.message
        }
      }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);

    try {
      const response = await fetch(`${API_URL}/auth/partner/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }

      const newPartner = await response.json();
      setPartners(prev => [...prev, newPartner.partner]);
      setShowCreateModal(false);
      setCreateForm({
        companyName: "",
        email: "",
        phoneNumber: "",
        address: "",
        password: ""
      });
      await fetchPartnerStatistics(newPartner.partner.id, currentMonth);
    } catch (err) {
      setCreateError(`Erreur: ${err.message}`);
    }
  };

  const filteredPartners = useMemo(() => partners.filter((partner) => {
    const matchesSearch =
      search === "" ||
      partner.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      partner.email?.toLowerCase().includes(search.toLowerCase()) ||
      partner.phoneNumber?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  }), [partners, search]);

  const totalCommission = useMemo(() => Object.values(partnerDetails).reduce(
    (sum, detail) => sum + (detail?.stats?.partnerRevenue || 0), 
    0
  ), [partnerDetails]);

  const totalOrders = useMemo(() => Object.values(partnerDetails).reduce(
    (sum, detail) => sum + (detail?.stats?.completedOrders || 0) + (detail?.stats?.deliveredOrders || 0), 
    0
  ), [partnerDetails]);

  const activeSuppliers = useMemo(() => Object.values(partnerDetails).reduce(
    (sum, detail) => sum + (detail?.stats?.activeSuppliers || 0), 
    0
  ), [partnerDetails]);

  const hanoutikRevenue = useMemo(() => totalOrders * 1, [totalOrders]);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const handleMonthChange = useCallback((e) => {
    setCurrentMonth(e.target.value);
  }, []);

  const toggleRevenue = useCallback((partnerId) => {
    setExpandedRevenue((prev) => ({ ...prev, [partnerId]: !prev[partnerId] }));
  }, []);

  return (
    <main className="pt-20 lg:pt-6 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-2xl shadow-lg">
              <FaHandshake className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Partenaires</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600">Suivi des commissions et performances</p>
                <input
                  type="month"
                  value={currentMonth}
                  onChange={handleMonthChange}
                  className="border border-gray-200 rounded-xl px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <FaPlus />
              Créer un Partenaire
            </button>
            <Link
              to="/home"
              className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <FaHome size={24} />
            </Link>
          </div>
        </div>

        {/* Global Statistics Cards */}
        {!isFetching && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Partenaires</p>
                  <p className="text-3xl font-bold text-gray-900">{partners.length}</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-xl">
                  <FaHandshake className="text-blue-600 text-2xl" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Commissions Totales</p>
                  <p className="text-3xl font-bold text-green-600">{totalCommission.toFixed(2)} DT</p>
                </div>
                <div className="bg-green-100 p-4 rounded-xl">
                  <FaEuroSign className="text-green-600 text-2xl" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Commandes</p>
                  <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-xl">
                  <FaChartLine className="text-purple-600 text-2xl" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Revenu Hanoutik</p>
                  <p className="text-3xl font-bold text-amber-600">{hanoutikRevenue.toFixed(2)} DT</p>
                  <p className="text-xs text-gray-500 mt-1">1 DT × {totalOrders} commandes</p>
                </div>
                <div className="bg-amber-100 p-4 rounded-xl">
                  <FaMoneyBillWave className="text-amber-600 text-2xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Partners List */}
        {isFetching ? (
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <Spinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
            {error}
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
            Aucun partenaire trouvé
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredPartners.map((partner) => {
              const details = partnerDetails[partner.id];
              const stats = details?.stats || {};
              const analytics = details?.analytics || {};
              const topPerformers = analytics.topPerformers || [];
              const bestSupplier = topPerformers[0];

              return (
                <div
                  key={partner.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                          <FaHandshake className="text-white text-2xl" />
                        </div>
                        <div className="text-white">
                          <h3 className="text-xl font-bold">{partner.companyName || "N/A"}</h3>
                          <p className="text-blue-100 text-sm">{partner.email || "N/A"}</p>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-green-500 p-2 rounded-lg">
                            <FaEuroSign className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Commission Totale</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{(stats.partnerRevenue || 0).toFixed(2)} DT</p>
                        <p className="text-xs text-green-600 mt-1">Moyenne: {(stats.suppliers?.reduce((sum, s) => sum + (s.commission || 0), 0) / (stats.suppliers?.length || 1) * 100).toFixed(1)}%</p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-blue-500 p-2 rounded-lg">
                            <FaChartLine className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Commandes</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{(stats.completedOrders || 0) + (stats.deliveredOrders || 0)}</p>
                        <p className="text-xs text-blue-600 mt-1">Complétées ce mois</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-purple-500 p-2 rounded-lg">
                            <FaStore className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Fournisseurs</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">{stats.activeSuppliers || 0}</p>
                        <p className="text-xs text-purple-600 mt-1">Actifs</p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-orange-500 p-2 rounded-lg">
                            <FaTrophy className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Meilleur Fournisseur</span>
                        </div>
                        {bestSupplier ? (
                          <>
                            <p className="text-sm font-bold text-orange-700 truncate">{bestSupplier.supplierName}</p>
                            <p className="text-xs text-orange-600 mt-1">{(bestSupplier.revenue || 0).toFixed(2)} DT</p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">Aucune donnée</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
                      <div>
                        <span className="font-medium">📞 Téléphone:</span> {partner.phoneNumber || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">📍 Adresse:</span> {partner.address || "N/A"}
                      </div>
                    </div>

                    {/* Revenu Hanoutik par Fournisseur */}
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          toggleRevenue(partner.id);
                          if (!partnerDetails[partner.id]?.suppliers) {
                            fetchPartnerSuppliers(partner.id, currentMonth);
                          }
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-500 p-2 rounded-lg shadow-sm">
                            <FaMoneyBillWave className="text-white text-sm" />
                          </div>
                          <span className="font-semibold text-gray-800">Revenu Hanoutik par Fournisseur</span>
                          <span className="text-sm font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg">
                            {((stats.completedOrders || 0) + (stats.deliveredOrders || 0))} DT
                          </span>
                        </div>
                        {expandedRevenue[partner.id]
                          ? <FaChevronUp className="text-gray-500 group-hover:text-amber-600 transition-colors" />
                          : <FaChevronDown className="text-gray-500 group-hover:text-amber-600 transition-colors" />}
                      </button>

                      {expandedRevenue[partner.id] && (
                        <div className="mt-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          {/* Info banner */}
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 flex items-center justify-between">
                            <p className="text-white text-sm font-medium">1 DT prélevé par commande commissionnable</p>
                            <p className="text-white text-lg font-bold">
                              Total: {((stats.completedOrders || 0) + (stats.deliveredOrders || 0)).toFixed(2)} DT
                            </p>
                          </div>

                          {/* Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fournisseur</th>
                                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Commandes</th>
                                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Commissionnables</th>
                                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Fusionnées</th>
                                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenu (1 DT × cmd)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {partnerDetails[partner.id]?.suppliers?.length > 0 ? (
                                  partnerDetails[partner.id].suppliers.map((supplier, idx) => {
                                    const commissionable = supplier.commissionableOrders || supplier.ordersCount || 0;
                                    const merged = supplier.mergedOrders || 0;
                                    const revenue = commissionable * 1;
                                    return (
                                      <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                              {(supplier.supplier?.companyName || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                              <p className="font-medium text-gray-900">{supplier.supplier?.companyName || "N/A"}</p>
                                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                supplier.status === "ACTIVE"
                                                  ? "bg-green-100 text-green-700"
                                                  : "bg-red-100 text-red-700"
                                              }`}>{supplier.status || "—"}</span>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                          <span className="font-semibold text-gray-800">{supplier.ordersCount || 0}</span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {commissionable}
                                          </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            {merged}
                                          </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                          <span className="text-lg font-bold text-amber-600">{revenue.toFixed(2)} DT</span>
                                        </td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                                      {partnerDetails[partner.id]?.suppliersError
                                        ? `Erreur: ${partnerDetails[partner.id].suppliersError}`
                                        : "Chargement des données..."}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                              {partnerDetails[partner.id]?.suppliers?.length > 0 && (
                                <tfoot>
                                  <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-t-2 border-amber-200">
                                    <td className="px-5 py-3 font-bold text-gray-900">Total</td>
                                    <td className="px-5 py-3 text-center font-bold text-gray-900">
                                      {partnerDetails[partner.id].suppliers.reduce((s, sup) => s + (sup.ordersCount || 0), 0)}
                                    </td>
                                    <td className="px-5 py-3 text-center font-bold text-green-700">
                                      {partnerDetails[partner.id].suppliers.reduce((s, sup) => s + (sup.commissionableOrders || sup.ordersCount || 0), 0)}
                                    </td>
                                    <td className="px-5 py-3 text-center font-bold text-orange-700">
                                      {partnerDetails[partner.id].suppliers.reduce((s, sup) => s + (sup.mergedOrders || 0), 0)}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                      <span className="text-xl font-bold text-amber-600">
                                        {partnerDetails[partner.id].suppliers.reduce((s, sup) => s + ((sup.commissionableOrders || sup.ordersCount || 0) * 1), 0).toFixed(2)} DT
                                      </span>
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        {showModal && selectedPartner && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-white">Détails du Partenaire ({currentMonth})</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                >
                  <FaTimes className="text-white text-xl" />
                </button>
              </div>

              <div className="p-6">
                {/* Résumé financier */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                    <p className="text-sm opacity-90 mb-1">💰 Commandes Commissionnables</p>
                    <p className="text-3xl font-bold">{partnerDetails[selectedPartner.id]?.stats?.completedOrders + partnerDetails[selectedPartner.id]?.stats?.deliveredOrders || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Hanoutik: {(partnerDetails[selectedPartner.id]?.stats?.completedOrders + partnerDetails[selectedPartner.id]?.stats?.deliveredOrders || 0)} × 1 DT = {((partnerDetails[selectedPartner.id]?.stats?.completedOrders + partnerDetails[selectedPartner.id]?.stats?.deliveredOrders || 0) * 1.0).toFixed(2)} DT</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                    <p className="text-sm opacity-90 mb-1">🎯 Commission Partenaire</p>
                    <p className="text-3xl font-bold">{(partnerDetails[selectedPartner.id]?.stats?.partnerRevenue || 0).toFixed(2)} DT</p>
                    <p className="text-xs opacity-75 mt-1">Taux moyen: {(partnerDetails[selectedPartner.id]?.stats?.suppliers?.reduce((sum, s) => sum + (s.commission || 0), 0) / (partnerDetails[selectedPartner.id]?.stats?.suppliers?.length || 1) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                    <p className="text-sm opacity-90 mb-1">🔗 Commandes Fusionnées</p>
                    <p className="text-3xl font-bold">{partnerDetails[selectedPartner.id]?.stats?.mergedOrders || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Aucune commission générée</p>
                  </div>
                </div>

                {/* Explication du système de commission */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    ℹ️ Système de Commission
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• <strong>Hanoutik prend 1 DT</strong> par commande (completed/delivered sans fusion)</p>
                    <p>• <strong>Le partenaire gagne un %</strong> de ce 1 DT sur les commandes de ses fournisseurs</p>
                    <p>• <strong>Commandes commissionnables:</strong> statut = <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">completed</span> ou <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">delivered</span> ET mergedTo = null</p>
                    <p>• <strong>Commandes fusionnées:</strong> ne génèrent <span className="text-red-600 font-semibold">PAS de commission</span></p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaPercent className="text-blue-600" />
                    Détail des Commissions par Fournisseur
                    <span className="text-sm font-normal text-gray-500 ml-2">(Base: 1 DT par commande commissionnable)</span>
                  </h3>
                  <div className="bg-gray-50 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left">Fournisseur</th>
                          <th className="px-4 py-3 text-center" title="Total des commandes">Commandes<br/><span className="text-xs font-normal">(Total)</span></th>
                          <th className="px-4 py-3 text-center" title="Commandes completed/delivered sans fusion">💰 Commissionnables<br/><span className="text-xs font-normal">(payables)</span></th>
                          <th className="px-4 py-3 text-center" title="Commandes fusionnées - pas de commission">🔗 Fusionnées<br/><span className="text-xs font-normal">(non payables)</span></th>
                          <th className="px-4 py-3 text-center" title="Taux de commission du partenaire">Taux<br/><span className="text-xs font-normal">(% du 1 DT)</span></th>
                          <th className="px-4 py-3 text-center" title="Commission totale gagnée par le partenaire">Commission<br/><span className="text-xs font-normal">(TND)</span></th>
                          <th className="px-4 py-3 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partnerDetails[selectedPartner.id]?.suppliers?.map((supplier, idx) => (
                          <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-3 font-medium">{supplier.supplier?.companyName || "N/A"}</td>
                            <td className="px-4 py-3 text-center font-semibold">{supplier.ordersCount || 0}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-medium">
                                {supplier.commissionableOrders || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg font-medium">
                                {supplier.mergedOrders || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                                {((supplier.commission || 0) * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-green-600">
                              {supplier.totalCommission !== undefined 
                                ? supplier.totalCommission.toFixed(2) 
                                : ((supplier.commissionableOrders || supplier.ordersCount || 0) * 1.0 * (supplier.commission || 0)).toFixed(2)} DT
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                supplier.status === "ACTIVE" 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {supplier.status}
                              </span>
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                              Aucune donnée disponible {partnerDetails[selectedPartner.id]?.suppliersError ? `(Erreur: ${partnerDetails[selectedPartner.id].suppliersError})` : ""}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {partnerDetails[selectedPartner.id]?.analytics?.topPerformers?.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaTrophy className="text-orange-500" />
                      Top Fournisseurs Performance
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {partnerDetails[selectedPartner.id].analytics.topPerformers.slice(0, 5).map((performer, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{performer.supplierName}</p>
                                <p className="text-sm text-gray-600">{performer.totalOrders} commandes</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">{(performer.revenue || 0).toFixed(2)} DT</p>
                              <p className="text-sm text-gray-600">Taux: {(performer.commission || 0) * 100}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Partner Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-white">Créer un Nouveau Partenaire</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                >
                  <FaTimes className="text-white text-xl" />
                </button>
              </div>

              <div className="p-6">
                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700">
                    {createError}
                  </div>
                )}
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
                    <input
                      type="text"
                      value={createForm.companyName}
                      onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Numéro de téléphone</label>
                    <input
                      type="tel"
                      value={createForm.phoneNumber}
                      onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adresse</label>
                    <input
                      type="text"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
                    >
                      Créer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}