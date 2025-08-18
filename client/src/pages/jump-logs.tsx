import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Plane, Parachute, Clock, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface JumpLog {
  id: string;
  menteeId: string;
  date: string;
  jumpNumber: number;
  aircraft: string;
  exitAlt: number;
  freefallTime: number;
  deploymentAlt: number;
  patternNotes?: string;
  drillRef?: string;
  mentorId?: string;
  mentorName?: string;
  createdAt: string;
}

export default function JumpLogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingJump, setEditingJump] = useState<JumpLog | null>(null);

  const { data: jumpLogs = [], isLoading } = useQuery<JumpLog[]>({
    queryKey: ['/api/jump-logs', user?.id],
    enabled: !!user,
  });

  const { data: myProfile } = useQuery({
    queryKey: ['/api/users/profile'],
    enabled: !!user,
  });

  const createJumpMutation = useMutation({
    mutationFn: async (jumpData: Partial<JumpLog>) => {
      return await apiRequest('POST', '/api/jump-logs', jumpData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jump-logs'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Jump logged",
        description: "Your jump has been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log jump. Please try again.",
      });
    },
  });

  const updateJumpMutation = useMutation({
    mutationFn: async ({ id, ...jumpData }: Partial<JumpLog>) => {
      return await apiRequest('PUT', `/api/jump-logs/${id}`, jumpData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jump-logs'] });
      setEditingJump(null);
      toast({
        title: "Jump updated",
        description: "Your jump log has been updated successfully.",
      });
    },
  });

  const deleteJumpMutation = useMutation({
    mutationFn: async (jumpId: string) => {
      return await apiRequest('DELETE', `/api/jump-logs/${jumpId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jump-logs'] });
      toast({
        title: "Jump deleted",
        description: "Jump log has been removed.",
      });
    },
  });

  const handleSubmitJump = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const jumpData = {
      date: formData.get('date') as string,
      jumpNumber: parseInt(formData.get('jumpNumber') as string),
      aircraft: formData.get('aircraft') as string,
      exitAlt: parseInt(formData.get('exitAlt') as string),
      freefallTime: parseInt(formData.get('freefallTime') as string),
      deploymentAlt: parseInt(formData.get('deploymentAlt') as string),
      patternNotes: formData.get('patternNotes') as string,
      drillRef: formData.get('drillRef') as string,
    };

    if (editingJump) {
      updateJumpMutation.mutate({ id: editingJump.id, ...jumpData });
    } else {
      createJumpMutation.mutate(jumpData);
    }
  };

  const currentJumpCount = myProfile?.jumps || 0;
  const nextJumpNumber = jumpLogs.length > 0 
    ? Math.max(...jumpLogs.map(j => j.jumpNumber)) + 1 
    : currentJumpCount + 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Jump Logs</h1>
              <p className="text-gray-600 mt-1">Track your skydiving progression</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Log New Jump
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingJump ? "Edit Jump Log" : "Log New Jump"}
                  </DialogTitle>
                  <DialogDescription>
                    Record the details of your skydiving jump
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitJump} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        defaultValue={editingJump?.date || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="jumpNumber">Jump Number</Label>
                      <Input
                        id="jumpNumber"
                        name="jumpNumber"
                        type="number"
                        defaultValue={editingJump?.jumpNumber || nextJumpNumber}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="aircraft">Aircraft</Label>
                    <Input
                      id="aircraft"
                      name="aircraft"
                      placeholder="e.g., Cessna 182, Twin Otter"
                      defaultValue={editingJump?.aircraft || ""}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="exitAlt">Exit Altitude (ft)</Label>
                      <Input
                        id="exitAlt"
                        name="exitAlt"
                        type="number"
                        defaultValue={editingJump?.exitAlt || 13500}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="deploymentAlt">Deployment (ft)</Label>
                      <Input
                        id="deploymentAlt"
                        name="deploymentAlt"
                        type="number"
                        defaultValue={editingJump?.deploymentAlt || 3500}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="freefallTime">Freefall (sec)</Label>
                      <Input
                        id="freefallTime"
                        name="freefallTime"
                        type="number"
                        defaultValue={editingJump?.freefallTime || 60}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="drillRef">Drill/Skill Reference</Label>
                    <Input
                      id="drillRef"
                      name="drillRef"
                      placeholder="e.g., 3W-05, 4W-10"
                      defaultValue={editingJump?.drillRef || ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="patternNotes">Landing Pattern Notes</Label>
                    <Textarea
                      id="patternNotes"
                      name="patternNotes"
                      placeholder="Describe your landing pattern, accuracy, and any notes..."
                      defaultValue={editingJump?.patternNotes || ""}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setEditingJump(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingJump ? "Update" : "Log"} Jump
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Jumps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jumpLogs.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Freefall Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(jumpLogs.reduce((acc, j) => acc + j.freefallTime, 0) / 60)} min
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Average Deployment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jumpLogs.length > 0 
                    ? Math.round(jumpLogs.reduce((acc, j) => acc + j.deploymentAlt, 0) / jumpLogs.length)
                    : 0} ft
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Last Jump
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {jumpLogs.length > 0 
                    ? new Date(jumpLogs[0].date).toLocaleDateString()
                    : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jump Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Jump History</CardTitle>
              <CardDescription>
                Your complete skydiving logbook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>
                  {jumpLogs.length === 0 
                    ? "No jumps logged yet. Click 'Log New Jump' to get started!"
                    : `Showing ${jumpLogs.length} jump${jumpLogs.length === 1 ? '' : 's'}`}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jump #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Aircraft</TableHead>
                    <TableHead>Exit Alt</TableHead>
                    <TableHead>Deploy Alt</TableHead>
                    <TableHead>Freefall</TableHead>
                    <TableHead>Drill</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jumpLogs.map((jump) => (
                    <TableRow key={jump.id}>
                      <TableCell className="font-medium">{jump.jumpNumber}</TableCell>
                      <TableCell>{new Date(jump.date).toLocaleDateString()}</TableCell>
                      <TableCell>{jump.aircraft}</TableCell>
                      <TableCell>{jump.exitAlt.toLocaleString()} ft</TableCell>
                      <TableCell>{jump.deploymentAlt.toLocaleString()} ft</TableCell>
                      <TableCell>{jump.freefallTime} sec</TableCell>
                      <TableCell>
                        {jump.drillRef && (
                          <Badge variant="outline">{jump.drillRef}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{jump.mentorName || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingJump(jump);
                              setIsAddDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteJumpMutation.mutate(jump.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
