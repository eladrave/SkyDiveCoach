import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Download, Edit, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Assignment {
  assignment: any;
  mentor: any;
  mentee: any;
  sessionBlock: any;
}

interface AssignmentTableProps {
  assignments: Assignment[];
}

export default function AssignmentTable({ assignments }: AssignmentTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      apiRequest("POST", `/api/assignments/${assignmentId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/admin"] });
      toast({
        title: "Assignment Cancelled",
        description: "The assignment has been cancelled successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel assignment. Please try again.",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => apiRequest("GET", "/api/admin/roster"),
    onSuccess: () => {
      toast({
        title: "Export Started",
        description: "Manifest export has been initiated.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export manifest. Please try again.",
      });
    },
  });

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "TBD";
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "declined":
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <Card data-testid="assignment-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary-600" />
            Recent Assignments
          </CardTitle>
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            variant="outline"
            data-testid="button-export-csv"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8" data-testid="no-assignments">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No assignments found</p>
            <p className="text-sm text-gray-500 mt-1">
              Assignments will appear here once matching is run
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="header-date">Date</TableHead>
                  <TableHead data-testid="header-time">Time</TableHead>
                  <TableHead data-testid="header-mentor">Mentor</TableHead>
                  <TableHead data-testid="header-mentees">Mentees</TableHead>
                  <TableHead data-testid="header-status">Status</TableHead>
                  <TableHead data-testid="header-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.slice(0, 10).map((assignment, index) => (
                  <TableRow key={assignment.assignment?.id || index} data-testid={`assignment-row-${index}`}>
                    <TableCell data-testid={`assignment-date-${index}`}>
                      {formatDate(assignment.sessionBlock?.date)}
                    </TableCell>
                    <TableCell data-testid={`assignment-time-${index}`}>
                      {formatTime(assignment.sessionBlock?.startTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" alt={assignment.mentor?.name} />
                          <AvatarFallback>
                            {getInitials(assignment.mentor?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900" data-testid={`mentor-name-${index}`}>
                            {assignment.mentor?.name || "Unknown Mentor"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-1">
                        <Avatar className="h-6 w-6 border border-white">
                          <AvatarImage src="" alt="Mentee" />
                          <AvatarFallback className="text-xs">
                            {getInitials(assignment.mentee?.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`assignment-status-${index}`}>
                      {getStatusBadge(assignment.assignment?.status || "pending")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-${index}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => assignment.assignment?.id && cancelMutation.mutate(assignment.assignment.id)}
                          disabled={cancelMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-cancel-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
