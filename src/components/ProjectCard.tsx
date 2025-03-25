import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, User, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Project interface
interface Project {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  solution_id?: string;
  solution?: {
    name: string;
  };
  offer_id?: string;
  offer?: {
    id: string;
    customer_name: string;
    title?: string;
    value?: number;
  };
  client?: {
    id: string;
    name: string;
  };
  requested_by?: {
    id: string;
    full_name: string;
  };
  assigned_to?: {
    id: string;
    full_name: string;
  };
  comments_count: number;
  due_date?: string;
}

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'default';
    case 'REJECTED': return 'destructive';
    case 'PENDING': return 'secondary';
    case 'IN_PROGRESS': return 'outline';
    case 'SUBMITTED': return 'default';
    case 'RETURNED': return 'destructive';
    default: return 'default';
  }
};

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(project)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{project.title}</CardTitle>
          <Badge variant={getStatusVariant(project.status)}>
            {project.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mb-2">
          <p className="text-sm text-gray-500">
            Client: <span className="font-medium text-gray-700">{project.client?.name || 'Unknown Client'}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center">
            <CalendarClock className="w-4 h-4 mr-1" />
            <span>Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</span>
          </div>
          
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            <span>By: {project.requested_by?.full_name || 'Unknown'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end">
        <Button variant="ghost" size="sm" className="text-blue-600">
          View Details
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
} 