import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, ChevronDown, Calendar, TrendingUp, Users } from "lucide-react";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getRoleDisplayText = () => {
    switch (user.role) {
      case "mentor":
        return `Mentor • ${user.uspaLicense || "USPA License"}`;
      case "mentee":
        return `Mentee • ${user.jumps} jumps`;
      case "admin":
        return "Administrator";
      default:
        return user.role;
    }
  };

  const navLinks = [
    { name: "Dashboard", icon: TrendingUp, active: location === "/" },
    { name: "Schedule", icon: Calendar, active: false },
    { name: "Progression", icon: TrendingUp, active: false },
    { name: "Assignments", icon: Users, active: false },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center" data-testid="logo">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                <i className="fas fa-parachute-box text-white text-lg"></i>
              </div>
              <h1 className="text-xl font-bold text-gray-900">SkyMentor</h1>
            </div>
            
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.name}
                    className={`${
                      link.active
                        ? "text-primary-600 border-b-2 border-primary-600"
                        : "text-gray-500 hover:text-gray-700"
                    } px-1 pt-1 pb-4 text-sm font-medium flex items-center space-x-1 transition-colors`}
                    data-testid={`nav-link-${link.name.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 p-2"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700" data-testid="text-username">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500" data-testid="text-user-role">
                      {getRoleDisplayText()}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem data-testid="menu-profile">
                  <Users className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-settings">
                  <i className="fas fa-cog mr-2 text-sm"></i>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  data-testid="menu-logout"
                  className="text-red-600 focus:text-red-600"
                >
                  <i className="fas fa-sign-out-alt mr-2 text-sm"></i>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
