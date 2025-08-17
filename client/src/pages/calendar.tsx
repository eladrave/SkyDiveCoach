import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [sessionBlocks, setSessionBlocks] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: availability, isLoading } = useQuery({
    queryKey: ["/api/calendar/availability", month.getFullYear(), month.getMonth() + 1],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar/availability?year=${month.getFullYear()}&month=${month.getMonth() + 1}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }
      return response.json();
    },
    enabled: !!user,
  });

  const requestMutation = useMutation({
    mutationFn: (sessionBlockId: string) =>
      apiRequest("POST", "/api/attendance", { session_block_id: sessionBlockId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/mentee", user?.id] });
      setIsModalOpen(false);
      toast({
        title: "Session Request Sent",
        description: "Your attendance request has been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit session request. Please try again.",
      });
    },
  });

  const handleDayClick = async (day: Date) => {
    setSelectedDay(day);
    const dateString = day.toISOString().split("T")[0];
    const response = await fetch(`/api/sessions/day/${dateString}`);
    if (response.ok) {
      const data = await response.json();
      setSessionBlocks(data);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Calendar</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <DayPicker
            month={month}
            onMonthChange={setMonth}
            onDayClick={handleDayClick}
            modifiers={{
              green: (date) => {
                if (!availability) return false;
                const day = date.getDate();
                return availability[day] && availability[day].filledSlots === 0;
              },
              yellow: (date) => {
                if (!availability) return false;
                const day = date.getDate();
                return availability[day] && availability[day].filledSlots > 0 && availability[day].totalSlots > availability[day].filledSlots;
              },
              red: (date) => {
                if (!availability) return false;
                const day = date.getDate();
                return availability[day] && availability[day].totalSlots === availability[day].filledSlots;
              },
            }}
            modifiersClassNames={{
              green: "bg-green-200",
              yellow: "bg-yellow-200",
              red: "bg-red-200",
            }}
          />
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Available Sessions for {selectedDay?.toLocaleDateString()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {sessionBlocks.map((block) => (
                <div key={block.id} className="border rounded-lg p-4">
                  <p className="font-semibold">{block.startTime} - {block.endTime}</p>
                  <p className="text-sm text-gray-600">{block.description}</p>
                  <p className="text-sm text-gray-600">Mentor: {block.mentor.user.name}</p>
                  <p className="text-sm text-gray-600">
                    Slots: {block.assignments.filter((a: any) => a.assignment.status === 'confirmed').length} / {block.slots}
                  </p>
                  <Button
                    className="mt-2"
                    onClick={() => requestMutation.mutate(block.id)}
                    disabled={requestMutation.isPending}
                  >
                    Request Session
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
