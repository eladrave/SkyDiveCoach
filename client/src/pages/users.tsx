import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Users,
  Search,
  UserPlus,
  Shield,
  Award,
  Calendar,
  Settings,
  MoreVertical
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  createdAt: string;
}

interface MentorProfile {
  id: string;
  userId: string;
  certificationLevel: string;
  yearsExperience: number;
  specialties: string[];
}

interface MenteeProfile {
  id: string;
  userId: string;
  jumpCount: number;
  comfortLevel: string;
  goals: string;
}

export default function UserManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: mentors = [] } = useQuery({
    queryKey: ['/api/mentors'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: mentees = [] } = useQuery({
    queryKey: ['/api/mentees'],
    enabled: !!user && user.role === 'admin',
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest(`/api/users/${userId}/role`, {
        method: 'PATCH',
        body: { role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User updated",
        description: "User role has been updated successfully.",
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/users/${userId}/deactivate`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User deactivated",
        description: "User has been deactivated successfully.",
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
            <div className="grid grid-cols-1 gap-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const filteredUsers = users.filter((u: User) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getUserProfile = (userId: string, role: string) => {
    if (role === 'mentor') {
      return mentors.find((m: MentorProfile) => m.userId === userId);
    } else if (role === 'mentee') {
      return mentees.find((m: MenteeProfile) => m.userId === userId);
    }
    return null;
  };

  const userStats = {
    total: users.length,
    mentors: users.filter((u: User) => u.role === 'mentor').length,
    mentees: users.filter((u: User) => u.role === 'mentee').length,
    admins: users.filter((u: User) => u.role === 'admin').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6" data-testid="users-page">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage platform users and their roles</p>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mentors</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.mentors}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mentees</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.mentees}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.admins}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="mentor">Mentors</SelectItem>
                <SelectItem value="mentee">Mentees</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {filteredUsers.length} of {users.length} users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No users found matching your criteria
                  </div>
                ) : (
                  filteredUsers.map((user: User) => {
                    const profile = getUserProfile(user.id, user.role);
                    
                    return (
                      <div key={user.id} className="border rounded-lg p-4" data-testid={`user-${user.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-700 font-medium text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{user.name}</h3>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              {profile && user.role === 'mentor' && (
                                <p className="text-xs text-gray-500">
                                  {(profile as MentorProfile).certificationLevel} • {(profile as MentorProfile).yearsExperience} years exp.
                                </p>
                              )}
                              {profile && user.role === 'mentee' && (
                                <p className="text-xs text-gray-500">
                                  {(profile as MenteeProfile).jumpCount} jumps • {(profile as MenteeProfile).comfortLevel} level
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge 
                              variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                              className="capitalize"
                            >
                              {user.role}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
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