import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import { FaHouse } from "react-icons/fa6";

const API_URL = import.meta.env.VITE_API_URL;

export default function EditProductPending() {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    barcode: "",
    image: "",
    brand: "",
    status: "pending",
  });

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { barcode } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setError("Veuillez vous reconnecter (token manquant)");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch product
        const productResponse = await fetch(`${API_URL}/product/find/${barcode}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!productResponse.ok) {
          throw new Error(`Erreur ${productResponse.status}: ${await productResponse.text()}`);
        }

        const fetchedProduct = await productResponse.json();
        setProduct(prev => ({
          ...prev,
          name: fetchedProduct.name ?? "",
          description: fetchedProduct.description ?? "",
          category: fetchedProduct.category ?? "",
          barcode,
          image: fetchedProduct.image ?? "",
          brand: fetchedProduct.brand ?? "",
          status: fetchedProduct.status || "pending",
        }));

        // Fetch categories
        const categoriesResponse = await fetch(`${API_URL}/category/find/all`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!categoriesResponse.ok) {
          throw new Error(`Erreur ${categoriesResponse.status}: ${await categoriesResponse.text()}`);
        }

        setCategories(await categoriesResponse.json() || []);
        setError(null);
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [barcode, token]);

  const handleError = (err) => {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      setError("Erreur de connexion au serveur. Vérifiez votre connexion réseau.");
    } else if (err.message.includes("401")) {
      setError("Session expirée. Veuillez vous reconnecter.");
    } else if (err.message.includes("404")) {
      setError("Produit ou catégorie non trouvé(e).");
    } else {
      setError(`Erreur: ${err.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize input to prevent XSS
    const sanitizedValue = value.replace(/[<>]/g, "");
    setProduct((prev) => ({ ...prev, [name]: sanitizedValue }));
    setError(null);
  };

  const isFormValid = () => {
    return (
      (product.name ?? "").trim() &&
      (product.category ?? "").trim() &&
      (product.image ?? "").trim() &&
      (product.brand ?? "").trim() &&
      ["pending", "approved", "rejected"].includes(product.status)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!token) {
      setError("Veuillez vous reconnecter (token manquant)");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/product/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
      }

      navigate("/pending-products");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full flex flex-col items-center px-6 py-10 pt-20 min-h-screen">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold text-[#1E3A8A] tracking-tight">
            Modifier le produit ({barcode})
          </h1>
          <Link to="/" className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300">
            <FaHouse size={28} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
                placeholder="Nom du produit"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm resize-none h-36"
                placeholder="Description du produit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marque *</label>
              <input
                type="text"
                name="brand"
                value={product.brand}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
                placeholder="Nom de la marque"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
              {categories.length === 0 ? (
                <p className="text-red-500">Aucune catégorie disponible</p>
              ) : (
                <select
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL *</label>
              <input
                type="url"
                name="image"
                value={product.image}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
                placeholder="URL de l'image"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut *</label>
              <select
                name="status"
                value={product.status}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
                required
              >
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>
            <div className="flex space-x-4 justify-center">
              <button
                type="submit"
                disabled={isLoading || !isFormValid()}
                className={`px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isLoading || !isFormValid()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white hover:from-[#3B82F6] hover:to-[#1E3A8A]"
                }`}
              >
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/pending-products")}
                disabled={isLoading}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}