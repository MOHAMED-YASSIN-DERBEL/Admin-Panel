import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import { FaHouse, FaFloppyDisk, FaXmark } from "react-icons/fa6";

const API_URL = import.meta.env.VITE_API_URL;

export default function EditProductPending() {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    barcode: "",
    bigBoxBarcode: "",
    smallBoxBarcode: "",
    image: "",
    brand: "",
    status: "pending",
    supplierId: "",
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
          barcode: fetchedProduct.barcode ?? barcode,
          bigBoxBarcode: fetchedProduct.bigBoxBarcode ?? "",
          smallBoxBarcode: fetchedProduct.smallBoxBarcode ?? "",
          image: fetchedProduct.image ?? "",
          brand: fetchedProduct.brand ?? "",
          status: fetchedProduct.status || "pending",
          supplierId: fetchedProduct.supplierId ?? "",
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

  const handleError = useCallback((err) => {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      setError("Erreur de connexion au serveur. Vérifiez votre connexion réseau.");
    } else if (err.message.includes("401")) {
      setError("Session expirée. Veuillez vous reconnecter.");
    } else if (err.message.includes("404")) {
      setError("Produit ou catégorie non trouvé(e).");
    } else {
      setError(`Erreur: ${err.message}`);
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    // Sanitize input to prevent XSS
    const sanitizedValue = value.replace(/[<>]/g, "");
    setProduct((prev) => ({ ...prev, [name]: sanitizedValue }));
    setError(null);
  }, []);

  const isFormValid = useMemo(() => {
    return (
      (product.name ?? "").trim() &&
      (product.category ?? "").trim() &&
      (product.image ?? "").trim() &&
      (product.brand ?? "").trim() &&
      (product.barcode ?? "").trim() &&
      ["pending", "approved", "rejected"].includes(product.status)
    );
  }, [product]);

  const associateSupplierWithCategory = useCallback(async () => {
    if (!product.supplierId || !product.category) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/supplier-category/associate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplierId: product.supplierId,
          categoryName: product.category,
        }),
      });

      if (!response.ok) {
        console.warn(`Association supplier-catégorie échouée: ${response.status}`);
      }
    } catch (err) {
      console.warn("Erreur lors de l'association supplier-catégorie:", err);
    }
  }, [product.supplierId, product.category, token]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!token) {
      setError("Veuillez vous reconnecter (token manquant)");
      return;
    }

    setIsLoading(true);
    try {
      // Créer l'association supplier-catégorie si supplierId est fourni
      if (product.supplierId && product.category) {
        await associateSupplierWithCategory();
      }

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
  }, [product, isFormValid, token, navigate, handleError, associateSupplierWithCategory]);

  return (
    <main className="w-full flex flex-col items-center px-4 sm:px-6 py-6 pt-20 lg:pt-6 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A8A] tracking-tight">
              Modifier le produit
            </h1>
            <p className="text-sm text-gray-600 mt-1">Code barre: {barcode}</p>
          </div>
          <Link to="/pending-products" className="text-[#1E3A8A] hover:text-[#D4AF37] transition-colors duration-300">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne gauche - Formulaire */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
                    placeholder="Nom du produit"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marque *</label>
                  <input
                    type="text"
                    name="brand"
                    value={product.brand}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
                    placeholder="Nom de la marque"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                  {categories.length === 0 ? (
                    <p className="text-red-500 text-sm">Aucune catégorie disponible</p>
                  ) : (
                    <select
                      name="category"
                      value={product.category}
                      onChange={handleChange}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID du Fournisseur
                    <span className="text-xs text-gray-500 ml-2">(optionnel - pour association)</span>
                  </label>
                  <input
                    type="text"
                    name="supplierId"
                    value={product.supplierId}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
                    placeholder="ID du fournisseur"
                  />
                  {product.supplierId && product.category && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Associera le fournisseur à la catégorie "{product.category}"
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut *</label>
                  <select
                    name="status"
                    value={product.status}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
                    required
                  >
                    <option value="pending">🕒 En attente</option>
                    <option value="approved">✅ Approuvé</option>
                    <option value="rejected">❌ Rejeté</option>
                  </select>
                </div>
              </div>

              {/* Colonne droite - Prévisualisation */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prévisualisation de l'image</label>
                  <div className="w-full h-64 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name || "Aperçu"}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EImage invalide%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">Aucune image</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm resize-none h-32 shadow-sm"
                    placeholder="Description du produit"
                  />
                </div>
              </div>
            </div>

            {/* Codes barres en pleine largeur */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Codes barres</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code barre principal *</label>
                  <input
                    type="text"
                    name="barcode"
                    value={product.barcode}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
                    placeholder="Code barre"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grand emballage</label>
                  <input
                    type="text"
                    name="bigBoxBarcode"
                    value={product.bigBoxBarcode}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Petit emballage</label>
                  <input
                    type="text"
                    name="smallBoxBarcode"
                    value={product.smallBoxBarcode}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
                    placeholder="Optionnel"
                  />
                </div>
              </div>
            </div>

            {/* URL Image en pleine largeur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL de l'image *</label>
              <input
                type="url"
                name="image"
                value={product.image}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm shadow-sm"
                placeholder="https://exemple.com/image.jpg"
                required
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-4 justify-end pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/pending-products")}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                <FaXmark /> Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className={`px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 ${
                  isLoading || !isFormValid
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white hover:from-[#3B82F6] hover:to-[#1E3A8A]"
                }`}
              >
                <FaFloppyDisk /> {isLoading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
            {error && <p className="text-red-500 text-center bg-red-50 p-3 rounded-lg">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}