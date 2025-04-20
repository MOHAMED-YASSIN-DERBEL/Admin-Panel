import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API_URL}/product/find/${barcode}`);
        setProduct(response.data);
        setIsFetching(false);
      } catch (error) {
        console.error("Erreur lors de la récupération du produit:", error);
        setError("Erreur lors de la récupération du produit");
        setIsFetching(false);
      }
    };

    fetchProduct();
  }, [barcode]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/category/find/all`);
        setCategories(response.data || []);
        setIsFetchingCategories(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des catégories:", error);
        setCategoryError("Erreur lors de la récupération des catégories");
        setIsFetchingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProduct = { ...product, barcode };
      await axios.put(`${API_URL}/product/update`, updatedProduct);
      navigate("/pending-products");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du produit:", error);
      setError("Erreur lors de la mise à jour du produit");
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
                placeholder="Nom du produit"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
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
                  value={product.category}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
              <input
                type="text"
                name="image"
                value={product.image}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
                placeholder="URL de l'image"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                name="status"
                value={product.status}
                onChange={handleChange}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
              >
                <option value="pending">En attente</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>
            <div className="flex space-x-4 justify-center">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white rounded-xl hover:from-[#3B82F6] hover:to-[#1E3A8A] transition-all duration-300 shadow-lg hover:shadow-xl"
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