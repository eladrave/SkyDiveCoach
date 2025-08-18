import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, CalendarCheck, Users, ChevronRight } from "lucide-react";
import SessionDetailModal from "../session-detail-modal";

interface Session {
  assignment: any;
  sessionBlock: any;
}

interface UpcomingSessionsProps {
  sessions: Session[];
}

export default function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
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

  const getDayOfMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate();
  };

  return (
    <Card data-testid="upcoming-sessions">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarCheck className="mr-2 h-5 w-5 text-primary-600" />
          This Week's Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8" data-testid="no-upcoming-sessions">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No upcoming sessions</p>
            <p className="text-sm text-gray-500 mt-1">
              Your confirmed sessions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div
                key={`${session.assignment?.id}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                data-testid={`session-${session.assignment?.id || index}`}
                onClick={() => setSelectedSessionId(session.sessionBlock?.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-primary-600 font-semibold" data-testid={`session-day-${index}`}>
                        {session.sessionBlock ? getDayOfMonth(session.sessionBlock.date) : "?"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900" data-testid={`session-date-${index}`}>
                      {session.sessionBlock ? formatDate(session.sessionBlock.date) : "Date TBD"}
                    </p>
                    <p className="text-sm text-gray-600" data-testid={`session-time-${index}`}>
                      {session.sessionBlock 
                        ? `${formatTime(session.sessionBlock.startTime)} - ${formatTime(session.sessionBlock.endTime)}`
                        : "Time TBD"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900" data-testid={`session-mentees-${index}`}>
                      1 Mentee
                    </p>
                    <p className="text-xs text-gray-500" data-testid={`session-type-${index}`}>
                      2-way progression
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    <Avatar className="w-8 h-8 border-2 border-white">
                      <AvatarImage src="" alt="Mentee" />
                      <AvatarFallback className="text-xs">M</AvatarFallback>
                    </Avatar>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Session Detail Modal */}
      <SessionDetailModal
        sessionId={selectedSessionId}
        isOpen={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </Card>
  );
}
