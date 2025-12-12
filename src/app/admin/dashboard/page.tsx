'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Video, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Stats {
  totalOrganizations: number;
  totalUsers: number;
  totalMeetings: number;
  activeMeetings: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrganizations: 0,
    totalUsers: 0,
    totalMeetings: 0,
    activeMeetings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();

      // Get total organizations
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // Get total users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total meetings
      const { count: meetingCount } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true });

      // Get active meetings
      const { count: activeMeetingCount } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'live');

      setStats({
        totalOrganizations: orgCount || 0,
        totalUsers: userCount || 0,
        totalMeetings: meetingCount || 0,
        activeMeetings: activeMeetingCount || 0,
      });

      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Organizations',
      value: stats.totalOrganizations,
      icon: Building2,
      description: 'Registered organizations',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      description: 'Active user accounts',
    },
    {
      title: 'Total Meetings',
      value: stats.totalMeetings,
      icon: Video,
      description: 'Meetings created',
    },
    {
      title: 'Active Meetings',
      value: stats.activeMeetings,
      icon: TrendingUp,
      description: 'Currently live',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Activity feed coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Quick actions coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
