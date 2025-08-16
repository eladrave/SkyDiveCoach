import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, PlusCircle, Calendar, Clock, Plane, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Session {
  assignment: any;
  mentor: any;
  sessionBlock: any;
}

interface SessionBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  blockCapacityHint: number;
}

interface SessionRequestProps {
  upcomingSessions: Session[];
  availableBlocks: SessionBlock[];
}

export default function SessionRequest({ upcomingSessions, availableBlocks }: SessionRequestProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);

  const requestMutation = useMutation({
    mutationFn: (sessionBlockIds: string[]) => 
      Promise.all(
        sessionBlockIds.map(blockId => 
          apiRequest("POST", "/api/attendance", { session_block_id: blockId })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/mentee", user?.id] });
      setSelectedBlocks([]);
      toast({
        title: "Session Requests Sent",
        description: "Your attendance requests have been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit session requests. Please try again.",
      });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true 
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleBlockSelect = (blockId: string) => {
    setSelectedBlocks(prev => 
      prev.includes(blockId) 
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId]
    );
  };

  const handleRequestSessions = () => {
    if (selectedBlocks.length === 0) {
      toast({
        variant: "destructive",
        title: "No sessions selected",
        description: "Please select at least one session block to request.",
      });
      return;
    }
    requestMutation.mutate(selectedBlocks);
  };

  // Filter available blocks to show only future dates
  const futureBlocks = availableBlocks.filter(block => {
    const blockDate = new Date(block.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return blockDate >= today;
  }).slice(0, 6); // Limit to 6 blocks for display

  return (
    <>
      {/* Upcoming Sessions */}
      <Card data-testid="upcoming-sessions">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarCheck className="mr-2 h-5 w-5 text-primary-600" />
            My Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8" data-testid="no-upcoming-sessions">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No upcoming sessions</p>
              <p className="text-sm text-gray-500 mt-1">
                Request sessions below to get matched with a mentor
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session, index) => (
                <div
                  key={`${session.assignment?.id}-${index}`}
                  className="border border-gray-200 rounded-lg p-4"
                  data-testid={`session-${session.assignment?.id || index}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" alt={session.mentor?.name} />
                          <AvatarFallback>
                            {getInitials(session.mentor?.name || "Unknown")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900" data-testid={`mentor-name-${index}`}>
                            {session.mentor?.name || "Mentor TBD"}
                          </p>
                          <p className="text-sm text-gray-500" data-testid={`mentor-details-${index}`}>
                            USPA Coach • {session.mentor?.uspaLicense} • {session.mentor?.jumps} jumps
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span data-testid={`session-date-${index}`}>
                            {session.sessionBlock ? formatDate(session.sessionBlock.date) : "Date TBD"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          <span data-testid={`session-time-${index}`}>
                            {session.sessionBlock 
                              ? `${formatTime(session.sessionBlock.startTime)} - ${formatTime(session.sessionBlock.endTime)}`
                              : "Time TBD"
                            }
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Plane className="mr-2 h-4 w-4" />
                          <span data-testid={`aircraft-${index}`}>Cessna 182</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          <span data-testid={`drill-type-${index}`}>2-way progression</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800" data-testid={`status-${index}`}>
                        Confirmed
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1" data-testid={`load-info-${index}`}>
                        Load 3 of 4
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Request */}
      <Card data-testid="session-request">
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5 text-primary-600" />
            Request New Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {futureBlocks.map((block) => {
              const isSelected = selectedBlocks.includes(block.id);
              const capacity = Math.floor(Math.random() * 3) + 1; // Mock capacity
              const total = block.blockCapacityHint || 3;
              
              return (
                <div
                  key={block.id}
                  onClick={() => handleBlockSelect(block.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected 
                      ? "border-primary-600 bg-primary-50" 
                      : "border-gray-200 hover:border-primary-300"
                  }`}
                  data-testid={`session-block-${block.id}`}
                >
                  <div className="text-center">
                    <p className="font-medium text-gray-900" data-testid={`block-date-${block.id}`}>
                      {formatDate(block.date)}
                    </p>
                    <p className="text-sm text-gray-600" data-testid={`block-time-${block.id}`}>
                      {formatTime(block.startTime)} - {formatTime(block.endTime)}
                    </p>
                    <div className="mt-2 flex items-center justify-center space-x-2">
                      <div className="flex -space-x-1">
                        {Array.from({ length: total }, (_, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded-full border-2 border-white ${
                              i < capacity ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span 
                        className="text-xs text-gray-500"
                        data-testid={`block-capacity-${block.id}`}
                      >
                        {capacity}/{total} spots
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {futureBlocks.length === 0 && (
            <div className="text-center py-8" data-testid="no-available-blocks">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No session blocks available</p>
              <p className="text-sm text-gray-500 mt-1">
                Check back later for new session opportunities
              </p>
            </div>
          )}

          {futureBlocks.length > 0 && (
            <Button
              onClick={handleRequestSessions}
              disabled={requestMutation.isPending || selectedBlocks.length === 0}
              className="w-full"
              data-testid="button-request-sessions"
            >
              {requestMutation.isPending 
                ? "Submitting Requests..." 
                : `Request ${selectedBlocks.length > 0 ? selectedBlocks.length : ""} Selected Session${selectedBlocks.length === 1 ? "" : "s"}`
              }
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
