import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Users, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Assignment {
  assignment: any;
  mentee: any;
  sessionBlock: any;
}

interface PendingAssignmentsProps {
  assignments: Assignment[];
}

export default function PendingAssignments({ assignments }: PendingAssignmentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      apiRequest("POST", `/api/assignments/${assignmentId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/mentor", user?.id] });
      toast({
        title: "Assignment Confirmed",
        description: "You have successfully confirmed the assignment.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to confirm assignment. Please try again.",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      apiRequest("POST", `/api/assignments/${assignmentId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/mentor", user?.id] });
      toast({
        title: "Assignment Declined",
        description: "The assignment has been declined and will be reassigned.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to decline assignment. Please try again.",
      });
    },
  });

  const handleConfirm = (assignmentId: string) => {
    confirmMutation.mutate(assignmentId);
  };

  const handleDecline = (assignmentId: string) => {
    declineMutation.mutate(assignmentId);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      weekday: "long", 
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

  return (
    <Card data-testid="pending-assignments">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5 text-orange-500" />
          Pending Assignments
          <Badge variant="secondary" className="ml-2">
            {assignments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8" data-testid="no-pending-assignments">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No pending assignments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((item) => (
              <div
                key={item.assignment.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                data-testid={`assignment-${item.assignment.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={item.mentee?.name} />
                        <AvatarFallback>
                          {getInitials(item.mentee?.name || "Unknown")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900" data-testid={`mentee-name-${item.assignment.id}`}>
                          {item.mentee?.name || "Unknown Mentee"}
                        </p>
                        <p className="text-sm text-gray-500" data-testid={`mentee-details-${item.assignment.id}`}>
                          {item.mentee?.uspaLicense} • {item.mentee?.jumps} jumps
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span data-testid={`session-date-${item.assignment.id}`}>
                          {item.sessionBlock ? formatDate(item.sessionBlock.date) : "Date TBD"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        <span data-testid={`session-time-${item.assignment.id}`}>
                          {item.sessionBlock 
                            ? `${formatTime(item.sessionBlock.startTime)} - ${formatTime(item.sessionBlock.endTime)}`
                            : "Time TBD"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleConfirm(item.assignment.id)}
                      disabled={confirmMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      data-testid={`button-confirm-${item.assignment.id}`}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Confirm
                    </Button>
                    <Button
                      onClick={() => handleDecline(item.assignment.id)}
                      disabled={declineMutation.isPending}
                      variant="outline"
                      size="sm"
                      data-testid={`button-decline-${item.assignment.id}`}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
