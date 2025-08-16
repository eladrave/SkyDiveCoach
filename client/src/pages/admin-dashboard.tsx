import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import CapacityOverview from "@/components/admin/capacity-overview";
import AssignmentTable from "@/components/admin/assignment-table";
import AdminMetrics from "@/components/admin/metrics";

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/admin"],
    enabled: !!user?.id && user.role === "admin",
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="admin-dashboard-loading">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
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
    <div className="space-y-6" data-testid="admin-dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <CapacityOverview weeklyBlocks={dashboardData?.weeklyBlocks || []} />
          <AssignmentTable assignments={dashboardData?.recentAssignments || []} />
        </div>
        
        <div className="space-y-6">
          <AdminMetrics metrics={dashboardData?.metrics} userCounts={dashboardData?.userCounts || []} />
        </div>
      </div>
    </div>
  );
}
