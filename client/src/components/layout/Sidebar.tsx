import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UsersRound,
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
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

interface NavItem {
  href: string;
  icon: any;
  label: string;
  roles: UserRole[];
}

const mainNav: NavItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    href: "/students",
    icon: GraduationCap,
    label: "Students",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    href: "/teachers",
    icon: Users,
    label: "Teachers",
    roles: ["ADMIN"],
  },
  {
    href: "/parents",
    icon: UsersRound,
    label: "Parents",
    roles: ["ADMIN"],
  },
  {
    href: "/classes",
    icon: BookOpen,
    label: "Classes",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    href: "/subjects",
    icon: LibraryBig,
    label: "Subjects",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    href: "/attendance",
    icon: ClipboardCheck,
    label: "Attendance",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    href: "/fees",
    icon: CreditCard,
    label: "Fees",
    roles: ["ADMIN"],
  },
  {
    href: "/exams",
    icon: FileText,
    label: "Exams & Results",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    href: "/marks-entry",
    icon: ClipboardList,
    label: "Marks Entry",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    href: "/marksheet",
    icon: FileDown,
    label: "Marksheet",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    href: "/timetable",
    icon: Calendar,
    label: "Timetable",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
];

const adminNav: NavItem[] = [
  {
    href: "/notices",
    icon: Bell,
    label: "Notice Board",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    roles: ["ADMIN"],
  },
];

export function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const location = useLocation();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const role: UserRole = user?.role || "STUDENT";

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const filteredMainNav = mainNav.filter((item) =>
    item.roles.includes(role)
  );

  const filteredAdminNav = adminNav.filter((item) =>
    item.roles.includes(role)
  );

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);

    return (
      <li>
        <Link
          to={item.href}
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
        className={`fixed top-0 left-0 h-full w-64 bg-sidebar z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${isOpen
          ? "translate-x-0"
          : "-translate-x-full"
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
              <NavLink
                key={item.href}
                item={item}
              />
            ))}
          </ul>

          <p className="px-3 mt-5 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
            Administration
          </p>

          <ul className="space-y-1">
            {filteredAdminNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
              />
            ))}
          </ul>
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

              <p className="text-xs text-sidebar-foreground/50 truncate">
                {role}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}