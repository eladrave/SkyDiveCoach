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
  endTime: string;
  blockCapacityHint: number;
}

export default function SessionManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!authLoading && (!user || !['mentor', 'admin'].includes(user.role))) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['/api/assignments', user?.id],
    enabled: !!user,
  });

  const { data: sessionBlocks = [] } = useQuery({
    queryKey: ['/api/session-blocks', selectedDate],
    enabled: !!user,
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: string; status: string }) => {
      return await apiRequest(`/api/assignments/${assignmentId}/status`, {
        method: 'PATCH',
        body: { status },
      });
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
      return await apiRequest('/api/session-blocks', {
        method: 'POST',
        body: sessionData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session-blocks'] });
      toast({
        title: "Session created",
        description: "New session block has been created successfully.",
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
        <Button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
          <Calendar className="h-4 w-4 mr-2" />
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pending Assignments
            </CardTitle>
            <CardDescription>
              Review and respond to mentee assignment requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending assignments at the moment
                </div>
              ) : (
                assignments.map((assignment: Assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4 space-y-3" data-testid={`assignment-${assignment.id}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Session Assignment</p>
                        <p className="text-sm text-gray-600">{new Date(assignment.createdAt).toLocaleDateString()}</p>
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
              sessionBlocks.map((session: SessionBlock) => (
                <div key={session.id} className="border rounded-lg p-4" data-testid={`session-${session.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{session.startTime} - {session.endTime}</p>
                      <p className="text-sm text-gray-600">Capacity: {session.blockCapacityHint} students</p>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
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