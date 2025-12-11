import Link from 'next/link';
import { PlusCircle, Video as VideoIcon, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Header } from '@/components/header';

export default function Dashboard() {
  const meetings = [
    {
      id: 'M123',
      title: 'Weekly Sync',
      date: 'June 24, 2024',
      time: '10:00 AM',
      status: 'Upcoming',
    },
    {
      id: 'M124',
      title: 'Project Phoenix Kick-off',
      date: 'June 24, 2024',
      time: '2:00 PM',
      status: 'Upcoming',
    },
    {
      id: 'M125',
      title: 'Design Review',
      date: 'June 25, 2024',
      time: '11:30 AM',
      status: 'Upcoming',
    },
    {
      id: 'M121',
      title: 'Q2 All-Hands',
      date: 'June 21, 2024',
      time: '9:00 AM',
      status: 'Completed',
    },
     {
      id: 'M122',
      title: 'Marketing Brainstorm',
      date: 'June 22, 2024',
      time: '1:00 PM',
      status: 'Completed',
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Start an Instant Meeting</CardTitle>
              <CardDescription>Launch a new meeting right away and invite others.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              <Link href="/meeting/new">
                <Button size="lg" className="h-auto p-6">
                  <PlusCircle className="mr-2 h-6 w-6" />
                  <span className="text-lg">New Meeting</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Join a Meeting</CardTitle>
              <CardDescription>Enter a code or link to join an existing meeting.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
               <div className="flex w-full max-w-sm items-center space-x-2">
                  <input type="text" placeholder="Enter meeting code" className="p-3 rounded-md w-full border bg-transparent" />
                  <Link href="/meeting/join-code">
                    <Button type="submit" size="lg">Join</Button>
                  </Link>
                </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Scheduled Meetings</CardTitle>
              <CardDescription>Here are your upcoming and past meetings.</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="#">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Time</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      <div className="font-medium">{meeting.title}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{meeting.date}</TableCell>
                    <TableCell className="hidden sm:table-cell">{meeting.time}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className="text-xs" variant={meeting.status === 'Upcoming' ? 'default' : 'secondary'}>
                        {meeting.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Link href={`/meeting/${meeting.id}`}>
                        <Button variant="outline" size="sm" disabled={meeting.status !== 'Upcoming'}>
                          Join
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
