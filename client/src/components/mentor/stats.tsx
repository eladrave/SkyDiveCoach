import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, CalendarPlus, ClipboardList, BarChart3, Star } from "lucide-react";

interface MentorStatsProps {
  stats?: {
    monthlyJumps?: number;
    studentsTrained?: number;
    signoffs?: number;
    rating?: number;
    activeMentees?: number;
    completedSessions?: number;
    avgRating?: number;
    totalHours?: number;
  };
}

export default function MentorStats({ stats }: MentorStatsProps) {
  const defaultStats = {
    monthlyJumps: 0,
    studentsTrained: 0,
    signoffs: 0,
    rating: 0,
    activeMentees: 0,
    completedSessions: 0,
    avgRating: 0,
    totalHours: 0,
  };

  const currentStats = { ...defaultStats, ...stats };

  return (
    <>
      {/* Stats Card */}
      <Card data-testid="mentor-stats">
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Active Mentees</span>
            <span className="text-lg font-semibold text-gray-900" data-testid="active-mentees">
              {currentStats.activeMentees || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Completed Sessions</span>
            <span className="text-lg font-semibold text-gray-900" data-testid="completed-sessions">
              {currentStats.completedSessions || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Hours</span>
            <span className="text-lg font-semibold text-gray-900" data-testid="total-hours">
              {currentStats.totalHours || 0} hrs
            </span>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Rating</span>
              <div className="flex items-center">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.floor(currentStats.avgRating || currentStats.rating || 0) ? "fill-current" : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600" data-testid="rating-value">
                  {(currentStats.avgRating || currentStats.rating || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card data-testid="quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full justify-center"
            data-testid="button-update-availability"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Update Availability
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-center"
            data-testid="button-log-jump"
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Log Jump
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-center"
            data-testid="button-view-progress"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Student Progress
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card data-testid="recent-activity">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-600 text-sm"></i>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900" data-testid="activity-description">
                  No recent activity
                </p>
                <p className="text-xs text-gray-500" data-testid="activity-time">
                  Start mentoring to see activity here
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
