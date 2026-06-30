import {
  Bell,
  CalendarDays,
  Search,
} from "lucide-react";

export default function Header() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
      {/* Left */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Welcome back, Raj 👋
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">

        {/* Search */}

        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none w-72"
          />
        </div>

        {/* Date */}

        <div className="flex items-center gap-2 text-gray-600">
          <CalendarDays size={18} />

          {today}
        </div>

        {/* Notification */}

        <button className="relative p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition">
          <Bell size={20} />

          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

      </div>
    </header>
  );
}