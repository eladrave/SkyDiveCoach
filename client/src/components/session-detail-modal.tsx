import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MenteeProfileModal from "./mentee-profile-modal";
import { Calendar, Clock, Users, User, Info, Target } from "lucide-react";

interface SessionDetailModalProps {
  sessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionDetailModal({ 
  sessionId, 
  isOpen, 
  onClose 
}: SessionDetailModalProps) {
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  
  // Fetch session details including assignments
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/session-blocks', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/session-blocks/${sessionId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch session');
      return response.json();
    },
    enabled: !!sessionId && isOpen,
  });

  // Use assignments from sessionData if available
  const assignments = sessionData?.assignments || [];
  const mentees = assignments
    .filter((a: any) => a.status === 'confirmed')
    .map((a: any) => ({
      id: a.menteeId,
      email: a.mentee?.email || 'Unknown',
      firstName: a.mentee?.firstName || '',
      lastName: a.mentee?.lastName || '',
      name: `${a.mentee?.firstName || ''} ${a.mentee?.lastName || ''}`.trim() || a.mentee?.email || 'Unknown',
      assignmentId: a.id,
      status: a.status,
    }));

  if (!sessionId) return null;

  const confirmedCount = assignments.filter((a: any) => a.status === 'confirmed').length;
  const pendingCount = assignments.filter((a: any) => a.status === 'pending').length;

  return (
    <>
      <Dialog open={isOpen && !selectedMenteeId} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Session Details
            </DialogTitle>
            <DialogDescription>
              View and manage session information and participants
            </DialogDescription>
          </DialogHeader>

          {sessionLoading ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : sessionData ? (
            <div className="space-y-6">
              {/* Session Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(sessionData.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {sessionData.startTime} - {sessionData.endTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-medium flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {confirmedCount} / {sessionData.maxParticipants || 4} participants
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex gap-2">
                        {confirmedCount < (sessionData.maxParticipants || 4) ? (
                          <Badge variant="default">Open</Badge>
                        ) : (
                          <Badge variant="secondary">Full</Badge>
                        )}
                        {pendingCount > 0 && (
                          <Badge variant="outline">{pendingCount} pending</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {sessionData.minSkillLevel > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Minimum Skill Requirement</p>
                      <p className="font-medium flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {sessionData.minSkillLevel} jumps minimum
                      </p>
                    </div>
                  )}

                  {sessionData.drills && sessionData.drills.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Planned Drills</p>
                      <div className="flex flex-wrap gap-2">
                        {sessionData.drills.map((drill: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {drill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {sessionData.comments && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="text-gray-700 mt-1">{sessionData.comments}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Participants */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants ({confirmedCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mentees.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No confirmed participants yet</p>
                  ) : (
                    <div className="space-y-3">
                      {mentees.map((mentee: any) => (
                        <div 
                          key={mentee.id} 
                          className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 rounded-full p-2">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{mentee.name}</p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span>{mentee.email}</span>
                                  <span>•</span>
                                  <span>{mentee.jumps || 0} jumps</span>
                                  {mentee.uspaLicense && (
                                    <>
                                      <span>•</span>
                                      <span>{mentee.uspaLicense}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedMenteeId(mentee.id)}
                            >
                              <Info className="h-4 w-4 mr-1" />
                              View Profile
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingCount > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        {pendingCount} pending request{pendingCount > 1 ? 's' : ''} awaiting approval
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-center text-gray-500">Failed to load session data</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Mentee Profile Modal */}
      <MenteeProfileModal
        menteeId={selectedMenteeId}
        isOpen={!!selectedMenteeId}
        onClose={() => setSelectedMenteeId(null)}
      />
    </>
  );
}
