import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg lg:flex-row">
      <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* lg altında (telefon/tablet) sabit sidebar yerine hamburger'la
            açılan bir üst bar — lg ve üstünde tamamen gizli, sidebar zaten
            her zaman görünür. */}
        <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-ink hover:bg-bg"
            aria-label="Menüyü aç"
          >
            <span className="block text-xl leading-none">☰</span>
          </button>
          <img src="/xnetic-logo.png" alt="X-NETIC" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-sm font-extrabold text-ink">X-NETIC</span>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
