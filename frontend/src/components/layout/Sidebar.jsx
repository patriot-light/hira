import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Mic2,
  AlertCircle,
  BarChart3,
  Settings,
  UserCog,
  X,
  LogOut,
  Globe,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import logo from "@/img/logo.png";

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout, isAdmin, isStudent, canManage } = useAuth();
  const { language, toggleLanguage, isRTL } = useLanguage();
  const location = useLocation();

  const navItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: t("dashboard"),
      roles: ["admin", "staff", "teacher", "student"],
    },
    {
      to: "/students",
      icon: Users,
      label: t("students"),
      roles: ["admin", "staff", "teacher"],
    },
    {
      to: "/teachers",
      icon: GraduationCap,
      label: t("teachers"),
      roles: ["admin", "staff"],
    },
    {
      to: "/halaqas",
      icon: BookOpen,
      label: t("halaqas"),
      roles: ["admin", "staff", "teacher", "student"],
    },
    {
      to: "/evaluations",
      icon: ClipboardCheck,
      label: t("evaluations"),
      roles: ["admin", "staff", "teacher", "student"],
    },
    {
      to: "/sessions",
      icon: Mic2,
      label: t("sessions"),
      roles: ["admin", "staff", "teacher", "student"],
    },
    {
      to: "/error-types",
      icon: AlertCircle,
      label: "Error Types",
      roles: ["admin", "staff"],
    },
    {
      to: "/reports",
      icon: BarChart3,
      label: t("reports"),
      roles: ["admin", "staff", "teacher"],
    },
    {
      to: "/users",
      icon: UserCog,
      label: t("users"),
      roles: ["admin"],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 h-full w-64 bg-white border-e border-border z-50 flex flex-col transition-transform duration-300",
          isRTL() ? "right-0" : "left-0",
          isOpen
            ? "translate-x-0"
            : isRTL()
              ? "translate-x-full md:translate-x-0"
              : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                <img src={logo} alt="Hira Logo" />
              </span>
            </div>
            <span className="font-bold text-lg text-foreground">
              {language === "ar" ? "معهد حراء" : "Hira Institute"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
            data-testid="close-sidebar-btn"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
              data-testid={`nav-${item.to.slice(1)}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Language Toggle */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={toggleLanguage}
            data-testid="language-toggle-btn"
          >
            <Globe className="h-5 w-5" />
            <span>{language === "en" ? "العربية" : "English"}</span>
          </Button>

          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2 bg-muted rounded-xl">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium text-sm">
                {user?.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {t(user?.role)}
              </p>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
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
