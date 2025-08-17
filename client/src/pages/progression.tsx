import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy,
  CheckCircle,
  Clock,
  BookOpen,
  Target,
  Star,
  Upload
} from "lucide-react";

interface ProgressionStep {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  minJumpsGate: number;
}

interface StepCompletion {
  id: string;
  stepId: string;
  menteeId: string;
  mentorId: string;
  completedAt: string;
  notes: string;
  evidenceUrl?: string;
}

interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface Award {
  id: string;
  badgeId: string;
  awardedAt: string;
  badge: Badge;
}

export default function Progression() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && (!user || !['mentee', 'mentor', 'admin'].includes(user.role))) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const { data: progressionSteps = [], isLoading } = useQuery({
    queryKey: ['/api/progression-steps'],
    enabled: !!user,
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['/api/step-completions', user?.id],
    enabled: !!user,
  });

  const { data: awards = [] } = useQuery({
    queryKey: ['/api/awards', user?.id],
    enabled: !!user,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['/api/badges'],
    enabled: !!user,
  });

  const completeStepMutation = useMutation({
    mutationFn: async (data: { stepId: string; notes: string; evidenceUrl?: string }) => {
      return await apiRequest('/api/step-completions', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/step-completions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/awards'] });
      toast({
        title: "Step completed",
        description: "Progression step has been marked as complete.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const categories = ["all", ...new Set(progressionSteps.map((step: ProgressionStep) => step.category))];
  const filteredSteps = selectedCategory === "all" 
    ? progressionSteps 
    : progressionSteps.filter((step: ProgressionStep) => step.category === selectedCategory);
  
  const completedStepIds = new Set(completions.map((c: StepCompletion) => c.stepId));
  const completionRate = progressionSteps.length > 0 
    ? (completions.length / progressionSteps.length) * 100 
    : 0;

  const handleCompleteStep = (stepId: string, notes: string) => {
    completeStepMutation.mutate({ stepId, notes });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6" data-testid="progression-page">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Progression Tracking</h1>
              <p className="text-gray-600 mt-1">
                {user.role === 'mentee' ? 'Track your skydiving progression and achievements' : 'Monitor mentee progression'}
              </p>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
                <Progress value={completionRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {completions.length} of {progressionSteps.length} steps completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{awards.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Out of {badges.length} available badges
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {completions.filter((c: StepCompletion) => 
                    new Date(c.completedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Steps completed this week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Filter */}
          <div className="flex space-x-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
                data-testid={`filter-${category}`}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Progression Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSteps.map((step: ProgressionStep) => {
              const isCompleted = completedStepIds.has(step.id);
              const completion = completions.find((c: StepCompletion) => c.stepId === step.id);
              
              return (
                <Card key={step.id} className={isCompleted ? "border-green-200 bg-green-50" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-gray-400" />
                        )}
                        {step.title}
                        {step.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      <span className="capitalize">{step.category}</span>
                      {step.minJumpsGate > 0 && ` • Min. ${step.minJumpsGate} jumps`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{step.description}</p>
                    
                    {isCompleted ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-green-700 bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(completion?.completedAt || '').toLocaleDateString()}
                          </span>
                        </div>
                        {completion?.notes && (
                          <p className="text-xs text-gray-600 italic">
                            Notes: {completion.notes}
                          </p>
                        )}
                      </div>
                    ) : user.role === 'mentor' && (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add completion notes..."
                          id={`notes-${step.id}`}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const notes = (document.getElementById(`notes-${step.id}`) as HTMLTextAreaElement)?.value || '';
                            handleCompleteStep(step.id, notes);
                          }}
                          disabled={completeStepMutation.isPending}
                          data-testid={`button-complete-${step.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Badges Section */}
          {awards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Earned Badges
                </CardTitle>
                <CardDescription>
                  Achievements and milestones you've unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {awards.map((award: Award) => (
                    <div key={award.id} className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <Star className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-800">{award.badge.name}</h4>
                        <p className="text-sm text-yellow-600">{award.badge.description}</p>
                        <p className="text-xs text-yellow-500 mt-1">
                          Earned {new Date(award.awardedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}