import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Award, Target, Activity, Calendar, Plane } from "lucide-react";

interface MenteeProfileModalProps {
  menteeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MenteeProfileModal({ 
  menteeId, 
  isOpen, 
  onClose 
}: MenteeProfileModalProps) {
  
  // Fetch mentee details
  const { data: menteeData, isLoading: menteeLoading } = useQuery({
    queryKey: ['/api/mentees', menteeId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${menteeId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch mentee');
      return response.json();
    },
    enabled: !!menteeId && isOpen,
  });

  // Fetch mentee's badges/awards
  const { data: awards = [] } = useQuery({
    queryKey: ['/api/awards', menteeId],
    queryFn: async () => {
      const response = await fetch(`/api/awards?menteeId=${menteeId}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!menteeId && isOpen,
  });

  // Fetch mentee's progression
  const { data: progression = [] } = useQuery({
    queryKey: ['/api/progression', menteeId],
    queryFn: async () => {
      const response = await fetch(`/api/step-completions?menteeId=${menteeId}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!menteeId && isOpen,
  });

  // Fetch mentee's jump logs
  const { data: jumpLogs = [] } = useQuery({
    queryKey: ['/api/jump-logs', menteeId],
    queryFn: async () => {
      const response = await fetch(`/api/jump-logs?menteeId=${menteeId}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!menteeId && isOpen,
  });

  if (!menteeId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Mentee Profile
          </DialogTitle>
          <DialogDescription>
            View detailed information about this mentee
          </DialogDescription>
        </DialogHeader>

        {menteeLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : menteeData ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{menteeData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{menteeData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">USPA License</p>
                    <p className="font-medium">{menteeData.uspaLicense || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Jumps</p>
                    <p className="font-medium flex items-center gap-1">
                      <Plane className="h-4 w-4" />
                      {menteeData.jumps || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{menteeData.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge variant={menteeData.isActive ? "default" : "secondary"}>
                      {menteeData.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="badges" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="progression">Progression</TabsTrigger>
                <TabsTrigger value="jumps">Recent Jumps</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
              </TabsList>

              {/* Badges Tab */}
              <TabsContent value="badges" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Earned Badges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {awards.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No badges earned yet</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {awards.map((award: any) => (
                          <div key={award.id} className="border rounded-lg p-3 text-center">
                            <div className="text-2xl mb-2">🏆</div>
                            <p className="font-medium text-sm">{award.badge?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(award.awardedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Progression Tab */}
              <TabsContent value="progression" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Skills Progression
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progression.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No progression recorded yet</p>
                    ) : (
                      <div className="space-y-3">
                        {progression.map((step: any) => (
                          <div key={step.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{step.step?.title}</p>
                                <p className="text-sm text-gray-500">{step.step?.category}</p>
                              </div>
                              <Badge variant="default">Completed</Badge>
                            </div>
                            {step.notes && (
                              <p className="text-sm text-gray-600 mt-2">{step.notes}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Completed: {new Date(step.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Jumps Tab */}
              <TabsContent value="jumps" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Jump Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {jumpLogs.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No jump logs recorded</p>
                    ) : (
                      <div className="space-y-3">
                        {jumpLogs.slice(0, 5).map((log: any) => (
                          <div key={log.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Jump #{log.jumpNumber}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(log.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm">Exit: {log.exitAlt || 'N/A'} ft</p>
                                <p className="text-sm">Deploy: {log.deploymentAlt || 'N/A'} ft</p>
                              </div>
                            </div>
                            {log.drillRef && (
                              <p className="text-sm text-gray-600 mt-2">Drill: {log.drillRef}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Training Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Current Goals</p>
                        <p className="text-gray-700">
                          {menteeData.goals || "No specific goals set yet"}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Comfort Level</p>
                        <div className="flex items-center gap-2">
                          <Progress value={
                            menteeData.comfortLevel === 'high' ? 100 :
                            menteeData.comfortLevel === 'medium' ? 60 : 30
                          } className="flex-1" />
                          <Badge variant="outline">
                            {menteeData.comfortLevel || 'Medium'}
                          </Badge>
                        </div>
                      </div>

                      {menteeData.canopySize && (
                        <div>
                          <p className="text-sm text-gray-500">Canopy Size</p>
                          <p className="font-medium">{menteeData.canopySize} sq ft</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <p className="text-center text-gray-500">Failed to load mentee data</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
