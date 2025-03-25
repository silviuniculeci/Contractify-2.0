import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProjectCard from '@/components/ProjectCard';
import { Search, Filter, Plus } from 'lucide-react';
import { format } from 'date-fns';

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

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'error' | 'unknown'>('unknown');

  useEffect(() => {
    console.log('ProjectList component mounted');
    testSupabaseConnection().then(connected => {
      setSupabaseStatus(connected ? 'connected' : 'error');
    });
    fetchProjects();
  }, []);

  const testSupabaseConnection = async (): Promise<boolean> => {
    try {
      console.log('Testing Supabase connection...');
      const startTime = performance.now();
      const { data, error } = await supabase.from('projects').select('count').limit(1);
      const endTime = performance.now();
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      
      console.log(`Supabase connection successful! Response time: ${(endTime - startTime).toFixed(2)}ms`);
      return true;
    } catch (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching projects...');
      
      // Test connection first
      const connected = await testSupabaseConnection();
      if (!connected) {
        throw new Error('Database connection failed');
      }
      
      // Fetch projects with joins
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          solution:solution_id(*),
          client:client_id(*),
          requested_by:requested_by_id(*),
          assigned_to:assigned_to_id(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log('Projects fetched:', data?.length || 0);
      
      if (data) {
        setProjects(data);
      } else {
        // Use sample data if no data is returned
        console.log('No projects found, using sample data');
        setProjects(getSampleProjects());
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(`Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Use sample data on error
      setProjects(getSampleProjects());
    } finally {
      setLoading(false);
    }
  };

  const getSampleProjects = (): Project[] => {
    return [
      {
        id: '1',
        title: 'Implementation: CRM System',
        status: 'PENDING',
        created_at: new Date().toISOString(),
        client: { id: '1', name: 'Acme Corp' },
        requested_by: { id: '1', full_name: 'John Smith' },
        comments_count: 3
      },
      {
        id: '2',
        title: 'Implementation: ERP Solution',
        status: 'IN_PROGRESS',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        client: { id: '2', name: 'TechStart Ltd' },
        requested_by: { id: '2', full_name: 'Sarah Wilson' },
        comments_count: 7
      },
      {
        id: '3',
        title: 'Design: Mobile App',
        status: 'SUBMITTED',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        client: { id: '3', name: 'Global Media' },
        requested_by: { id: '3', full_name: 'Michael Brown' },
        comments_count: 2
      },
      {
        id: '4',
        title: 'Testing: Analytics Dashboard',
        status: 'COMPLETED',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        client: { id: '4', name: 'Data Insight Inc' },
        requested_by: { id: '4', full_name: 'Emily Chen' },
        comments_count: 0
      }
    ];
  };

  const handleProjectClick = (project: Project) => {
    console.log('Project clicked:', project);
    setSelectedProject(project);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return 'Invalid date';
    }
  };

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
  
  // Filter projects based on search term and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      (project.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       project.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       project.requested_by?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-600">
            Your project dashboard
          </p>
          {supabaseStatus === 'error' && (
            <p className="text-sm text-red-600 mt-1">
              ⚠️ Database connection issue. Using sample data.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 px-4 py-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              className="pl-10 px-4 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="RETURNED">Returned</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <Button className="flex items-center" onClick={() => navigate('/projects/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error loading projects:</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="ml-2">Loading projects...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id}
              project={project}
              onClick={handleProjectClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 mb-4">No projects found</p>
          {searchTerm || statusFilter ? (
            <p className="text-gray-400">Try adjusting your search criteria</p>
          ) : (
            <p className="text-gray-400">When projects are assigned to you, they will appear here.</p>
          )}
        </div>
      )}

      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        {selectedProject && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedProject.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-500">Client</h3>
                  <p className="font-semibold">{selectedProject.client?.name || 'Unknown'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500">Status</h3>
                  <Badge variant={getStatusVariant(selectedProject.status)}>
                    {selectedProject.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500">Requested By</h3>
                  <p>{selectedProject.requested_by?.full_name || 'Unknown'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500">Created</h3>
                  <p>{formatDate(selectedProject.created_at)}</p>
                </div>
                
                {selectedProject.assigned_to && (
                  <div>
                    <h3 className="font-medium text-gray-500">Assigned To</h3>
                    <p>{selectedProject.assigned_to.full_name}</p>
                  </div>
                )}
                
                {selectedProject.due_date && (
                  <div>
                    <h3 className="font-medium text-gray-500">Due Date</h3>
                    <p>{formatDate(selectedProject.due_date)}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-gray-500 mb-1">Comments</h3>
                <p className="text-sm">
                  {selectedProject.comments_count > 0 
                    ? `${selectedProject.comments_count} comments on this project` 
                    : 'No comments yet'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedProject(null)}>
                Close
              </Button>
              <Button onClick={() => navigate(`/projects/${selectedProject.id}/edit`)}>
                Edit Project
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
} 