import { BarChart3, Upload, Clock, LogOut } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white/40 backdrop-blur-xl border-r border-white/30 shadow-xl p-6 hidden md:block">
      <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-10">
        SDVA Dashboard
      </h1>

      <nav className="space-y-4">
        <NavItem icon={<Upload />} label="Upload" url="/" />
        <NavItem icon={<BarChart3 />} label="Analytics" url="/dashboard" />
        <NavItem icon={<Clock />} label="History" url="/history" />
      </nav>
    </aside>
  );
}

function NavItem({ icon, label, url }) {
  return (
    <a
      href={url}
      className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/60 transition"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </a>
  );
}
