import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, TrendingUp, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface UserCount {
  role: string;
  count: number;
}

interface Metrics {
  activeUsers: number;
  weeklyJumps: number;
  pendingRequests: number;
}

interface AdminMetricsProps {
  metrics?: Metrics;
  userCounts: UserCount[];
}

export default function AdminMetrics({ metrics, userCounts }: AdminMetricsProps) {
  const defaultMetrics = {
    activeUsers: 0,
    weeklyJumps: 0,
    pendingRequests: 0,
  };

  const currentMetrics = metrics || defaultMetrics;

  return (
    <>
      {/* Key Metrics */}
      <Card data-testid="key-metrics">
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <p className="text-2xl font-bold text-primary-600" data-testid="metric-active-users">
              {currentMetrics.activeUsers}
            </p>
            <p className="text-sm text-gray-600">Active Users</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600" data-testid="metric-weekly-jumps">
              {currentMetrics.weeklyJumps}
            </p>
            <p className="text-sm text-gray-600">Jumps This Week</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600" data-testid="metric-pending-requests">
              {currentMetrics.pendingRequests}
            </p>
            <p className="text-sm text-gray-600">Pending Requests</p>
          </div>
        </CardContent>
      </Card>

      {/* User Breakdown */}
      {userCounts.length > 0 && (
        <Card data-testid="user-breakdown">
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userCounts.map((userCount) => (
              <div key={userCount.role} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize" data-testid={`role-label-${userCount.role}`}>
                  {userCount.role}s
                </span>
                <span className="text-sm font-medium text-gray-900" data-testid={`role-count-${userCount.role}`}>
                  {userCount.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Admin Tools */}
      <Card data-testid="admin-tools">
        <CardHeader>
          <CardTitle>Admin Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            data-testid="button-manage-users"
          >
            <Users className="mr-3 h-4 w-4" />
            Manage Users
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            data-testid="button-session-settings"
          >
            <Settings className="mr-3 h-4 w-4" />
            Session Settings
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            data-testid="button-progression-setup"
          >
            <TrendingUp className="mr-3 h-4 w-4" />
            Progression Setup
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            data-testid="button-reports"
          >
            <FileText className="mr-3 h-4 w-4" />
            Reports
          </Button>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card data-testid="system-status">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Matching Service</span>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-green-600" data-testid="status-matching">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Database</span>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-green-600" data-testid="status-database">Healthy</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Email Service</span>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm text-yellow-600" data-testid="status-email">Warning</span>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500" data-testid="last-sync">
              Last sync: 5 minutes ago
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
