import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import SessionRequest from "@/components/mentee/session-request";
import ProgressOverview from "@/components/mentee/progress-overview";
import BadgesDisplay from "@/components/mentee/badges";

export default function MenteeDashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/mentee", user?.id],
    enabled: !!user?.id,
  });

  const { data: sessionBlocks } = useQuery({
    queryKey: ["/api/sessions"],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="mentee-dashboard-loading">
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
    <div className="space-y-6" data-testid="mentee-dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <SessionRequest 
            upcomingSessions={dashboardData?.upcomingSessions || []} 
            availableBlocks={sessionBlocks || []}
          />
        </div>
        
        <div className="space-y-6">
          <ProgressOverview progression={dashboardData?.progression} />
          <BadgesDisplay awards={dashboardData?.awards || []} />
        </div>
      </div>
    </div>
  );
}
