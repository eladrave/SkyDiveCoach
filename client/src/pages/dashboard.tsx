import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Navigation from "@/components/navigation";
import MentorDashboard from "@/pages/mentor-dashboard";
import MenteeDashboard from "@/pages/mentee-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-dashboard">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard-page">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === "mentor" && <MentorDashboard />}
        {user.role === "mentee" && <MenteeDashboard />}
        {user.role === "admin" && <AdminDashboard />}
      </main>
    </div>
  );
}
