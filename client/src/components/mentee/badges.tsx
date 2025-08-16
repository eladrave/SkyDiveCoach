import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, RotateCw, Target, Lock } from "lucide-react";

interface Award {
  id: string;
  badgeId: string;
  awardedAt: string;
}

interface BadgesDisplayProps {
  awards: Award[];
}

export default function BadgesDisplay({ awards }: BadgesDisplayProps) {
  // Define available badges with their criteria
  const availableBadges = [
    {
      id: "first-star",
      name: "First Star",
      description: "Complete your first progression step",
      icon: Star,
      color: "from-yellow-50 to-yellow-100",
      iconColor: "bg-yellow-500",
      textColor: "text-yellow-600",
    },
    {
      id: "donut-spinner",
      name: "Donut Spinner",
      description: "Master basic turning maneuvers",
      icon: RotateCw,
      color: "from-blue-50 to-blue-100",
      iconColor: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      id: "pod-master",
      name: "Pod Master",
      description: "Excel in formation flying",
      icon: Target,
      color: "from-green-50 to-green-100",
      iconColor: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      id: "orbit-ace",
      name: "Orbit Ace",
      description: "Complete advanced orbital maneuvers",
      icon: Trophy,
      color: "from-purple-50 to-purple-100",
      iconColor: "bg-purple-500",
      textColor: "text-purple-600",
    },
  ];

  const earnedBadgeIds = awards.map(award => award.badgeId);

  return (
    <>
      {/* Earned Badges */}
      <Card data-testid="earned-badges">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
            Earned Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {availableBadges.map((badge) => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              const Icon = badge.icon;
              
              return (
                <div
                  key={badge.id}
                  className={`text-center p-3 rounded-lg ${
                    isEarned 
                      ? `bg-gradient-to-br ${badge.color}` 
                      : "bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300"
                  }`}
                  data-testid={`badge-${badge.id}`}
                >
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    isEarned ? badge.iconColor : "bg-gray-300"
                  }`}>
                    {isEarned ? (
                      <Icon className="text-white text-lg w-6 h-6" />
                    ) : (
                      <Lock className="text-gray-500 text-lg w-6 h-6" />
                    )}
                  </div>
                  <p className={`text-xs font-medium ${
                    isEarned ? "text-gray-900" : "text-gray-500"
                  }`} data-testid={`badge-name-${badge.id}`}>
                    {isEarned ? badge.name : "Locked"}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card data-testid="next-steps">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm" data-testid="next-step-number">
                    8
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900" data-testid="next-step-title">
                  2-Way Side Slide
                </p>
                <p className="text-xs text-gray-500" data-testid="next-step-description">
                  Practice side-by-side sliding movement
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm" data-testid="next-step-number-2">
                    9
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900" data-testid="next-step-title-2">
                  Back Loop Practice
                </p>
                <p className="text-xs text-gray-500" data-testid="next-step-description-2">
                  Master controlled back loop maneuvers
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
