import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileText,
  Calendar,
  Bell,
  Settings,
  X,
  School,
  ClipboardList,
  FileDown,
  LibraryBig,
  type LucideIcon,
} from "lucide-react";

import { useAppSelector } from "../../../redux/hooks";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type UserRole = "admin" | "teacher" | "student";

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  roles: UserRole[];
}

const mainNav: NavItem[] = [
  {
    path: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["admin", "teacher", "student"],
  },
  {
    path: "students",
    icon: GraduationCap,
    label: "Students",
    roles: ["admin", "teacher"],
  },
  {
    path: "teachers",
    icon: Users,
    label: "Teachers",
    roles: ["admin"],
  },
  {
    path: "section",
    icon: BookOpen,
    label: "Section",
    roles: ["admin"],
  },
  {
    path: "class-section",
    icon: BookOpen,
    label: "Class Section",
    roles: ["admin"],
  },
  {
    path: "classes",
    icon: BookOpen,
    label: "Classes",
    roles: ["admin", "teacher"],
  },
  {
    path: "subjects",
    icon: LibraryBig,
    label: "Subjects",
    roles: ["admin", "teacher", "student"],
  },
  {
    path: "streams",
    icon: LibraryBig,
    label: "Streams",
    roles: ["admin"],
  },
  {
    path: "attendance",
    icon: ClipboardCheck,
    label: "Attendance",
    roles: ["admin", "teacher"],
  },
  {
    path: "fees",
    icon: CreditCard,
    label: "Fees",
    roles: ["admin"],
  },
  {
    path: "exams",
    icon: FileText,
    label: "Exams & Results",
    roles: ["admin", "teacher"],
  },
  {
    path: "marks-entry",
    icon: ClipboardList,
    label: "Marks Entry",
    roles: ["admin", "teacher"],
  },
  {
    path: "marksheet",
    icon: FileDown,
    label: "Marksheet",
    roles: ["admin", "teacher", "student"],
  },
  {
    path: "timetable",
    icon: Calendar,
    label: "Timetable",
    roles: ["admin", "teacher", "student"],
  },
];

const adminNav: NavItem[] = [
  {
    path: "notices",
    icon: Bell,
    label: "Notice Board",
    roles: ["admin", "teacher", "student"],
  },
  {
    path: "settings",
    icon: Settings,
    label: "Settings",
    roles: ["admin"],
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const { user } = useAppSelector((state) => state.auth);

  const role: UserRole = user?.role || "student";


  const basePath = `/${role}`;

  const isActive = (path: string) => {
    return location.pathname === `${basePath}/${path}`;
  };

  const filteredMainNav = mainNav.filter((item) =>
    item.roles.includes(role)
  );

  const filteredAdminNav = adminNav.filter((item) =>
    item.roles.includes(role)
  );

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);

    return (
      <li>
        <Link
          to={`${basePath}/${item.path}`}
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${active
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-sidebar z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <School className="w-4 h-4 text-white" />
            </div>

            <div>
              <span className="text-sidebar-foreground font-bold text-base">
                EduAdmin
              </span>

              <p className="text-sidebar-foreground/50 text-xs">
                School ERP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
            Main Menu
          </p>

          <ul className="space-y-1">
            {filteredMainNav.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </ul>

          {filteredAdminNav.length > 0 && (
            <>
              <p className="px-3 mt-5 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                Administration
              </p>

              <ul className="space-y-1">
                {filteredAdminNav.map((item) => (
                  <NavLink key={item.path} item={item} />
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-sidebar-foreground/50 truncate capitalize">
                {role}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}