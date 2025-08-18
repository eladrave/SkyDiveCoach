import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/navigation";
import AvailabilityManager from "@/components/mentor/availability-manager";
import SessionDetailModal from "@/components/session-detail-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Users, Plus, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface Assignment {
  id: string;
  status: "pending" | "confirmed" | "declined" | "cancelled";
  menteeId: string;
  sessionBlockId: string;
  createdAt: string;
}

interface SessionBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  blockCapacityHint: number;
  maxParticipants?: number;
  minSkillLevel?: number;
  drills?: string[];
  comments?: string;
  mentorName?: string;
}

export default function SessionManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionPage, setSessionPage] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const sessionsPerPage = 5;

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect mentees to their specific sessions page
      if (user.role === 'mentee') {
        setLocation("/mentee-sessions");
      } else if (!['mentor', 'admin'].includes(user.role)) {
        setLocation("/login");
      }
    }
  }, [user, authLoading, setLocation]);

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments', user?.id],
    enabled: !!user,
  });

  // Fetch all upcoming session blocks, not just for selected date
  const { data: allSessionBlocks = [] } = useQuery({
    queryKey: ['/api/session-blocks/upcoming'],
    queryFn: async () => {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30); // Get next 30 days
      
      const response = await fetch(
        `/api/session-blocks?startDate=${today.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch session blocks');
      return response.json();
    },
    enabled: !!user,
  });

  // Filter and paginate session blocks
  const upcomingSessionBlocks = allSessionBlocks
    .filter((block: any) => new Date(block.date) >= new Date())
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const totalPages = Math.ceil(upcomingSessionBlocks.length / sessionsPerPage);
  const paginatedSessions = upcomingSessionBlocks.slice(
    sessionPage * sessionsPerPage,
    (sessionPage + 1) * sessionsPerPage
  );

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: string; status: string }) => {
      return await apiRequest('PUT', `/api/assignments/${assignmentId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast({
        title: "Assignment updated",
        description: "The assignment status has been updated successfully.",
      });
    },
  });

  const createSessionBlockMutation = useMutation({
    mutationFn: async (sessionData: { 
      date: string; 
      startTime: string; 
      endTime: string;
      maxParticipants: number;
      minSkillLevel: number;
      drills: string[];
      comments: string;
    }) => {
      return await apiRequest('POST', '/api/session-blocks', sessionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session-blocks'] });
      toast({
        title: "Session created",
        description: "New session block has been created successfully.",
      });
    },
  });

  const deleteSessionBlockMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest('DELETE', `/api/session-blocks/${sessionId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session-blocks'] });
      toast({
        title: "Session deleted",
        description: "Session block has been deleted successfully.",
      });
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/availability`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  const handleAssignmentUpdate = (assignmentId: string, status: string) => {
    updateAssignmentMutation.mutate({ assignmentId, status });
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const drillsString = formData.get('drills') as string;
    const drills = drillsString ? drillsString.split(',').map(d => d.trim()).filter(d => d) : [];
    
    createSessionBlockMutation.mutate({
      date: formData.get('date') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      maxParticipants: parseInt(formData.get('maxParticipants') as string) || 4,
      minSkillLevel: parseInt(formData.get('minSkillLevel') as string) || 0,
      drills: drills,
      comments: formData.get('comments') as string || '',
    });
    
    // Reset form after submission
    (e.target as HTMLFormElement).reset();
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="session-management-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6" data-testid="session-management">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
              <p className="text-gray-600 mt-1">Manage your training sessions and assignments</p>
            </div>
          </div>

          {/* Workflow Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 How Session Assignment Works:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Step 1:</strong> Set your availability and create session blocks</p>
              <p><strong>Step 2:</strong> Mentees can see and request your available sessions</p>
              <p><strong>Step 3:</strong> You'll see their requests in "Pending Assignment Requests" below</p>
              <p><strong>Step 4:</strong> Accept or decline requests - accepted sessions become confirmed training</p>
            </div>
          </div>

          {/* Availability Manager */}
          <AvailabilityManager userId={user?.id || ''} />

      {/* My Session Blocks - Only for mentors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                My Upcoming Session Blocks
              </CardTitle>
              <CardDescription>
                Your next {upcomingSessionBlocks.length} scheduled sessions
              </CardDescription>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSessionPage(Math.max(0, sessionPage - 1))}
                  disabled={sessionPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {sessionPage + 1} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSessionPage(Math.min(totalPages - 1, sessionPage + 1))}
                  disabled={sessionPage === totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No upcoming session blocks</p>
                <p className="text-sm mt-2">Use "Create Session Block" below to add sessions</p>
              </div>
            ) : (
              paginatedSessions.map((block: any) => (
                <div key={block.id} className="border rounded-lg p-4" data-testid={`session-block-${block.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-lg">
                          {block.startTime} - {block.endTime}
                        </p>
                        <Badge variant="outline">Max: {block.maxParticipants || 4} participants</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          📅 Date: {block.date}
                        </p>
                        {block.minSkillLevel > 0 && (
                          <p className="text-sm text-gray-600">
                            🎯 Min skill: {block.minSkillLevel} jumps
                          </p>
                        )}
                        {block.drills && block.drills.length > 0 && (
                          <div className="text-sm text-gray-600">
                            🏋️ Drills: 
                            <span className="ml-1">
                              {block.drills.map((drill: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="mr-1 mt-1">
                                  {drill}
                                </Badge>
                              ))}
                            </span>
                          </div>
                        )}
                        {block.comments && (
                          <p className="text-sm text-gray-600 italic">
                            💬 {block.comments}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setSelectedSessionId(block.id)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteSessionBlockMutation.mutate(block.id)}
                        disabled={deleteSessionBlockMutation.isPending}
                        data-testid={`button-delete-session-${block.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pending Assignment Requests
            </CardTitle>
            <CardDescription>
              Mentees have requested training sessions - Accept or Decline these requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="space-y-2">
                    <p>No pending assignment requests at the moment</p>
                    <p className="text-sm">When mentees request your sessions, they'll appear here for your approval</p>
                  </div>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4 space-y-3" data-testid={`assignment-${assignment.id}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">🪂 Training Session Request</p>
                        <p className="text-sm text-gray-600">Requested: {new Date(assignment.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm text-blue-600 font-medium">A mentee wants to book this session with you</p>
                      </div>
                      <Badge variant="secondary">{assignment.status}</Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleAssignmentUpdate(assignment.id, 'confirmed')}
                        disabled={updateAssignmentMutation.isPending}
                        data-testid={`button-accept-${assignment.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAssignmentUpdate(assignment.id, 'declined')}
                        disabled={updateAssignmentMutation.isPending}
                        data-testid={`button-decline-${assignment.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Session Block */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Session Block
            </CardTitle>
            <CardDescription>
              Create new training session availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={selectedDate}
                  required
                  data-testid="input-session-date"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    defaultValue="09:00"
                    required
                    data-testid="input-start-time"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    defaultValue="17:00"
                    required
                    data-testid="input-end-time"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    name="maxParticipants"
                    type="number"
                    min="1"
                    max="20"
                    defaultValue="4"
                    required
                    data-testid="input-max-participants"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minSkillLevel">Min Skill Level (jumps)</Label>
                  <Input
                    id="minSkillLevel"
                    name="minSkillLevel"
                    type="number"
                    min="0"
                    defaultValue="0"
                    placeholder="Minimum jump count"
                    data-testid="input-min-skill"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="drills">Session Drills</Label>
                <Input
                  id="drills"
                  name="drills"
                  type="text"
                  placeholder="e.g., 2-way belly, exit practice, tracking (comma separated)"
                  data-testid="input-drills"
                />
                <p className="text-xs text-gray-500">Enter drills separated by commas</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comments">Comments/Notes</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  placeholder="Additional information about the session..."
                  rows={3}
                  data-testid="input-comments"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={createSessionBlockMutation.isPending}
                data-testid="button-create-session"
              >
                <Clock className="h-4 w-4 mr-2" />
                {createSessionBlockMutation.isPending ? 'Creating...' : 'Create Session Block'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

        </div>
      </main>
      
      {/* Session Detail Modal */}
      <SessionDetailModal
        sessionId={selectedSessionId}
        isOpen={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  );
}
