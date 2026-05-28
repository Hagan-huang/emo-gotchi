import React from "react";
import { Home, ListTodo, BookOpen, Users } from "lucide-react";
import { useApp } from "../store/AppContext";
import { soundEffects } from "../utils/audio";

export function Navigation() {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: "home", label: "怪獸", icon: <Home size={28} strokeWidth={3} /> },
    {
      id: "tasks",
      label: "治癒任務",
      icon: <ListTodo size={28} strokeWidth={3} />,
    },
    {
      id: "diary",
      label: "心情日記",
      icon: <BookOpen size={28} strokeWidth={3} />,
    },
    {
      id: "community",
      label: "社群分享",
      icon: <Users size={28} strokeWidth={3} />,
    },
  ] as const;

  return (
    <nav className="fixed bottom-0 w-full bg-[#FFFAEC] border-t-4 border-[#5D4037] pb-safe z-50">
      <div className="flex h-[110px]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (activeTab !== item.id) {
                soundEffects.click();
              }
              setActiveTab(item.id);
            }}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all h-full ${
              activeTab === item.id
                ? "bg-[#FFCC80] border-t-8 border-[#5D4037] -mt-1 text-[#5D4037]"
                : "text-[#AF8A63] hover:bg-[#FFF3E0] hover:text-[#5D4037] border-t-4 border-transparent"
            }`}
          >
            {item.icon}
            <span className="font-extrabold text-[16px] sm:text-[18px]">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
