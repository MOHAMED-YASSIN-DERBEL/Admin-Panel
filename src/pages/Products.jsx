import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBox, FaHouse } from "react-icons/fa6";
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

  // Supposons une liste de catégories (à ajuster selon ton backend)
  const categories = ["All", "Produit au poids", "Électronique", "Vêtements", "Alimentaire"];

  // Calcul des segments pour le graphique circulaire
  const radius = 50;
  const totalProducts = products.length;
  const categoryCounts = categories
    .filter((cat) => cat !== "All")
    .map((category) => ({
      category,
      count: products.filter((p) => p.category === category).length,
    }));
  const segments = categoryCounts.map((cat, index) => {
    const percentage = totalProducts > 0 ? (cat.count / totalProducts) * 100 : 0;
    const startAngle = index === 0 ? 0 : categoryCounts.slice(0, index).reduce((sum, c) => sum + (c.count / totalProducts) * 360, 0);
    const endAngle = startAngle + (cat.count / totalProducts) * 360;
    const pathD = `M60,60 L60,10 A50,50 0 ${endAngle - startAngle > 180 ? 1 : 0},1 ${
      60 + radius * Math.cos((endAngle * Math.PI) / 180)
    },${60 + radius * Math.sin((endAngle * Math.PI) / 180)} A50,50 0 ${
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

  // Filtrage des produits
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      search === "" || product.barcode?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "All" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setIsFetching(true);


      if (!token) {
        setError("Token manquant, veuillez vous reconnecter");
        setIsFetching(false);
        console.log("=== END DEBUG ===");
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

        console.log("Response received:");
        console.log("Status:", response.status);
        console.log("Status OK:", response.ok);
        console.log("Headers:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.log("Error response body:", errorText);
          throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }

        const fetchedProducts = await response.json();
        console.log("Response data:", fetchedProducts);
        setProducts(fetchedProducts || []);
        setError(null);
      } catch (err) {
        console.error("=== FETCH ERROR DETAILS ===");
        console.error("Error type:", err.constructor.name);
        console.error("Error message:", err.message);
        console.error("Full error:", err);
        console.error("Is network error:", err instanceof TypeError && err.message.includes("fetch"));

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
        console.log("=== END DEBUG ===");
      }
    };

    fetchProducts();
  }, [token]);

  const isFormValid = () => {
    return (
      formData.barcode.trim() !== "" &&
      (modalType === "regular" ? formData.name.trim() !== "" : true) &&
      formData.category.trim() !== "" &&
      formData.image.trim() !== ""
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      category: modalType === "byWeight" ? "Produit au poids" : prev.category,
    }));
    setFormError(null);
  };

  const openModal = (type) => {
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
  };

  const closeModal = () => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
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
        console.log("Error response body:", errorText);
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
      console.log("Refreshed products:", fetchedProducts);
      setProducts(fetchedProducts || []);
      closeModal();
    } catch (err) {
      console.error("=== FETCH ERROR DETAILS ===");
      console.error("Error type:", err.constructor.name);
      console.error("Error message:", err.message);
      console.error("Full error:", err);

      if (err.message.includes("409")) {
        setFormError("Ce code-barres existe déjà.");
      } else if (err.message.includes("500")) {
        setFormError("Veuillez remplir tous les champs obligatoires (*).");
      } else if (err.message.includes("401")) {
        setFormError("Non autorisé (401). Vérifiez votre token.");
      } else {
        setFormError(`Erreur lors de la création du produit: ${err.message}`);
      }
    } finally {
      console.log("=== END DEBUG ===");
    }
  };

  return (
    <main className="ml-64 p-8 min-h-screen space-y-8">
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

        <section className="w-full flex space-x-4 mb-8">
          <input
            type="text"
            placeholder="Rechercher par code-barres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-1/3 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-1/4 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button
            onClick={() => openModal("regular")}
            className="px-4 py-2 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#D4AF37] transition-all duration-300"
          >
            Ajouter Produit
          </button>
          <button
            onClick={() => openModal("byWeight")}
            className="px-4 py-2 bg-[#3B82F6] text-white rounded-xl hover:bg-[#D4AF37] transition-all duration-300"
          >
            Ajouter Produit au Poids
          </button>
        </section>

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
                    disabled={!isFormValid()}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                      isFormValid()
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
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/48?text=N/A")}
                        />
                      ) : (
                        <img
                          src="https://via.placeholder.com/48?text=N/A"
                          alt="Placeholder"
                          className="w-12 h-12 object-cover rounded-lg"
                        />
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