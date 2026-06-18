import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, UsersRound, BookOpen,
  ClipboardCheck, CreditCard, FileText, Calendar, Bell, Settings,
  X, School, ClipboardList, FileDown, LibraryBig
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNav = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/students", icon: GraduationCap, label: "Students" },
  { href: "/teachers", icon: Users, label: "Teachers" },
  { href: "/parents", icon: UsersRound, label: "Parents" },
  { href: "/classes", icon: BookOpen, label: "Classes" },
  { href: "/subjects", icon: LibraryBig, label: "Subjects" },
  { href: "/attendance", icon: ClipboardCheck, label: "Attendance" },
  { href: "/fees", icon: CreditCard, label: "Fees" },
  { href: "/exams", icon: FileText, label: "Exams & Results" },
  { href: "/marks-entry", icon: ClipboardList, label: "Marks Entry" },
  { href: "/marksheet", icon: FileDown, label: "Marksheet" },
  { href: "/timetable", icon: Calendar, label: "Timetable" },
];

const adminNav = [
  { href: "/notices", icon: Bell, label: "Notice Board" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const NavLink = ({ item }: { item: typeof mainNav[0] }) => {
    const active = isActive(item.href);
    return (
      <li>
        <Link
          href={item.href}
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          }`}
          data-testid={`nav-${item.label.toLowerCase().replace(/[\s&]+/g, "-")}`}
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
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-sidebar z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <School className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sidebar-foreground font-bold text-base leading-none">EduAdmin</span>
              <p className="text-sidebar-foreground/50 text-xs mt-0.5">School ERP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            data-testid="sidebar-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav — scrollable */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
            Main Menu
          </p>
          <ul className="space-y-0.5">
            {mainNav.map(item => <NavLink key={item.href} item={item} />)}
          </ul>

          <p className="px-3 mt-5 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
            Administration
          </p>
          <ul className="space-y-0.5">
            {adminNav.map(item => <NavLink key={item.href} item={item} />)}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              JA
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">John Admin</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
