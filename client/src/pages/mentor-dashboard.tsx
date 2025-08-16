import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import PendingAssignments from "@/components/mentor/pending-assignments";
import UpcomingSessions from "@/components/mentor/upcoming-sessions";
import MentorStats from "@/components/mentor/stats";

export default function MentorDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/mentor", user?.id],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="mentor-dashboard-loading">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="mentor-dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <PendingAssignments assignments={dashboardData?.pendingAssignments || []} />
          <UpcomingSessions sessions={dashboardData?.upcomingSessions || []} />
        </div>
        
        <div className="space-y-6">
          <MentorStats stats={dashboardData?.stats} />
        </div>
      </div>
    </div>
  );
}
