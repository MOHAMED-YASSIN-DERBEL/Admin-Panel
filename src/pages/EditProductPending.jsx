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
    status: "pending",
  });
  const [categories, setCategories] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isFetchingCategories, setIsFetchingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [categoryError, setCategoryError] = useState(null);
  const { barcode } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProduct = async () => {
      setIsFetching(true);

 

      if (!token) {
        setError("Token manquant, veuillez vous reconnecter");
        setIsFetching(false);
        console.log("=== END DEBUG ===");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/product/find/${barcode}`, {
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

        const fetchedProduct = await response.json();
        console.log("Response data:", fetchedProduct);
        setProduct(fetchedProduct || {
          name: "",
          description: "",
          category: "",
          barcode,
          image: "",
          status: "pending",
        });
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
          setError("Produit non trouvé (404).");
        } else {
          setError(`Erreur lors de la récupération du produit: ${err.message}`);
        }
      } finally {
        setIsFetching(false);
        console.log("=== END DEBUG ===");
      }
    };

    fetchProduct();
  }, [barcode, token]);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsFetchingCategories(true);

      console.log("=== DEBUG INFO (fetchCategories) ===");
      console.log("API_URL from env:", API_URL);
      console.log("Token exists:", !!token);
      console.log("Token value:", token ? `${token.substring(0, 20)}...` : "null");
      console.log("Fetching Categories from:", `${API_URL}/category/find/all`);

      if (!token) {
        setCategoryError("Token manquant, veuillez vous reconnecter");
        setIsFetchingCategories(false);
        console.log("=== END DEBUG ===");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/category/find/all`, {
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

        const fetchedCategories = await response.json();
        console.log("Response data:", fetchedCategories);
        setCategories(fetchedCategories || []);
        setCategoryError(null);
      } catch (err) {
        console.error("=== FETCH ERROR DETAILS ===");
        console.error("Error type:", err.constructor.name);
        console.error("Error message:", err.message);
        console.error("Full error:", err);
        console.error("Is network error:", err instanceof TypeError && err.message.includes("fetch"));

        if (err instanceof TypeError && err.message.includes("fetch")) {
          setCategoryError("Erreur de connexion au serveur. Vérifiez que le backend est démarré sur " + API_URL);
        } else if (err.message.includes("401")) {
          setCategoryError("Non autorisé (401). Vérifiez votre token.");
        } else if (err.message.includes("404")) {
          setCategoryError("Endpoint des catégories non trouvé (404).");
        } else {
          setCategoryError(`Erreur lors de la récupération des catégories: ${err.message}`);
        }
      } finally {
        setIsFetchingCategories(false);
        console.log("=== END DEBUG ===");
      }
    };

    fetchCategories();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
    setError(null); // Réinitialiser l'erreur lors de la modification
  };

  const isFormValid = () => {
    return (
      product.name.trim() !== "" &&
      product.category.trim() !== "" &&
      product.image.trim() !== "" &&
      ["pending", "approved", "rejected"].includes(product.status)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError("Veuillez remplir tous les champs obligatoires (Nom, Catégorie, Image URL, Statut).");
      return;
    }

    console.log("=== DEBUG INFO (handleSubmit) ===");
    console.log("API_URL from env:", API_URL);
    console.log("Token exists:", !!token);
    console.log("Token value:", token ? `${token.substring(0, 20)}...` : "null");
    console.log("Submitting to:", `${API_URL}/product/update`);
    console.log("Product data:", product);

    if (!token) {
      setError("Token manquant, veuillez vous reconnecter");
      console.log("=== END DEBUG ===");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/product/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
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

      console.log("Product updated successfully");
      navigate("/pending-products");
    } catch (err) {
      console.error("=== FETCH ERROR DETAILS ===");
      console.error("Error type:", err.constructor.name);
      console.error("Error message:", err.message);
      console.error("Full error:", err);

      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Erreur de connexion au serveur. Vérifiez que le backend est démarré sur " + API_URL);
      } else if (err.message.includes("401")) {
        setError("Non autorisé (401). Vérifiez votre token.");
      } else if (err.message.includes("404")) {
        setError("Produit ou endpoint non trouvé (404).");
      } else if (err.message.includes("400")) {
        setError("Données invalides envoyées au serveur.");
      } else {
        setError(`Erreur lors de la mise à jour du produit: ${err.message}`);
      }
    } finally {
      console.log("=== END DEBUG ===");
    }
  };

  return (
    <main className="w-full flex flex-col items-center px-6 py-10 min-h-screen">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold text-[#1E3A8A] tracking-tight">
            Modifier le produit ({barcode})
          </h1>
          <Link to="/" className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300">
            <FaHouse size={28} />
          </Link>
        </div>
      
        {isFetching ? (
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
                value={product.name || ""}
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
                value={product.description || ""}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm resize-none h-36"
                placeholder="Description du produit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
              {isFetchingCategories ? (
                <div className="flex justify-center">
                  <Spinner />
                </div>
              ) : categoryError ? (
                <p className="text-red-500">{categoryError}</p>
              ) : categories.length === 0 ? (
                <p className="text-gray-500">Aucune catégorie disponible</p>
              ) : (
                <select
                  name="category"
                  value={product.category || ""}
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
                type="text"
                name="image"
                value={product.image || ""}
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
                value={product.status || "pending"}
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
                disabled={!isFormValid()}
                className={`px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isFormValid()
                    ? "bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white hover:from-[#3B82F6] hover:to-[#1E3A8A]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => navigate("/pending-products")}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300"
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