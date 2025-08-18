import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Home, 
  Calendar, 
  Users, 
  Settings, 
  Trophy,
  BookOpen,
  BarChart3,
  LogOut,
  GraduationCap,
  UserCheck,
  Shield,
  Plane
} from "lucide-react";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      roles: ["mentor", "mentee", "admin"]
    },
    {
      name: "Sessions",
      href: user?.role === 'mentee' ? "/mentee-sessions" : "/sessions",
      icon: Calendar,
      roles: ["mentor", "mentee", "admin"]
    },
    {
      name: "Progression",
      href: "/progression",
      icon: BookOpen,
      roles: ["mentee", "mentor"]
    },
    {
      name: "Jump Logs",
      href: "/jump-logs",
      icon: Plane,
      roles: ["mentee", "mentor"]
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      roles: ["admin"]
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      roles: ["admin"]
    },
    {
      name: "Awards",
      href: "/awards",
      icon: Trophy,
      roles: ["mentee"]
    }
  ];

  const visibleItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="font-bold text-xl text-gray-900">SkyMentor</span>
                {/* Role indicator icon with tooltip */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="ml-2 flex items-center p-1.5 rounded-md bg-gray-50 border border-gray-200">
                        {user.role === 'mentee' && (
                          <GraduationCap className="h-4 w-4 text-blue-600" />
                        )}
                        {user.role === 'mentor' && (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        )}
                        {user.role === 'admin' && (
                          <Shield className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">
                        {user.role === 'mentee' && 'Mentee Account'}
                        {user.role === 'mentor' && 'Mentor Account'}
                        {user.role === 'admin' && 'Administrator Account'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="hidden md:flex space-x-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "flex items-center gap-2",
                        isActive && "bg-primary-100 text-primary-700"
                      )}
                      data-testid={`nav-${item.name.toLowerCase()}`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  {user.name}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  {user.role}
                </span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                setLocation("/");
              }}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 py-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start flex items-center gap-2",
                    isActive && "bg-primary-100 text-primary-700"
                  )}
                  data-testid={`nav-mobile-${item.name.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}