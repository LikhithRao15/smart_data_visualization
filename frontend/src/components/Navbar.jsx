import { supabase } from "../supabaseClient";

export default function Navbar({ user }) {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="h-16 bg-white/40 backdrop-blur-xl border-b border-white/30 flex items-center justify-between px-6 shadow-sm">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      <div className="flex items-center gap-4">
        <span className="text-gray-700">{user.email}</span>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
