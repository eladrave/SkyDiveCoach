import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Trash2, Plus, Edit2 } from "lucide-react";
import { useState } from "react";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

interface Availability {
  id: string;
  userId: string;
  role: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
  isRecurring: boolean;
  capacityOverride?: number;
}

export default function AvailabilityManager({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: availabilities = [], isLoading } = useQuery<Availability[]>({
    queryKey: ['/api/availability', userId],
    queryFn: async () => {
      const response = await fetch(`/api/availability?user_id=${userId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    },
    enabled: !!userId,
  });

  const createAvailabilityMutation = useMutation({
    mutationFn: async (data: Partial<Availability>) => {
      return await apiRequest('POST', '/api/availability', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
      toast({
        title: "Success",
        description: "Availability added successfully",
      });
      setIsAddingNew(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add availability",
        variant: "destructive",
      });
    },
  });

  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/availability/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
      toast({
        title: "Success",
        description: "Availability deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete availability",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    createAvailabilityMutation.mutate({
      dayOfWeek: parseInt(formData.get('dayOfWeek') as string),
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      isRecurring: formData.get('isRecurring') === 'on',
      startDate: formData.get('startDate') as string || undefined,
      endDate: formData.get('endDate') as string || undefined,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Availability
          </span>
          <Button
            size="sm"
            onClick={() => setIsAddingNew(!isAddingNew)}
            variant={isAddingNew ? "secondary" : "default"}
          >
            {isAddingNew ? (
              <>Cancel</>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add Availability
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Manage your weekly availability for training sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAddingNew && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <select
                  id="dayOfWeek"
                  name="dayOfWeek"
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    required
                    defaultValue="09:00"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    required
                    defaultValue="17:00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="isRecurring" name="isRecurring" defaultChecked />
                <Label htmlFor="isRecurring">Recurring Weekly</Label>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={createAvailabilityMutation.isPending}>
                <Plus className="h-4 w-4 mr-1" />
                Add Availability
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingNew(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {availabilities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No availability set yet</p>
              <p className="text-sm mt-2">Click "Add Availability" to set your schedule</p>
            </div>
          ) : (
            availabilities.map((availability) => (
              <div
                key={availability.id}
                className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">
                      {DAYS_OF_WEEK[availability.dayOfWeek]}
                    </p>
                    {availability.isRecurring && (
                      <Badge variant="secondary" className="text-xs">
                        Recurring
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {availability.startTime} - {availability.endTime}
                    </span>
                    {availability.startDate && (
                      <span>
                        From: {new Date(availability.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {availability.endDate && (
                      <span>
                        Until: {new Date(availability.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteAvailabilityMutation.mutate(availability.id)}
                    disabled={deleteAvailabilityMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
