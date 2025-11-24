export default function Footer() {
  return (
    <footer className="w-full mt-10 border-t border-white/20 backdrop-blur-lg bg-white/30">
      <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-gray-700">
        © {new Date().getFullYear()} Smart Data Visualization & Analysis.  
        <span className="text-blue-600 font-medium"> All rights reserved.</span>
      </div>
    </footer>
  );
}
