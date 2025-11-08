import { useEffect, useState } from "react";
import { FaPen, FaHouse } from "react-icons/fa6";
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
  }, [currentPage, itemsPerPage]);

  const filteredProducts = products.filter(
    (product) =>
      search === "" ||
      product.barcode.toString().includes(search) ||
      product.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="w-full flex flex-col items-center px-4 lg:px-8 py-10 pt-20 min-h-screen space-y-8">
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

        <section className="w-full flex space-x-4 mb-8">
          <input
            type="text"
            placeholder="Rechercher par code-barres ou nom..."
            className="w-1/3 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 backdrop-blur-sm"
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>

 

        {isFetching ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-gray-500 text-center">Aucun produit en attente trouvé</p>
        ) : (
          <ul className="w-full space-y-6">
            {filteredProducts.map((product) => (
              <li
                key={product.barcode}
                className="p-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
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
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      navigate(`/edit-product-pending/${product.barcode}`)
                    }
                    className="text-[#1E3A8A] hover:text-[#D4AF37] transition-all duration-300"
                    title="Modifier le produit"
                  >
                    <FaPen size={24} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
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