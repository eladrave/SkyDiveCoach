import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, CheckCircle } from "lucide-react";

interface SessionBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  mentorName?: string;
  mentorId: string;
  blockCapacityHint?: number;
}

export default function MenteeSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: sessionBlocks = [], isLoading } = useQuery({
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

  const { data: myRequests = [] } = useQuery({
    queryKey: ['/api/assignments', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/assignments', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    },
    enabled: !!user,
  });

  const requestSessionMutation = useMutation({
    mutationFn: async (sessionBlockId: string) => {
      return await apiRequest('POST', '/api/attendance', { session_block_id: sessionBlockId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/mentee'] });
      toast({
        title: "Session Requested",
        description: "Your session request has been sent to the mentor for approval.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "Unable to request this session. Please try again.",
      });
    },
  });

  const handleRequestSession = (sessionBlockId: string) => {
    requestSessionMutation.mutate(sessionBlockId);
  };

  const isSessionRequested = (sessionBlockId: string) => {
    return myRequests.some((req: any) => 
      req.sessionBlockId === sessionBlockId || req.session_block_id === sessionBlockId
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6" data-testid="mentee-sessions">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Available Training Sessions</h1>
            <p className="text-gray-600 mt-1">Browse and request available training sessions with mentors</p>
          </div>

          {/* How it Works */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">How to Book a Session</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-blue-800">
                <li><strong>Step 1:</strong> Browse available sessions below</li>
                <li><strong>Step 2:</strong> Click "Request Session" on your preferred time slot</li>
                <li><strong>Step 3:</strong> Wait for mentor approval (you'll be notified)</li>
                <li><strong>Step 4:</strong> Once approved, the session will appear in your dashboard</li>
              </ol>
            </CardContent>
          </Card>

          {/* My Requested Sessions */}
          {myRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  My Session Requests
                </CardTitle>
                <CardDescription>
                  Sessions you've requested (awaiting mentor approval)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myRequests.map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Session Request</p>
                        <p className="text-sm text-gray-600">
                          Status: <Badge variant={request.status === 'confirmed' ? 'default' : 'secondary'}>
                            {request.status}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Available Sessions for {selectedDate}
              </CardTitle>
              <CardDescription>
                Click on a session to request training with that mentor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessionBlocks.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No sessions available for this date</p>
                    <p className="text-sm mt-2">Check back later or try a different date</p>
                  </div>
                ) : (
                  sessionBlocks.map((block: SessionBlock) => {
                    const requested = isSessionRequested(block.id);
                    return (
                      <div 
                        key={block.id} 
                        className={`border rounded-lg p-4 space-y-3 ${
                          requested ? 'bg-gray-50 border-gray-300' : 'hover:border-blue-300 hover:shadow-sm transition-all'
                        }`}
                        data-testid={`session-block-${block.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <p className="font-medium">
                                {block.startTime} - {block.endTime}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <p className="text-sm text-gray-600">
                                Mentor: {block.mentorName || 'Loading...'}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">
                              Capacity: {block.blockCapacityHint || 8} skydivers
                            </p>
                          </div>
                          {requested && (
                            <Badge variant="secondary">Requested</Badge>
                          )}
                        </div>
                        
                        {!requested && (
                          <Button
                            className="w-full"
                            onClick={() => handleRequestSession(block.id)}
                            disabled={requestSessionMutation.isPending}
                            data-testid={`button-request-${block.id}`}
                          >
                            Request Session
                          </Button>
                        )}
                        
                        {requested && (
                          <div className="text-center text-sm text-gray-500 py-2">
                            ✓ You've requested this session - awaiting mentor approval
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}