import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, RotateCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SessionBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  blockCapacityHint: number;
}

interface CapacityOverviewProps {
  weeklyBlocks: SessionBlock[];
}

export default function CapacityOverview({ weeklyBlocks }: CapacityOverviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const runMatchingMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/match/run"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/admin"] });
      toast({
        title: "Matching Complete",
        description: "Mentor-mentee assignments have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Matching Failed",
        description: "Failed to run the matching algorithm. Please try again.",
      });
    },
  });

  // Group blocks by day of week and create a capacity grid
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const currentWeek = new Date();
  const startOfWeek = new Date(currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1));
  
  const weekData = weekDays.map((day, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    const dateString = date.toISOString().split('T')[0];
    
    const dayBlocks = weeklyBlocks.filter(block => block.date === dateString);
    
    // Generate mock capacity data for display
    const blocks = Array.from({ length: 4 }, (_, blockIndex) => {
      const block = dayBlocks[blockIndex];
      if (!block) return { capacity: 0, used: 0, status: "none" };
      
      // Mock usage data - in real implementation this would come from assignments
      const capacity = block.blockCapacityHint || 8;
      const used = Math.floor(Math.random() * (capacity + 2)); // Can be over capacity
      
      let status = "good";
      if (used >= capacity * 0.8) status = "warning";
      if (used > capacity) status = "over";
      
      return { capacity, used, status, display: `${used}/${capacity}` };
    });
    
    return {
      day,
      date: date.getDate(),
      blocks,
    };
  });

  const getBlockColor = (status: string) => {
    switch (status) {
      case "good": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "over": return "bg-red-500";
      default: return "bg-gray-300";
    }
  };

  return (
    <Card data-testid="capacity-overview">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary-600" />
            Weekly Capacity Overview
          </CardTitle>
          <Button
            onClick={() => runMatchingMutation.mutate()}
            disabled={runMatchingMutation.isPending}
            className="bg-primary-600 hover:bg-primary-700"
            data-testid="button-run-matching"
          >
            <RotateCw className={`mr-2 h-4 w-4 ${runMatchingMutation.isPending ? "animate-spin" : ""}`} />
            Run Matching
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2">
            {weekData.map((dayData) => (
              <div key={dayData.day} className="text-center">
                <div className="text-sm font-medium text-gray-500" data-testid={`day-header-${dayData.day}`}>
                  {dayData.day}
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1" data-testid={`day-date-${dayData.day}`}>
                  {dayData.date}
                </div>
              </div>
            ))}
          </div>
          
          {/* Capacity blocks */}
          <div className="grid grid-cols-7 gap-2">
            {weekData.map((dayData) => (
              <div key={`blocks-${dayData.day}`} className="space-y-1">
                {dayData.blocks.map((block, blockIndex) => (
                  <div
                    key={`${dayData.day}-${blockIndex}`}
                    className={`h-8 rounded text-white text-xs flex items-center justify-center font-medium ${getBlockColor(block.status)}`}
                    data-testid={`capacity-block-${dayData.day}-${blockIndex}`}
                  >
                    {block.status !== "none" ? block.display : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 text-sm pt-4 border-t border-gray-200">
            <div className="flex items-center" data-testid="legend-under-capacity">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-gray-600">Under capacity</span>
            </div>
            <div className="flex items-center" data-testid="legend-near-capacity">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span className="text-gray-600">Near capacity</span>
            </div>
            <div className="flex items-center" data-testid="legend-over-capacity">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span className="text-gray-600">Over capacity</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
