import { useEffect, useState } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";

const URL = import.meta.env.VITE_API_URL;

const FeedbackScreen = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedComments, setExpandedComments] = useState({}); // Track expanded state for each comment
  const [ratingFilter, setRatingFilter] = useState(null); // null for "All", 1-5 for specific ratings
  const COMMENT_LIMIT = 100; // Character limit before truncation

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await axios.get(`${URL}/feedback`);
        setFeedbacks(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching feedbacks:", err.response?.data || err.message);
        setError("Erreur lors du chargement des avis");
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  // Toggle expanded state for a specific feedback
  const toggleComment = (feedbackId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [feedbackId]: !prev[feedbackId],
    }));
  };

  // Render star rating
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

  // Filter feedbacks based on rating
  const filteredFeedbacks = ratingFilter
    ? feedbacks.filter((feedback) => feedback.rating === ratingFilter)
    : feedbacks;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Avis des Clients</h1>
      <div className="mb-6 flex justify-center">
        <select
          value={ratingFilter || "all"}
          onChange={(e) => setRatingFilter(e.target.value === "all" ? null : Number(e.target.value))}
          className="p-2 border rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les avis</option>
          <option value="5">5 étoiles</option>
          <option value="4">4 étoiles</option>
          <option value="3">3 étoiles</option>
          <option value="2">2 étoiles</option>
          <option value="1">1 étoile</option>
        </select>
      </div>
      {filteredFeedbacks.length === 0 ? (
        <p className="text-center text-gray-500">Aucun avis trouvé pour ce filtre.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
            >
              <div className="flex justify-between items-center mb-2">
                {renderStars(feedback.rating)}
                <span className="text-sm text-gray-500">
                  {new Date(feedback.date).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p className="text-gray-700 mb-2">
                {feedback.comment.length > COMMENT_LIMIT &&
                !expandedComments[feedback.id] ? (
                  <>
                    {feedback.comment.slice(0, COMMENT_LIMIT)}...
                    <button
                      type="button"
                      onClick={() => toggleComment(feedback.id)}
                      className="text-blue-600 hover:underline ml-1"
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
                        className="text-blue-600 hover:underline ml-1"
                      >
                        Lire moins
                      </button>
                    )}
                  </>
                )}
              </p>
              <p className="text-sm text-gray-500">
                Par: {feedback.shopOwnerId}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackScreen;