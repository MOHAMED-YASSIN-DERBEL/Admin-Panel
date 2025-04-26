import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Spinner from "../components/Spinner";
import { FaBox, FaHouse } from "react-icons/fa6";

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("Fetching Products from:", `${API_URL}/product/find/all/`);
        const productsResponse = await axios.get(`${API_URL}/product/find/all/`);
        const fetchedProducts = productsResponse.data || [];
        setProducts(fetchedProducts);
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
            : `Erreur lors de la récupération des produits: ${error.message}`
        );
        setIsFetching(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = [
    "All",
    ...new Set(
      products
        .map((product) => product.category)
        .filter((category) => category)
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      search === "" ||
      (product.barcode &&
        product.barcode.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      filterCategory === "All" ||
      (product.category && product.category === filterCategory);

    return matchesSearch && matchesCategory;
  });

  const totalProducts = products.length;

  const categoryCounts = categories
    .filter((category) => category !== "All")
    .map((category) => ({
      category,
      count: products.filter((p) => p.category === category).length,
    }));

  const categoryStats = categoryCounts.map((cat) => ({
    ...cat,
    percentage: totalProducts > 0 ? (cat.count / totalProducts) * 100 : 0,
  }));

  const categoryColors = ["#3B82F6", "#D4AF37", "#EF4444", "#10B981", "#8B5CF6", "#F97316"];

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let startAngle = -90;

  const segments = categoryStats.map((stat, index) => {
    const percentage = stat.percentage;
    const sweepAngle = (percentage / 100) * 360;
    const startX = 60 + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = 60 + radius * Math.sin((startAngle * Math.PI) / 180);
    const endAngle = startAngle + sweepAngle;
    const endX = 60 + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = 60 + radius * Math.sin((endAngle * Math.PI) / 180);
    const largeArcFlag = sweepAngle > 180 ? 1 : 0;

    const pathD = `
      M 60,60
      L ${startX},${startY}
      A ${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY}
      Z
    `;

    startAngle = endAngle;

    return {
      pathD,
      color: categoryColors[index % categoryColors.length],
      category: stat.category,
      count: stat.count,
      percentage: stat.percentage,
    };
  });

  // Modal Handlers
  const openModal = (type) => {
    setModalType(type);
    setFormData({
      barcode: "",
      name: "",
      description: "",
      category: type === "byWeight" ? "Produit au poids" : "",
      image: "",
      status: "approved",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setFormError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (modalType === "byWeight" && name === "barcode") {
      setFormData((prev) => ({
        ...prev,
        barcode: value,
        name: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Validate required fields
  const isFormValid = () => {
    const requiredFields = modalType === "regular"
      ? formData.barcode && formData.name && formData.category && formData.image
      : formData.barcode && formData.image; // For "Produit au poids", name is set to barcode, category is fixed
    return requiredFields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setFormError("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/api/product/`, formData);
      if (response.status === 201) {
        const productsResponse = await axios.get(`${API_URL}/product/find/all/`);
        setProducts(productsResponse.data || []);
        closeModal();
      }
    } catch (error) {
      console.error("Create Product Error:", error);
      if (error.response?.status === 409) {
        setFormError("Ce code-barres existe déjà.");
      } else if (error.response?.status === 500) {
        setFormError("Veuillez remplir tous les champs obligatoires (*).");
      } else {
        setFormError("Erreur lors de la création du produit.");
      }
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
          <Link to="/" className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300">
            <FaHouse size={28} />
          </Link>
        </div>

        {isFetching ? null : (
          <div className="flex flex-col items-center mb-12">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                {segments.map((segment, index) => (
                  <path
                    key={index}
                    d={segment.pathD}
                    fill={segment.color}
                    stroke="#fff"
                    strokeWidth="1"
                  />
                ))}
                <circle
                  cx="60"
                  cy="60"
                  r={radius - 12}
                  fill="#fff"
                />
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
            <p className="mt-2 text-lg font-medium text-[#1E3A8A]">
              Total Produits
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
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
                {formError && (
                  <p className="text-red-500 text-sm">{formError}</p>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 transition-all duration-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={(e) => handleSubmit(e)}
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