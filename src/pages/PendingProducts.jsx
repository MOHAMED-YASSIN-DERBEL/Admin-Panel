import { useEffect, useState, useMemo, useCallback } from "react";
import { FaPen, FaHouse, FaCheck, FaXmark, FaSquareCheck } from "react-icons/fa6";
import { useNavigate, Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import PaginationControls from "../components/PaginationControls";

const API_URL = import.meta.env.VITE_API_URL;

export default function PendingProducts() {
  const [isFetching, setIsFetching] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const [selectedBarcodes, setSelectedBarcodes] = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      const token = localStorage.getItem("token");
      

      
      if (!token) {
        setError("Token manquant, veuillez vous reconnecter");
        setIsFetching(false);
        return;
      }

      const fullUrl = `${API_URL}/product/products/pending?page=${currentPage - 1}&size=${itemsPerPage}&status=pending`;
   
      try {
        
        const apiRes = await fetch(fullUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          
        });


        if (!apiRes.ok) {
          const errorText = await apiRes.text();
          console.log("Error response body:", errorText);
          throw new Error(`Erreur HTTP ${apiRes.status}: ${errorText}`);
        }

        const data = await apiRes.json();
  
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 1);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        
        // Vérifier si c'est un problème de réseau
        if (err instanceof TypeError && err.message.includes("fetch")) {
          setError("Erreur de connexion au serveur. Vérifiez que le backend est démarré sur " + API_URL);
        } else {
          setError(`Erreur lors de la récupération des produits: ${err.message}`);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [currentPage, itemsPerPage, refreshKey]);

  const filteredProducts = useMemo(() => {
    if (search === "") return products;
    const searchLower = search.toLowerCase();
    return products.filter(
      (product) =>
        product.barcode.toString().includes(search) ||
        product.name?.toLowerCase().includes(searchLower)
    );
  }, [products, search]);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const toggleSelect = useCallback((barcode) => {
    setSelectedBarcodes((prev) => {
      const next = new Set(prev);
      if (next.has(barcode)) {
        next.delete(barcode);
      } else {
        next.add(barcode);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedBarcodes((prev) => {
      if (prev.size === filteredProducts.length) return new Set();
      return new Set(filteredProducts.map((p) => p.barcode));
    });
  }, [filteredProducts]);

  const clearSelection = useCallback(() => {
    setSelectedBarcodes(new Set());
  }, []);

  const handleBulkAction = useCallback(async (status) => {
    if (selectedBarcodes.size === 0) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Token manquant, veuillez vous reconnecter");
      return;
    }

    setIsBulkProcessing(true);
    setError(null);

    const selected = products.filter((p) => selectedBarcodes.has(p.barcode));
    const results = { success: 0, failed: 0 };

    for (const product of selected) {
      try {
        const res = await fetch(`${API_URL}/product/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...product, status }),
        });
        if (res.ok) {
          results.success++;
        } else {
          results.failed++;
        }
      } catch {
        results.failed++;
      }
    }

    setSelectedBarcodes(new Set());
    setIsBulkProcessing(false);

    if (results.failed > 0) {
      setError(`${results.success} produit(s) traité(s), ${results.failed} échoué(s)`);
    }

    // Re-fetch to get accurate server state
    setRefreshKey((k) => k + 1);
  }, [selectedBarcodes, products]);

  const allSelected = filteredProducts.length > 0 && selectedBarcodes.size === filteredProducts.length;

  return (
    <main className="w-full flex flex-col items-center px-4 lg:px-8 py-6 pt-20 lg:pt-6 min-h-screen space-y-6">
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold text-[#1E3A8A] tracking-tight">
            Produits en attente
          </h1>
          <Link
            to="/home"
            className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300"
          >
            <FaHouse size={28} />
          </Link>
        </div>

        <section className="w-full flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="🔍 Rechercher par code-barres ou nom..."
            className="flex-1 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
            onChange={handleSearchChange}
            value={search}
          />
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="bg-[#1E3A8A]/10 px-4 py-2 rounded-lg whitespace-nowrap">
              {filteredProducts.length} produit(s) trouvé(s)
            </span>
          </div>
        </section>

        {/* Bulk action bar */}
        {selectedBarcodes.size > 0 && (
          <div className="w-full flex flex-col sm:flex-row items-center gap-3 p-4 mb-6 bg-[#1E3A8A]/5 border border-[#1E3A8A]/20 rounded-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-[#1E3A8A]">
              <FaSquareCheck size={18} />
              <span>{selectedBarcodes.size} produit(s) sélectionné(s)</span>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <button
                onClick={() => handleBulkAction("approved")}
                disabled={isBulkProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCheck size={14} />
                {isBulkProcessing ? "Traitement..." : "Approuver"}
              </button>
              <button
                onClick={() => handleBulkAction("rejected")}
                disabled={isBulkProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaXmark size={14} />
                {isBulkProcessing ? "Traitement..." : "Rejeter"}
              </button>
              <button
                onClick={clearSelection}
                disabled={isBulkProcessing}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

 

        {isFetching ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-gray-500 text-center">Aucun produit en attente trouvé</p>
        ) : (
          <div className="w-full">
            {/* Select all header */}
            <div className="flex items-center gap-3 mb-4 px-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#D4AF37] cursor-pointer accent-[#1E3A8A]"
              />
              <span className="text-sm font-medium text-gray-600">
                {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </span>
            </div>
            <ul className="w-full space-y-6">
            {filteredProducts.map((product) => (
              <li
                key={product.barcode}
                className={`p-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border ${
                  selectedBarcodes.has(product.barcode)
                    ? "border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20"
                    : "border-gray-100"
                }`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedBarcodes.has(product.barcode)}
                      onChange={() => toggleSelect(product.barcode)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#D4AF37] cursor-pointer accent-[#1E3A8A] flex-shrink-0"
                    />
                    <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-semibold text-[#1E3A8A]">
                        {product.name || product.barcode}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-medium">
                        En attente
                      </span>
                      <span className="font-medium text-gray-700">
                        Catégorie: {product.category || "N/A"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Description: {product.description || "Aucune description"}
                    </div>
                    {product.image && (
                      <div className="mt-4">
                        <img
                          src={product.image}
                          alt={product.name || product.barcode}
                          loading="lazy"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  </div>
                  <button
                    onClick={() =>
                      navigate(`/edit-product-pending/${product.barcode}`)
                    }
                    className="text-[#1E3A8A] hover:text-[#D4AF37] transition-all duration-300 flex-shrink-0"
                    title="Modifier le produit"
                  >
                    <FaPen size={24} />
                  </button>
                </div>
              </li>
            ))}
            </ul>
          </div>
        )}

        <div className="mt-10">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            setCurrentPage={setCurrentPage}
            setItemsPerPage={setItemsPerPage}
          />
        </div>
      </div>
    </main>
  );
}