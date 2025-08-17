import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Users, Plus, CheckCircle, XCircle } from "lucide-react";

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
  endTime:string;
  blockCapacityHint: number;
  assignments: Assignment[];
}

export default function SessionManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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

  const { data: sessionBlocks = [] } = useQuery({
    queryKey: ['/api/session-blocks', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/session-blocks?startDate=${selectedDate}&endDate=${selectedDate}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch session blocks');
      return response.json();
    },
    enabled: !!user,
  });

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
    mutationFn: async (sessionData: { date: string; startTime: string; endTime: string }) => {
      return await apiRequest('POST', '/api/session-blocks', sessionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session-blocks', selectedDate] });
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
    createSessionBlockMutation.mutate({
      date: formData.get('date') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      description: formData.get('description') as string,
      slots: parseInt(formData.get('slots') as string, 10),
    });
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
        <Button 
          onClick={() => updateAvailabilityMutation.mutate({ 
            dayOfWeek: new Date().getDay(),
            startTime: '09:00',
            endTime: '17:00' 
          })}
          data-testid="button-update-availability">
          <Calendar className="h-4 w-4 mr-2" />
          Update Availability
        </Button>
      </div>

      {/* Workflow Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 How Session Assignment Works:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Step 1:</strong> Update your availability and create session blocks (use buttons above and below)</p>
          <p><strong>Step 2:</strong> Mentees can see and request your available sessions</p>
          <p><strong>Step 3:</strong> You'll see their requests in "Pending Assignment Requests" below</p>
          <p><strong>Step 4:</strong> Accept or decline requests - accepted sessions become confirmed training</p>
        </div>
      </div>

      {/* My Session Blocks - Only for mentors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Created Session Blocks
          </CardTitle>
          <CardDescription>
            Session blocks you've created for {selectedDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessionBlocks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No session blocks created for this date</p>
                <p className="text-sm mt-2">Use "Create Session Block" below to add availability</p>
              </div>
            ) : (
              sessionBlocks.map((block: any) => (
                <div key={block.id} className="border rounded-lg p-4" data-testid={`session-block-${block.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {block.startTime} - {block.endTime}
                      </p>
                      <p className="text-sm text-gray-600">
                      Date: {block.date} | Capacity: {block.slots || 8}
                      </p>
                    {block.description && (
                      <p className="text-sm text-gray-500 mt-1">{block.description}</p>
                    )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteSessionBlockMutation.mutate(block.id)}
                        disabled={deleteSessionBlockMutation.isPending}
                        data-testid={`button-delete-session-${block.id}`}
                      >
                        <XCircle className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  {block.assignments && block.assignments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2">Signed-up Mentees:</h4>
                      <ul className="space-y-2">
                        {block.assignments.map((assignment: any) => (
                          <li key={assignment.assignment.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span>{assignment.mentee.email}</span>
                              <div className="text-xs text-gray-500">
                                Progression: {assignment.mentee.progression.completedSteps} steps
                                | Badges: {assignment.mentee.awards.length}
                              </div>
                            </div>
                            <Badge variant={assignment.assignment.status === 'confirmed' ? 'default' : 'secondary'}>
                              {assignment.assignment.status}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {block.suggestedExercises && block.suggestedExercises.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2">Suggested Exercises:</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {block.suggestedExercises.map((exercise: any) => (
                          <li key={exercise.id}>- {exercise.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                    data-testid="input-end-time"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="e.g., 2-way FS skills"
                  data-testid="input-session-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slots">Slots</Label>
                <Input
                  id="slots"
                  name="slots"
                  type="number"
                  defaultValue="8"
                  data-testid="input-session-slots"
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

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Sessions</CardTitle>
          <CardDescription>
            View scheduled sessions for {new Date(selectedDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessionBlocks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sessions scheduled for this date
              </div>
            ) : (
              sessionBlocks.map((session: SessionBlock & { mentorName?: string }) => (
                <div key={session.id} className="border rounded-lg p-4" data-testid={`session-${session.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{session.startTime} - {session.endTime}</p>
                      <p className="text-sm text-gray-600">Capacity: {session.blockCapacityHint} students</p>
                      {session.mentorName && (
                        <p className="text-sm text-blue-600">👨‍✈️ Mentor: {session.mentorName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Available</Badge>

                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}