import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaPhone } from "react-icons/fa6";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const phone = phoneNumber.trim();
    const pass = password.trim();

    if (!phone || !pass) {
      setError("Veuillez remplir tous les champs");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/supplier/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, password: pass })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Échec de la connexion");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Numéro de téléphone ou mot de passe invalide");
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, password, navigate]);

  const handlePhoneChange = useCallback((e) => {
    setPhoneNumber(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2557] via-[#1E3A8A] to-[#3B82F6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1E3A8A] rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">H</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Hanoutik
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Panneau d'administration</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
              Numéro de téléphone
            </label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="phoneNumber"
                type="text"
                placeholder="+21612345678"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all bg-gray-50 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
                autoComplete="tel"
                aria-invalid={error ? "true" : "false"}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all bg-gray-50 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
                autoComplete="current-password"
                aria-invalid={error ? "true" : "false"}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center p-3 rounded-xl" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#1E3A8A] text-white py-3 rounded-xl hover:bg-[#2D4A9E] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A8A]/25"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                </svg>
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}