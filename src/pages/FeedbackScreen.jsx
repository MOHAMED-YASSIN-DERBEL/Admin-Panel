import { useEffect, useState } from "react";
import axios from "axios";
import { FaStar, FaHouse, FaComment, FaFilter } from "react-icons/fa6";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";

const URL = import.meta.env.VITE_API_URL;

const FeedbackScreen = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [ratingFilter, setRatingFilter] = useState(null);
  const COMMENT_LIMIT = 100;

  // Récupérer le token depuis localStorage
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await axios.get(`${URL}/feedback`, {
          headers: {
            Authorization: `Bearer ${token}`, // 👈 token ajouté ici
          },
        });
        setFeedbacks(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching feedbacks:", err.response?.data || err.message);
        setError("Erreur lors du chargement des avis");
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [token]);

  const toggleComment = (feedbackId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [feedbackId]: !prev[feedbackId],
    }));
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={index < rating ? "text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  const filteredFeedbacks = ratingFilter
    ? feedbacks.filter((feedback) => feedback.rating === ratingFilter)
    : feedbacks;

  // Calculer les statistiques
  const avgRating = feedbacks.length > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : 0;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: feedbacks.filter(f => f.rating === rating).length,
    percentage: feedbacks.length > 0 
      ? (feedbacks.filter(f => f.rating === rating).length / feedbacks.length) * 100 
      : 0
  }));

  if (loading) {
    return (
      <main className="p-8 pt-20 min-h-screen flex items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8 pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">{error}</p>
          <Link to="/home" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
            Retour à l'accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 pt-20 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-2xl shadow-lg">
              <FaComment className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Avis des Clients</h1>
              <p className="text-gray-600 mt-1">{feedbacks.length} avis au total</p>
            </div>
          </div>
          <Link
            to="/home"
            className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <FaHouse size={24} />
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 p-4 rounded-xl">
                <FaStar className="text-yellow-500 text-3xl" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">Note Moyenne</h3>
            <p className="text-4xl font-bold text-gray-900">{avgRating}</p>
            <div className="flex items-center gap-1 mt-2">
              {renderStars(Math.round(avgRating))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-gray-600 text-sm font-medium mb-4">Distribution des Notes</h3>
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <FaFilter className="text-2xl" />
              <h3 className="text-sm font-medium">Filtrer par Note</h3>
            </div>
            <select
              value={ratingFilter || "all"}
              onChange={(e) => setRatingFilter(e.target.value === "all" ? null : Number(e.target.value))}
              className="w-full p-3 border-2 border-white/30 rounded-xl bg-white/20 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            >
              <option value="all" className="text-gray-900">Tous les avis</option>
              <option value="5" className="text-gray-900">5 étoiles ⭐⭐⭐⭐⭐</option>
              <option value="4" className="text-gray-900">4 étoiles ⭐⭐⭐⭐</option>
              <option value="3" className="text-gray-900">3 étoiles ⭐⭐⭐</option>
              <option value="2" className="text-gray-900">2 étoiles ⭐⭐</option>
              <option value="1" className="text-gray-900">1 étoile ⭐</option>
            </select>
            <p className="text-sm mt-4 opacity-90">
              {ratingFilter ? `${filteredFeedbacks.length} avis sélectionnés` : 'Affichage de tous les avis'}
            </p>
          </div>
        </div>

        {/* Feedbacks Grid */}
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FaComment className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-xl text-gray-500">Aucun avis trouvé pour ce filtre.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex justify-between items-center mb-4">
                  {renderStars(feedback.rating)}
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {new Date(feedback.date).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {feedback.comment.length > COMMENT_LIMIT &&
                  !expandedComments[feedback.id] ? (
                    <>
                      {feedback.comment.slice(0, COMMENT_LIMIT)}...
                      <button
                        type="button"
                        onClick={() => toggleComment(feedback.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium ml-1 transition-colors"
                      >
                        Lire plus
                      </button>
                    </>
                  ) : (
                    <>
                      {feedback.comment}
                      {feedback.comment.length > COMMENT_LIMIT && (
                        <button
                          type="button"
                          onClick={() => toggleComment(feedback.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium ml-1 transition-colors"
                        >
                          Lire moins
                        </button>
                      )}
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FaComment className="text-blue-600 text-sm" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {feedback.shopOwnerId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default FeedbackScreen;
