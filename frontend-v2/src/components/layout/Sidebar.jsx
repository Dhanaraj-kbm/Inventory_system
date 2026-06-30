import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  TriangleAlert,
  Settings,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const menu = [
  {
    title: "MAIN",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { name: "POS Billing", icon: ShoppingCart, path: "/pos" },
      { name: "Products", icon: Package, path: "/products" },
      { name: "Invoice History", icon: FileText, path: "/history" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Stock Alerts", icon: TriangleAlert, path: "/alerts" },
      { name: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-slate-900 text-white flex flex-col justify-between shadow-xl">

      {/* Logo */}
      <div className="p-6">

        <div className="flex items-center gap-3 mb-10">

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-xl font-bold shadow-lg">
            P
          </div>

          <div>
            <h1 className="text-2xl font-bold">POS Studio</h1>
            <p className="text-xs text-slate-400">
              Inventory Management
            </p>
          </div>

        </div>

        {menu.map((section) => (
          <div key={section.title} className="mb-8">

            <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">
              {section.title}
            </p>

            <div className="space-y-2">

              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                        ? "bg-teal-500 text-white shadow-lg"
                        : "hover:bg-slate-800 text-slate-300"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </div>

                    <ChevronRight
                      size={18}
                      className="opacity-0 group-hover:opacity-100 transition"
                    />
                  </NavLink>
                );
              })}

            </div>

          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 p-6">

        <div className="flex items-center gap-4">

          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center font-bold">
            RK
          </div>

          <div className="flex-1">
            <p className="font-semibold">Raj Kumar</p>
            <p className="text-sm text-slate-400">
              Administrator
            </p>
          </div>

          <div className="w-3 h-3 rounded-full bg-green-400"></div>

        </div>

      </div>

    </aside>
  );
}