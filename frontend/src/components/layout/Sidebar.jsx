import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Globe,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mic2,
  Settings,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import logo from "@/img/logo.png";

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { language, toggleLanguage, isRTL } = useLanguage();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard"), roles: ["admin", "staff", "teacher", "exam_teacher", "student"] },
    { to: "/students", icon: Users, label: t("students"), roles: ["admin", "staff", "teacher", "exam_teacher"] },
    { to: "/teachers", icon: GraduationCap, label: t("teachers"), roles: ["admin", "staff"] },
    { to: "/halaqas", icon: BookOpen, label: t("halaqas"), roles: ["admin", "staff", "teacher", "student"] },
    { to: "/evaluations", icon: ClipboardCheck, label: t("evaluations"), roles: ["admin", "staff", "teacher", "exam_teacher", "student"] },
    { to: "/sessions", icon: Mic2, label: t("sessions"), roles: ["admin", "staff", "teacher", "student"] },
    { to: "/configuration", icon: Settings, label: t("configuration"), roles: ["admin", "staff"] },
    { to: "/reports", icon: BarChart3, label: t("reports"), roles: ["admin", "staff", "teacher"] },
    { to: "/certificates", icon: ClipboardCheck, label: t("certificates"), roles: ["admin"] },
    { to: "/users", icon: UserCog, label: t("users"), roles: ["admin"] },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 z-50 flex h-full w-80 flex-col bg-[hsl(181_56%_18%)] text-white shadow-[24px_0_70px_-42px_rgba(15,23,42,0.95)] transition-transform duration-300",
          isRTL() ? "right-0" : "left-0",
          isOpen
            ? "translate-x-0"
            : isRTL()
              ? "translate-x-full md:translate-x-0"
              : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex min-h-28 items-center justify-between border-b border-white/10 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-xl">
              <img src={logo} alt="Hira Logo" className="h-11 w-11 object-contain" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xl font-bold">
                {language === "ar" ? "معهد حراء" : "Hira Institute"}
              </span>
              <span className="mt-1 block text-sm font-semibold text-white/70">
                {t(user?.role)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white md:hidden"
            onClick={onClose}
            data-testid="close-sidebar-btn"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-5 pt-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
            <p className="text-xs font-bold uppercase text-white/55">{t("welcomeBack")}</p>
            <p className="mt-1 truncate text-base font-bold">{user?.full_name}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-5">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex min-h-14 items-center gap-3 rounded-lg px-4 text-sm font-bold transition-all",
                  isActive
                    ? "bg-white text-[hsl(181_56%_18%)] shadow-xl"
                    : "text-white/78 hover:bg-white/10 hover:text-white",
                )
              }
              data-testid={`nav-${item.to.slice(1)}`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-5">
          <Button
            variant="outline"
            className="w-full justify-start border-white/15 bg-white/10 text-white hover:bg-white hover:text-[hsl(181_56%_18%)]"
            onClick={toggleLanguage}
            data-testid="language-toggle-btn"
          >
            <Globe className="h-5 w-5" />
            <span>{language === "en" ? "العربية" : "English"}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/80 hover:bg-red-500/15 hover:text-white"
            onClick={logout}
            data-testid="logout-btn"
          >
            <LogOut className="h-5 w-5" />
            <span>{t("logout")}</span>
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
