import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { FaStar, FaHouse, FaComment, FaFilter } from "react-icons/fa6";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";

const API_URL = import.meta.env.VITE_API_URL;

const StarRating = memo(function StarRating({ rating }) {
  return (
    <div className="flex">
      {[0, 1, 2, 3, 4].map((index) => (
        <FaStar
          key={index}
          className={index < rating ? "text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
});

const FeedbackCard = memo(function FeedbackCard({ feedback, isExpanded, onToggle, commentLimit }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-center mb-4">
        <StarRating rating={feedback.rating} />
        <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
          {new Date(feedback.date).toLocaleDateString("fr-FR")}
        </span>
      </div>
      <p className="text-gray-700 mb-4 leading-relaxed text-sm">
        {feedback.comment.length > commentLimit && !isExpanded ? (
          <>
            {feedback.comment.slice(0, commentLimit)}...
            <button
              type="button"
              onClick={() => onToggle(feedback.id)}
              className="text-[#1E3A8A] hover:text-[#3B82F6] font-medium ml-1 transition-colors text-sm"
            >
              Lire plus
            </button>
          </>
        ) : (
          <>
            {feedback.comment}
            {feedback.comment.length > commentLimit && (
              <button
                type="button"
                onClick={() => onToggle(feedback.id)}
                className="text-[#1E3A8A] hover:text-[#3B82F6] font-medium ml-1 transition-colors text-sm"
              >
                Lire moins
              </button>
            )}
          </>
        )}
      </p>
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <div className="bg-[#1E3A8A]/10 p-1.5 rounded-full">
          <FaComment className="text-[#1E3A8A] text-xs" />
        </div>
        <p className="text-xs text-gray-600 font-medium">
          {feedback.shopOwnerId}
        </p>
      </div>
    </div>
  );
});

const FeedbackScreen = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [ratingFilter, setRatingFilter] = useState(null);
  const COMMENT_LIMIT = 100;

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await fetch(`${API_URL}/feedback`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        const data = await response.json();
        setFeedbacks(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching feedbacks:", err.message);
        setError("Erreur lors du chargement des avis");
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [token]);

  const toggleComment = useCallback((feedbackId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [feedbackId]: !prev[feedbackId],
    }));
  }, []);

  const handleFilterChange = useCallback((e) => {
    setRatingFilter(e.target.value === "all" ? null : Number(e.target.value));
  }, []);

  const filteredFeedbacks = useMemo(() =>
    ratingFilter
      ? feedbacks.filter((feedback) => feedback.rating === ratingFilter)
      : feedbacks,
    [feedbacks, ratingFilter]
  );

  const avgRating = useMemo(() =>
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0,
    [feedbacks]
  );
  
  const ratingDistribution = useMemo(() =>
    [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: feedbacks.filter(f => f.rating === rating).length,
      percentage: feedbacks.length > 0 
        ? (feedbacks.filter(f => f.rating === rating).length / feedbacks.length) * 100 
        : 0
    })),
    [feedbacks]
  );

  if (loading) {
    return (
      <main className="p-4 sm:p-6 pt-20 lg:pt-6 min-h-screen flex items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 sm:p-6 pt-20 lg:pt-6 min-h-screen flex items-center justify-center">
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
    <main className="p-4 sm:p-6 pt-20 lg:pt-6 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
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
              <StarRating rating={Math.round(avgRating)} />
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
              onChange={handleFilterChange}
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
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                isExpanded={expandedComments[feedback.id]}
                onToggle={toggleComment}
                commentLimit={COMMENT_LIMIT}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default FeedbackScreen;
