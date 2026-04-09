import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaBox, FaHouse, FaPlus } from "react-icons/fa6";
import Spinner from "../components/Spinner";

const API_URL = import.meta.env.VITE_API_URL;

export default function Products() {
  const [isFetching, setIsFetching] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    description: "",
    category: "",
    image: "",
    status: "approved",
  });
  const [formError, setFormError] = useState(null);

  const token = localStorage.getItem("token");

  // Catégories disponibles
  const categories = useMemo(() => 
    ["All", "Produit au poids", "Électronique", "Vêtements", "Alimentaire"],
    []
  );

  // Calcul optimisé des segments pour le graphique circulaire
  const totalProducts = products.length;
  const radius = 50;
  const segments = useMemo(() => {
    const categoryCounts = categories
      .filter((cat) => cat !== "All")
      .map((category) => ({
        category,
        count: products.filter((p) => p.category === category).length,
      }));

    return categoryCounts.map((cat, index) => {
      const percentage = totalProducts > 0 ? (cat.count / totalProducts) * 100 : 0;
      const startAngle = index === 0 ? 0 : categoryCounts
        .slice(0, index)
        .reduce((sum, c) => sum + (c.count / totalProducts) * 360, 0);
      const endAngle = startAngle + (cat.count / totalProducts) * 360;
      const pathD = `M60,60 L60,10 A50,50 0 ${endAngle - startAngle > 180 ? 1 : 0},1 ${
        60 + 50 * Math.cos((endAngle * Math.PI) / 180)
      },${60 + 50 * Math.sin((endAngle * Math.PI) / 180)} A50,50 0 ${
        endAngle - startAngle > 180 ? 1 : 0
      },0 60,60`;
      return {
        category: cat.category,
        count: cat.count,
        percentage,
        pathD,
        color: ["#3B82F6", "#D4AF37", "#10B981", "#EF4444"][index % 4],
      };
    });
  }, [products, categories]);

  // Filtrage optimisé des produits
  const filteredProducts = useMemo(() => {
    if (search === "" && filterCategory === "All") return products;
    
    return products.filter((product) => {
      const matchesSearch = search === "" || 
        product.barcode?.toLowerCase().includes(search.toLowerCase()) ||
        product.name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === "All" || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, filterCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsFetching(true);

      if (!token) {
        setError("Token manquant, veuillez vous reconnecter");
        setIsFetching(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/product/find/all/`, {
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

        const fetchedProducts = await response.json();
        setProducts(fetchedProducts || []);
        setError(null);
      } catch (err) {
        if (err instanceof TypeError && err.message.includes("fetch")) {
          setError("Erreur de connexion au serveur. Vérifiez que le backend est démarré sur " + API_URL);
        } else if (err.message.includes("401")) {
          setError("Non autorisé (401). Vérifiez votre token.");
        } else if (err.message.includes("404")) {
          setError("Endpoint non trouvé (404).");
        } else {
          setError(`Erreur lors de la récupération des produits: ${err.message}`);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchProducts();
  }, [token]);

  const isFormValid = useMemo(() => {
    return (
      formData.barcode.trim() !== "" &&
      (modalType === "regular" ? formData.name.trim() !== "" : true) &&
      formData.category.trim() !== "" &&
      formData.image.trim() !== ""
    );
  }, [formData, modalType]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      category: modalType === "byWeight" ? "Produit au poids" : prev.category,
    }));
    setFormError(null);
  }, [modalType]);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setFilterCategory(e.target.value);
  }, []);

  const openModal = useCallback((type) => {
    setModalType(type);
    setIsModalOpen(true);
    setFormData({
      barcode: "",
      name: "",
      description: "",
      category: type === "byWeight" ? "Produit au poids" : "",
      image: "",
      status: "approved",
    });
    setFormError(null);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalType(null);
    setFormData({
      barcode: "",
      name: "",
      description: "",
      category: "",
      image: "",
      status: "approved",
    });
    setFormError(null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setFormError("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/product/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      // Rafraîchir la liste des produits
      const productsResponse = await fetch(`${API_URL}/product/find/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!productsResponse.ok) {
        const errorText = await productsResponse.text();
        throw new Error(`Erreur HTTP ${productsResponse.status}: ${errorText}`);
      }

      const fetchedProducts = await productsResponse.json();
      setProducts(fetchedProducts || []);
      closeModal();
    } catch (err) {
      if (err.message.includes("409")) {
        setFormError("Ce code-barres existe déjà.");
      } else if (err.message.includes("500")) {
        setFormError("Veuillez remplir tous les champs obligatoires (*).");
      } else if (err.message.includes("401")) {
        setFormError("Non autorisé (401). Vérifiez votre token.");
      } else {
        setFormError(`Erreur lors de la création du produit: ${err.message}`);
      }
    }
  }, [formData, isFormValid, token, closeModal]);
  return (
    <main className="p-4 sm:p-6 pt-20 lg:pt-6 min-h-screen space-y-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold text-[#1E3A8A] tracking-tight flex items-center gap-3">
            <FaBox size={36} />
            Produits
          </h1>
          <Link to="/home" className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300">
            <FaHouse size={28} />
          </Link>
        </div>

     
        {isFetching ? null : (
          <div className="flex flex-col items-center mb-12">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
                {segments.map((segment, index) => (
                  <path
                    key={index}
                    d={segment.pathD}
                    fill={segment.color}
                    stroke="#fff"
                    strokeWidth="1"
                  />
                ))}
                <circle cx="60" cy="60" r={radius - 12} fill="#fff" />
                <text
                  x="60"
                  y="60"
                  textAnchor="middle"
                  dy=".3em"
                  className="text-lg font-semibold text-[#1E3A8A]"
                >
                  {totalProducts}
                </text>
              </svg>
            </div>
            <p className="mt-2 text-lg font-medium text-[#1E3A8A]">Total Produits</p>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="text-sm text-[#1E3A8A]">
                    {segment.category}: {segment.count} ({segment.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="w-full flex flex-wrap gap-4 mb-8">
          <input
            type="text"
            placeholder="🔍 Rechercher par code-barres ou nom..."
            value={search}
            onChange={handleSearchChange}
            className="flex-1 min-w-[250px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
          />
          <select
            value={filterCategory}
            onChange={handleCategoryChange}
            className="w-48 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button
            onClick={() => openModal("regular")}
            className="px-6 py-3 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white rounded-xl hover:from-[#3B82F6] hover:to-[#1E3A8A] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <FaPlus /> Produit
          </button>
          <button
            onClick={() => openModal("byWeight")}
            className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-white rounded-xl hover:from-[#F59E0B] hover:to-[#D4AF37] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <FaPlus /> Produit Poids
          </button>
        </section>
        
        {!isFetching && (
          <div className="mb-6 flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-sm">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-[#1E3A8A]">{filteredProducts.length}</span> produit(s) affiché(s)
              {search || filterCategory !== "All" ? ` sur ${products.length} total` : ""}
            </span>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-gray-100 shadow-xl">
              <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-6">
                {modalType === "byWeight" ? "Ajouter Produit au Poids" : "Ajouter Produit"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E3A8A] mb-1">
                    Code-barres *
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50"
                    required
                  />
                </div>
                {modalType === "regular" && (
                  <div>
                    <label className="block text-sm font-medium text-[#1E3A8A] mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[#1E3A8A] mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E3A8A] mb-1">
                    Catégorie *
                  </label>
                  {modalType === "byWeight" ? (
                    <input
                      type="text"
                      value="Produit au poids"
                      disabled
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600"
                    />
                  ) : (
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50"
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories
                        .filter((cat) => cat !== "All" && cat !== "Produit au poids")
                        .map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E3A8A] mb-1">
                    Image URL *
                  </label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50"
                    required
                  />
                </div>
                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 transition-all duration-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                      isFormValid
                        ? "bg-[#1E3A8A] text-white hover:bg-[#D4AF37]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
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
          <p className="text-gray-500 text-center">Aucun produit trouvé</p>
        ) : (
          <div className="w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#1E3A8A]/10">
                  <th className="p-4 text-[#1E3A8A] font-semibold">Image</th>
                  <th className="p-4 text-[#1E3A8A] font-semibold">Nom</th>
                  <th className="p-4 text-[#1E3A8A] font-semibold">Code-barres</th>
                  <th className="p-4 text-[#1E3A8A] font-semibold">Statut</th>
                  <th className="p-4 text-[#1E3A8A] font-semibold">Catégorie</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-gray-200 hover:bg-[#D4AF37]/10 transition-all duration-300"
                  >
                    <td className="p-4">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name || "Produit"}
                          loading="lazy"
                          className="w-14 h-14 object-cover rounded-lg shadow-sm hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56"%3E%3Crect fill="%23f3f4f6" width="56" height="56"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="10" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ENo Img%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-gray-800">{product.name || "N/A"}</td>
                    <td className="p-4 text-gray-800">{product.barcode || "N/A"}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.status === "In Stock"
                            ? "bg-[#10B981]/20 text-[#10B981]"
                            : product.status === "Out of Stock"
                            ? "bg-[#EF4444]/20 text-[#EF4444]"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {product.status || "N/A"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-800">{product.category || "N/A"}</td>
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