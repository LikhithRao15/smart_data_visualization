import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password,options: { data:{full_name:name,} } });
    setLoading(false);
    if (error) return alert(error.message);

    alert("Signup successful! Please check your email to confirm your account.");
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <form onSubmit={handleSignup} className="bg-white/50 backdrop-blur-xl p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

        <input
        type="text"
        placeholder="Full Name"
        value={name}
        className="w-full px-4 py-3 mb-2 rounded-lg border"
        onChange={(e) => setName(e.target.value)}
      />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 mb-4 rounded-lg border"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 mb-6 rounded-lg border"
          required
        />
        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold shadow">
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <p className="text-sm text-gray-700 mt-4 text-center">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium">Login</Link>
        </p>
      </form>
    </div>
  );
}
