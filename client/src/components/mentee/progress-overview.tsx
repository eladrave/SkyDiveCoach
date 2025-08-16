import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar } from "lucide-react";

interface ProgressData {
  completions: any[];
  totalSteps: number;
  totalJumps: number;
  lastJump: string | null;
}

interface ProgressOverviewProps {
  progression?: ProgressData;
}

export default function ProgressOverview({ progression }: ProgressOverviewProps) {
  const defaultProgression = {
    completions: [],
    totalSteps: 0,
    totalJumps: 0,
    lastJump: null,
  };

  const currentProgression = progression || defaultProgression;

  // Calculate progress for different categories
  const twoWayCompletions = currentProgression.completions.filter(c => 
    c.category === "2way"
  ).length;
  const threeWayCompletions = currentProgression.completions.filter(c => 
    c.category === "3way"
  ).length;

  const totalTwoWaySteps = Math.max(12, Math.ceil(currentProgression.totalSteps * 0.6)); // Assume 60% are 2-way
  const totalThreeWaySteps = Math.max(8, Math.floor(currentProgression.totalSteps * 0.4)); // Assume 40% are 3-way

  const twoWayProgress = totalTwoWaySteps > 0 ? (twoWayCompletions / totalTwoWaySteps) * 100 : 0;
  const threeWayProgress = totalThreeWaySteps > 0 ? (threeWayCompletions / totalThreeWaySteps) * 100 : 0;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <Card data-testid="progress-overview">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary-600" />
          Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">2-Way Progression</span>
            <span className="text-sm text-gray-500" data-testid="two-way-progress">
              {twoWayCompletions}/{totalTwoWaySteps} steps
            </span>
          </div>
          <Progress value={twoWayProgress} className="h-2" data-testid="two-way-progress-bar" />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">3-Way Progression</span>
            <span className="text-sm text-gray-500" data-testid="three-way-progress">
              {threeWayCompletions}/{totalThreeWaySteps} steps
            </span>
          </div>
          <Progress 
            value={threeWayProgress} 
            className="h-2" 
            data-testid="three-way-progress-bar"
          />
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Jumps:</span>
              <span className="font-semibold text-gray-900" data-testid="total-jumps">
                {currentProgression.totalJumps}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Jump:</span>
              <span className="font-semibold text-gray-900" data-testid="last-jump">
                {formatDate(currentProgression.lastJump)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
