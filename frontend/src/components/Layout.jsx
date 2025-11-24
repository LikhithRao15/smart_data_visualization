import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ user, children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar user={user} />

        <main className="p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
