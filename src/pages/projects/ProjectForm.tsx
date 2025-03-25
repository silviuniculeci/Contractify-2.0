import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import { 
  PlusCircle, Trash2, ChevronDown, ChevronUp, X, Calendar, Clock, Users 
} from 'lucide-react';
import { toast } from 'sonner';
import { ProjectService, Project, ProjectPhase, ProjectTask } from '../../services/ProjectService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Debug function - will be called on component mount
const debugSupabaseConnection = async () => {
  console.log('------------------------');
  console.log('SUPABASE DEBUG INFORMATION');
  console.log('------------------------');
  
  // Check if environment variables are set (without exposing them)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL defined:', !!supabaseUrl);
  console.log('Supabase Anon Key defined:', !!supabaseAnonKey);
  
  try {
    // Try a simple ping query to the resource_types table
    console.log('Testing Supabase connection with resource_types table...');
    const startTime = performance.now();
    const { data, error } = await supabase.from('resource_types').select('count').limit(1);
    const endTime = performance.now();
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log(`Supabase connection successful! Response time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log('Response data:', data);
    
    // Try to get the actual table structure
    console.log('Checking resource_types table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('resource_types')
      .select('*')
      .limit(1);
      
    if (schemaError) {
      console.error('Failed to read resource_types schema:', schemaError);
    } else if (schemaData && schemaData.length > 0) {
      console.log('Resource_types table structure:', Object.keys(schemaData[0]).join(', '));
    } else {
      console.log('Resource_types table exists but is empty');
    }
    
    return true;
  } catch (error) {
    console.error('Supabase connection test exception:', error);
    return false;
  } finally {
    console.log('------------------------');
  }
};

// Simple interfaces
interface TaskResource {
  code: string;
  name: string;
  days: number;
}

// Task interface that extends ProjectTask
interface Task extends ProjectTask {
  // No additional properties needed, just ensuring compatibility
}

interface Resource {
  id: string;
  code: string;
  name: string;
  type: string;
  default_days: number;
}

// Phase interface that extends ProjectPhase with collapsed property
interface Phase extends ProjectPhase {
  collapsed: boolean;
}

interface ProjectFormProps {}

export default function ProjectForm({}: ProjectFormProps) {
  const { projectId, offerId } = useParams<{ projectId: string; offerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = window.location;
  
  // IMPORTANT: Force using phase-based implementation
  const forcePhaseBased = true;
  
  // Debug logging to identify component rendering
  console.log('=============================================');
  console.log('🚀 ProjectForm component rendering - PHASE-BASED IMPLEMENTATION');
  console.log('Current route projectId:', projectId);
  console.log('Current URL:', location.href);
  console.log('Current pathname:', location.pathname);
  console.log('Force phase-based:', forcePhaseBased);
  console.log('=============================================');
  
  // Run supabase debug on mount
  useEffect(() => {
    debugSupabaseConnection();
  }, []);
  
  // State
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [clientName, setClientName] = useState('');
  const [solutionName, setSolutionName] = useState('');
  const [solutionId, setSolutionId] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [notes, setNotes] = useState('');
  const [currentTask, setCurrentTask] = useState<{task: Task | null, phaseIndex: number, taskIndex: number}>({
    task: null,
    phaseIndex: 0,
    taskIndex: 0
  });
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [availableResources, setAvailableResources] = useState<any[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Initialize phases - set to empty array
  useEffect(() => {
    if (!phases.length) {
      setPhases([]); // Start with empty phases, will be initialized properly later
    }
  }, []);

  // Create a consistent set of mock resources for fallback
  const createMockResources = (): Resource[] => {
    console.log('Creating standard mock resources');
    return [
      { id: 'mock-1', code: 'BA', name: 'Business Analyst', type: 'Standard', default_days: 5 },
      { id: 'mock-2', code: 'TC', name: 'Technical Consultant', type: 'Standard', default_days: 5 },
      { id: 'mock-3', code: 'BC', name: 'Business Consultant', type: 'Standard', default_days: 3 },
      { id: 'mock-4', code: 'QA', name: 'Quality Assurance', type: 'Standard', default_days: 2 },
      { id: 'mock-5', code: 'PM', name: 'Project Manager', type: 'Standard', default_days: 1 },
    ];
  };

  // Improved fetchResources function to use resource_types table
  const fetchResources = async () => {
    try {
      setResourcesLoading(true);
      console.log('💡 Fetching resources from resource_types table - attempt started', new Date().toISOString());

      // Use resource_types table instead of resources
      const { data, error } = await supabase
        .from('resource_types')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Error fetching from "resource_types" table:', error.message);
        console.error('Error details:', JSON.stringify(error));
        throw error;
      }

      console.log('✅ Resource types fetched successfully:', data?.length || 0, 'found');
      if (data && data.length > 0) {
        console.log('First type:', JSON.stringify(data[0]));
      }
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Map resource_types to Resource interface with appropriate mapping
        const mappedResources = data.map(item => {
          // Use the appropriate field names from resource_types table
          return {
            id: item.id || '',
            code: item.code || item.abbreviation || '', // Use code or abbreviation field
            name: item.name || '', // Use the name field
            type: item.category || 'Standard', // If category exists use it, otherwise default to 'Standard'
            default_days: item.default_days || 1 // Default to 1 day if not provided
          };
        });
        
        // Filter to ensure only valid resource objects are included
        const validResources = mappedResources
          .filter((item): item is Resource => {
            // If code isn't available, derive it from name
            if (!item.code && item.name) {
              // Create a code from the initials of the name (e.g., "Business Analyst" -> "BA")
              item.code = item.name
                .split(' ')
                .map((word: string) => word[0])
                .join('');
            }
            
            const isValid = (
              typeof item.id === 'string' && 
              typeof item.name === 'string' && item.name.length > 0
            );
            
            if (!isValid) {
              console.warn('Invalid resource after mapping:', item);
            }
            
            return isValid;
          });

        console.log('Valid resources after filtering:', validResources.length);
        setAvailableResources(validResources);
      } else {
        console.warn('No resource types data returned from the API', data);
        
        // Create some mock resources as fallback based on the requested types
        const mockResources = createMockResources();
        
        console.log('Using mock resources as fallback');
        setAvailableResources(mockResources);
        
        // Let the user know we're using mock data
        toast.info('Using sample resource types. Connect to database for actual resources.', { 
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error fetching resource types:', error);
      
      // Add mock resources as fallback
      const mockResources = createMockResources();
      
      console.log('Using mock resources due to error');
      setAvailableResources(mockResources);
      
      // Let the user know we're using mock data
      toast.error(`Resources loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        description: 'Using sample resources instead',
        duration: 5000
      });
    } finally {
      setResourcesLoading(false);
    }
  };

  // Update resource loading logic to be more aggressive
  useEffect(() => {
    const loadResources = async () => {
      try {
        console.log('Initial resource loading started');
        await fetchResources();
        console.log('Initial resource loading completed');
      } catch (error) {
        console.error('Resource loading failed in useEffect:', error);
      }
    };

    loadResources();
  }, []); // Only run once on component mount

  // Add an additional trigger for resource loading when modal opens
  useEffect(() => {
    if (resourceModalOpen) {
      console.log('Modal opened, checking resources...');
      // Always try to fetch resources when modal opens
      fetchResources();
    }
  }, [resourceModalOpen]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setStatus('loading');
        console.log('Load project called - ensuring phase-based implementation');
        
        if (projectId && user) {
          // If we have a project ID, try to load it
          console.log('Loading existing project:', projectId);
          await fetchProject();
        } else {
          // If not, initialize a new project
          console.log('No project ID, initializing new project');
          initializeNewProject();
        }
        
        setStatus('success');
      } catch (error) {
        console.error('Project loading failed:', error);
        setErrorMessage('Failed to load project data. Please try refreshing the page.');
        setStatus('error');
        // Always make sure we have phases, even if loading fails
        console.log('Initializing new project after load error');
        initializeNewProject(); 
      } finally {
        setLoading(false);
      }
    };
    
    // Load the project data
    loadProject();
    
  }, [projectId, user]);

  // Recalculate phase days when tasks change
  useEffect(() => {
    recalculatePhaseDays();
  }, [phases]);

  const fetchProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      console.log('Fetching project data for ID:', projectId);
      
      const projectData = await ProjectService.getProject(projectId);
      
      if (!projectData) {
        console.warn('No project found, initializing default project');
        initializeNewProject();
        return;
      }
      
      console.log('Project data received:', projectData);
      
      // Store the raw project data in state
      setProject(projectData);
      
      // Extract data from project, handling types safely
      // The project might have data from the join with offers
      const rawData: any = projectData;
      setClientName(rawData.offers?.customer_name || '');
      setSolutionName(rawData.solution?.name || '');
      setSolutionId(projectData.solution_id);
      setNotes(projectData.notes || '');
      
      // Handle phases with proper type conversion
      if (projectData.phases && Array.isArray(projectData.phases) && projectData.phases.length > 0) {
        // Convert ProjectPhase[] to Phase[] by adding the missing 'collapsed' property
        // and ensuring all required fields exist
        const phasesWithCollapsed = projectData.phases.map(phase => ({
          ...phase,
          id: phase.id || `phase-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          color: phase.color || 'blue',
          tasks: phase.tasks.map(task => ({
            ...task,
            id: task.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            resources: task.resources || []
          })),
          collapsed: false
        }));
        setPhases(phasesWithCollapsed);
      } else {
        initializeNewProject();
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      initializeNewProject();
    } finally {
      setLoading(false);
    }
  };

  // Function to initialize a new project with default phases
  const initializeNewProject = () => {
    console.log('Initializing new project with empty phases');
    
    const defaultPhases: Phase[] = [
      {
        id: 'phase-analysis',
        name: 'Analysis',
        color: 'blue',
        days: 0,
        tasks: [],
        collapsed: false
      },
      {
        id: 'phase-development',
        name: 'Development',
        color: 'indigo',
        days: 0,
        tasks: [],
        collapsed: false
      },
      {
        id: 'phase-deployment',
        name: 'Deployment',
        color: 'green',
        days: 0,
        tasks: [],
        collapsed: false
      },
      {
        id: 'phase-golive',
        name: 'Go-live',
        color: 'orange',
        days: 0,
        tasks: [],
        collapsed: false
      },
      {
        id: 'phase-management',
        name: 'Project Management',
        color: 'purple',
        days: 0,
        tasks: [],
        collapsed: false
      }
    ];
    
    console.log('Setting phases array with', defaultPhases.length, 'empty phases');
    setPhases(defaultPhases);
    
    // Also fetch resources to ensure they're available
    if (availableResources.length === 0 && !resourcesLoading) {
      console.log('No resources loaded, fetching them now');
      fetchResources().catch(err => {
        console.error('Failed to fetch resources during initialization:', err);
      });
    }
  };

  // Function to recalculate phase days based on tasks
  const recalculatePhaseDays = () => {
    const updatedPhases = phases.map(phase => {
      // Project Management phase is manually set, don't calculate from tasks
      if (phase.name === 'Project Management') {
        return phase;
      }
      
      // For all other phases, calculate from tasks
      const totalDays = phase.tasks.reduce((sum, task) => sum + task.days, 0);
      return { ...phase, days: totalDays };
    });
    setPhases(updatedPhases);
  };

  const handleAddTask = (phaseIndex: number) => {
    // Don't add tasks to Project Management phase
    if (phases[phaseIndex].name === 'Project Management') {
      return;
    }

    const updatedPhases = [...phases];
    updatedPhases[phaseIndex].tasks.push({
      id: `task-${Date.now()}`,
      name: '',
      days: 1,
      resources: []
    });
    setPhases(updatedPhases);
  };

  const handleRemoveTask = (phaseIndex: number, taskIndex: number) => {
    const updatedPhases = [...phases];
    updatedPhases[phaseIndex].tasks.splice(taskIndex, 1);
    setPhases(updatedPhases);
  };

  const handleTaskChange = (phaseIndex: number, taskIndex: number, field: string, value: any) => {
    const updatedPhases = [...phases];
    const task = updatedPhases[phaseIndex].tasks[taskIndex];
    
    if (field === 'name') {
      task.name = value;
    } else if (field === 'days') {
      task.days = Math.max(1, parseInt(value) || 1);
    }
    
    setPhases(updatedPhases);
  };

  const handlePhaseToggle = (phaseIndex: number) => {
    const updatedPhases = [...phases];
    updatedPhases[phaseIndex].collapsed = !updatedPhases[phaseIndex].collapsed;
    setPhases(updatedPhases);
  };

  const openResourceModal = async (phaseIndex: number, taskIndex: number) => {
    try {
      // Safety checks for phases and tasks
      if (
        typeof phaseIndex !== 'number' ||
        phaseIndex < 0 ||
        phaseIndex >= phases.length ||
        typeof taskIndex !== 'number' ||
        taskIndex < 0 ||
        !phases[phaseIndex].tasks ||
        taskIndex >= phases[phaseIndex].tasks.length
      ) {
        console.error('Invalid phase or task indices:', { phaseIndex, taskIndex });
        toast.error('Cannot open resource modal: Invalid task');
        return;
      }
      
      const task = phases[phaseIndex].tasks[taskIndex];
      console.log('Opening resource modal for task:', task.name);
      
      // Set the current task state
      setCurrentTask({
        task,
        phaseIndex,
        taskIndex
      });
      
      // Set the modal open state
      setResourceModalOpen(true);
      
      // Only load resources if we don't have any yet
      if (!availableResources || availableResources.length === 0) {
        setResourcesLoading(true);
        try {
          console.log('Fetching resources for modal...');
          await fetchResources();
          console.log('Resources fetched successfully');
        } catch (error) {
          console.error('Error fetching resources:', error);
          // Let the user retry via the UI button
        } finally {
          setResourcesLoading(false);
        }
      }
    } catch (err) {
      console.error('Error opening resource modal:', err);
      // Don't show the modal if there's an error
      setResourceModalOpen(false);
      toast.error('Failed to open resource allocation');
    }
  };

  const handleAddResource = (resource: Resource) => {
    try {
      console.log('Adding resource to task:', resource);
      
      // Safety check for currentTask
      if (!currentTask || !currentTask.task) {
        console.error('Cannot add resource: currentTask or currentTask.task is null');
        toast.error('Error adding resource: Task not selected');
        return;
      }
      
      // Safety check for phase and task indices
      if (
        typeof currentTask.phaseIndex !== 'number' || 
        currentTask.phaseIndex < 0 ||
        currentTask.phaseIndex >= phases.length ||
        typeof currentTask.taskIndex !== 'number' ||
        currentTask.taskIndex < 0 ||
        !phases[currentTask.phaseIndex]?.tasks ||
        currentTask.taskIndex >= phases[currentTask.phaseIndex].tasks.length
      ) {
        console.error('Invalid phase or task indices:', { 
          phaseIndex: currentTask.phaseIndex, 
          taskIndex: currentTask.taskIndex,
          phasesLength: phases.length,
          tasksLength: phases[currentTask.phaseIndex]?.tasks?.length
        });
        toast.error('Error adding resource: Invalid task reference');
        return;
      }
      
      // Create a deep copy of phases to avoid direct state mutation
      const updatedPhases = phases.map(phase => ({
        ...phase,
        tasks: phase.tasks.map(task => ({
          ...task,
          resources: [...(task.resources || [])]
        }))
      }));
      
      const task = updatedPhases[currentTask.phaseIndex].tasks[currentTask.taskIndex];
      
      // Initialize resources array if needed
      if (!task.resources) {
        task.resources = [];
      }
      
      // Check if resource already exists
      const exists = task.resources.some(r => r.code === resource.code);
      
      if (!exists) {
        // Add resource with default days
        const newResource = {
          code: resource.code,
          name: resource.name || resource.code,
          days: resource.default_days || 1
        };
        
        console.log('Adding new resource to task:', newResource);
        task.resources.push(newResource);
        
        // Update phases state
        setPhases(updatedPhases);
        toast.success(`Added ${resource.name || resource.code} to task`);
      } else {
        toast.info(`Resource ${resource.name || resource.code} is already assigned to this task`);
      }
    } catch (error) {
      console.error('Error in handleAddResource:', error);
      toast.error(`Failed to add resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoveResource = (resourceCode: string) => {
    try {
      if (!currentTask || !currentTask.task) {
        console.error('Cannot remove resource: currentTask is null');
        return;
      }
      
      // Make a deep copy of phases
      const updatedPhases = JSON.parse(JSON.stringify(phases));
      
      // Validate indices
      if (
        typeof currentTask.phaseIndex !== 'number' || 
        currentTask.phaseIndex < 0 ||
        currentTask.phaseIndex >= updatedPhases.length ||
        typeof currentTask.taskIndex !== 'number' ||
        currentTask.taskIndex < 0 ||
        !updatedPhases[currentTask.phaseIndex].tasks ||
        currentTask.taskIndex >= updatedPhases[currentTask.phaseIndex].tasks.length
      ) {
        console.error('Invalid phase or task indices:', currentTask);
        return;
      }
      
      const task = updatedPhases[currentTask.phaseIndex].tasks[currentTask.taskIndex];
      
      if (!task.resources) {
        task.resources = [];
        return;
      }
      
      // Find and remove the resource
      const resourceName = task.resources.find((r: TaskResource) => r.code === resourceCode)?.name || resourceCode;
      task.resources = task.resources.filter((r: TaskResource) => r.code !== resourceCode);
      
      // Update phases state
      setPhases(updatedPhases);
      toast.info(`Removed ${resourceName} from task`);
    } catch (error) {
      console.error('Error in handleRemoveResource:', error);
      toast.error('Failed to remove resource');
    }
  };

  const handleResourceDaysChange = (resourceCode: string, days: number) => {
    try {
      if (!currentTask || !currentTask.task) {
        console.error('Cannot update resource days: currentTask is null');
        return;
      }
      
      // Make a deep copy of phases
      const updatedPhases = JSON.parse(JSON.stringify(phases));
      
      // Validate indices
      if (
        typeof currentTask.phaseIndex !== 'number' || 
        currentTask.phaseIndex < 0 ||
        currentTask.phaseIndex >= updatedPhases.length ||
        typeof currentTask.taskIndex !== 'number' ||
        currentTask.taskIndex < 0 ||
        !updatedPhases[currentTask.phaseIndex].tasks ||
        currentTask.taskIndex >= updatedPhases[currentTask.phaseIndex].tasks.length
      ) {
        console.error('Invalid phase or task indices:', currentTask);
        return;
      }
      
      const task = updatedPhases[currentTask.phaseIndex].tasks[currentTask.taskIndex];
      
      if (!task.resources) {
        task.resources = [];
        return;
      }
      
      // Make sure we get a valid number for days
      const validDays = Math.max(0.5, isNaN(days) ? 1 : days);
      
      // Update the specified resource's days
      task.resources = task.resources.map((r: TaskResource) => 
        r.code === resourceCode ? { ...r, days: validDays } : r
      );
      
      // Update phases state
      setPhases(updatedPhases);
      console.log(`Updated days for ${resourceCode} to ${validDays}`);
    } catch (error) {
      console.error('Error in handleResourceDaysChange:', error);
    }
  };

  const handleCloseResourceModal = () => {
    setResourceModalOpen(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Calculate totals
      const totalDays = calculateTotalDays();
      
      if (!projectId) {
        // Create new project
        if (!offerId || !solutionId) {
          toast.error('Missing required offer or solution information');
          return;
        }
        
        const newProject: Omit<Project, 'id'> = {
          offer_id: offerId,
          solution_id: solutionId,
          title: `Project plan for ${clientName}`,
          status: 'draft',
          phases: phases.map(phase => ({
            id: phase.id,
            name: phase.name,
            color: phase.color,
            days: phase.days,
            tasks: phase.tasks
          })),
          notes: notes,
          total_days: totalDays,
          total_cost: 0 // We'll calculate this in the service
        };
        
        // Calculate cost
        newProject.total_cost = await ProjectService.calculateProjectCost(newProject as Project);
        
        const project = await ProjectService.createProject(newProject);
        
        if (!project) {
          toast.error('Failed to create project');
          return;
        }
        
        toast.success('Project created successfully');
        navigate(`/projects/${project.id}/edit`);
      } else {
        // Update existing project
        const updates = {
          phases: phases.map(phase => ({
            id: phase.id,
            name: phase.name,
            color: phase.color,
            days: phase.days,
            tasks: phase.tasks
          })),
          notes: notes,
          total_days: totalDays
        };
        
        // Calculate cost
        const totalCost = await ProjectService.calculateProjectCost({
          ...project,
          phases: updates.phases
        } as Project);
        
        const success = await ProjectService.updateProject(projectId, {
          ...updates,
          total_cost: totalCost
        });
        
        if (!success) {
          toast.error('Failed to update project');
          return;
        }
        
        toast.success('Project updated successfully');
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const totalDays = phases.reduce((sum, phase) => sum + phase.days, 0);

  // Add a function to calculate total resources across all phases
  const calculateTotalResources = () => {
    let totalResources = 0;
    
    phases.forEach(phase => {
      phase.tasks.forEach(task => {
        totalResources += task.resources.length;
      });
    });
    
    return totalResources;
  };

  // Add a function to calculate total days across all phases
  const calculateTotalDays = () => {
    return phases.reduce((sum, phase) => sum + phase.days, 0);
  };

  // Function to get color classes for a resource based on its code
  const getResourceColors = (code: string): { bg: string, text: string, border: string } => {
    const resourceColors: Record<string, { bg: string, text: string, border: string }> = {
      'BA': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      'TC': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
      'BC': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      'QA': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      'PM': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
    };
    
    return resourceColors[code] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  };

  // Function to get the resource color class for the small circle indicators
  const getResourceColorClass = (code: string): string => {
    const colors: Record<string, string> = {
      'BA': 'bg-blue-600',
      'TC': 'bg-indigo-600',
      'BC': 'bg-green-600',
      'QA': 'bg-amber-600',
      'PM': 'bg-purple-600'
    };
    
    return colors[code] || 'bg-gray-600';
  };

  // Resource Modal component
  const ResourceModal = () => {
    // Safety check for modal state and current task
    if (!resourceModalOpen || !currentTask || !currentTask.task) {
      return null;
    }
    
    // Safety check for phase index
    if (typeof currentTask.phaseIndex !== 'number' || !phases[currentTask.phaseIndex]) {
      console.error('Invalid phase index in currentTask:', currentTask);
      return null;
    }
    
    // Safety check for task resources
    const taskResources = currentTask.task.resources || [];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Resource Allocation</h3>
              <p className="text-sm text-gray-500">
                {project && project.offers && (
                  <>
                    {project.offers.customer_name} • {project.solution?.name || 'No solution'}
                  </>
                )}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium">{phases[currentTask.phaseIndex].name} Phase</span> • 
                <span className="ml-1">{currentTask.task.name}</span>
              </p>
            </div>
            <button
              onClick={() => setResourceModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-grow">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-blue-800">{currentTask.task.name}</h4>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {currentTask.task.days} days
                </span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Phase: {phases[currentTask.phaseIndex].name}
              </p>
            </div>
            
            {/* Current Resources */}
            <div className="mb-6">
              <h4 className="font-medium mb-3 text-gray-700 flex items-center">
                <Users size={16} className="mr-2" />
                Assigned Resources
              </h4>
              
              {taskResources.length > 0 ? (
                <div className="space-y-2">
                  {taskResources.map((resource, index) => (
                    <div key={`${resource.code}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">
                          {resource.code}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{resource.name}</div>
                          <div className="text-xs text-gray-500">{resource.code}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleResourceDaysChange(resource.code, Math.max(0.5, parseFloat(resource.days.toString()) - 0.5))}
                            className="h-6 w-6 flex items-center justify-center bg-gray-200 rounded-l hover:bg-gray-300"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={resource.days}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value)) {
                                handleResourceDaysChange(resource.code, value);
                              }
                            }}
                            className="w-16 h-6 text-center border-y text-sm"
                          />
                          <button 
                            onClick={() => handleResourceDaysChange(resource.code, parseFloat(resource.days.toString()) + 0.5)}
                            className="h-6 w-6 flex items-center justify-center bg-gray-200 rounded-r hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveResource(resource.code)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">No resources assigned yet</p>
                  <p className="text-sm text-gray-400">Add resources from the list below</p>
                </div>
              )}
            </div>

            {/* Available Resources */}
            <div>
              <h4 className="font-medium mb-3 text-gray-700 flex items-center">
                <PlusCircle size={16} className="mr-2" />
                Available Resources
              </h4>
              
              {resourcesLoading ? (
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <div className="animate-spin h-8 w-8 border-[3px] border-blue-500 border-t-transparent rounded-full mb-3"></div>
                  <p className="text-gray-600">Loading resources...</p>
                </div>
              ) : availableResources && availableResources.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableResources.map((resource) => {
                    const isSelected = taskResources.some(r => r.code === resource.code);
                    const { bg, text, border } = getResourceColors(resource.code);
                    
                    return (
                      <button
                        key={resource.id || resource.code}
                        onClick={() => {
                          if (!isSelected) {
                            console.log('Adding resource:', resource);
                            handleAddResource(resource);
                          }
                        }}
                        disabled={isSelected}
                        className={`p-3 rounded flex flex-col items-start border ${
                          isSelected ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-50' : `${bg} ${text} ${border}`
                        }`}
                      >
                        <div className="font-medium">{resource.code}</div>
                        <div className="text-xs">{resource.name || "Resource"}</div>
                        {!isSelected && (
                          <div className="flex items-center text-xs mt-1 text-gray-500">
                            <Clock size={12} className="mr-1" />
                            <span>Default: {resource.default_days || 1} days</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <p className="text-gray-700 mb-2">No resources available</p>
                  <div className="flex flex-col items-center">
                    <p className="text-gray-500 text-sm mb-3">
                      Could not load resources from the resource_types table. Please check that the table exists and contains data.
                    </p>
                    <button 
                      onClick={() => {
                        console.log('Manually triggering resource fetch');
                        fetchResources();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 flex justify-end gap-2 border-t">
            <button 
              onClick={() => setResourceModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={() => setResourceModalOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Loading State
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }
  
  // Error State
  if (status === 'error' && errorMessage) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="bg-red-50 border border-red-200 p-6 rounded-md">
            <h2 className="text-red-700 text-lg font-medium">Error Loading Project</h2>
            <p className="mt-2 text-red-600">{errorMessage}</p>
            <div className="mt-4 flex space-x-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  console.log('Initializing new project from error view');
                  initializeNewProject();
                  setStatus('success');
                  setErrorMessage(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Initialize New Project
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Debug display if phase data is missing
  if (!phases || phases.length === 0) {
    console.error('Phases array is empty or missing when rendering main component!');
    initializeNewProject();
    
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-6xl bg-yellow-50 border border-yellow-200 p-6 rounded-md">
          <h2 className="text-amber-700 text-lg font-medium">Project Plan Missing</h2>
          <p className="mt-2 text-amber-600">
            The project phases couldn't be loaded properly. 
            Initializing with default phases...
          </p>
          <div className="flex justify-center p-4">
            <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Page header section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Project Implementation Plan</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </div>
        
        {/* Client and solution details */}
        <div className="bg-white shadow-sm rounded-md p-6 mb-6">
          {project && project.offers && (
            <p className="text-gray-600 mb-1">{project.offers.customer_name || 'No customer specified'} • {project.solution?.name || 'No solution specified'}</p>
          )}
        </div>
        
        {/* Summary metrics card */}
        <div className="bg-white shadow-sm rounded-md p-6 mb-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Days</div>
                <div className="text-2xl font-semibold">{calculateTotalDays()}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-3 rounded-md">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Resources</div>
                <div className="text-2xl font-semibold">{calculateTotalResources()}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Implementation Notes */}
        <div className="bg-white shadow-sm rounded-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Implementation Notes</h2>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Add implementation notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        
        {/* Phases */}
        <div className="space-y-6">
          {phases.map((phase, phaseIndex) => (
            <div key={phase.id} className="bg-white shadow-sm rounded-md overflow-hidden">
              {/* Phase header */}
              <div 
                className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center cursor-pointer"
                onClick={() => handlePhaseToggle(phaseIndex)}
              >
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-blue-900">{phase.name}</h3>
                  <div className="ml-4 text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                    {phase.days} days
                  </div>
                </div>
                <div>
                  {phase.collapsed ? (
                    <ChevronDown className="h-5 w-5 text-blue-700" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-blue-700" />
                  )}
                </div>
              </div>

              {/* Phase content - only show if not collapsed */}
              {!phase.collapsed && (
                <div className="p-6">
                  {/* Special handling for Project Management phase */}
                  {phase.name === 'Project Management' ? (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-2">
                          Allocated Days for Project Management
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            className="w-24 p-2 border rounded-md"
                            min="0"
                            value={phase.days}
                            onChange={(e) => {
                              const updatedPhases = [...phases];
                              updatedPhases[phaseIndex].days = Math.max(0, parseInt(e.target.value) || 0);
                              setPhases(updatedPhases);
                            }}
                          />
                          <span className="ml-2 text-sm text-gray-500">
                            Project Management days are allocated across the entire project duration
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Regular phases with tasks */
                    <>
                      {phase.tasks.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-sm text-gray-500 border-b">
                                <th className="pb-2 font-medium">Task</th>
                                <th className="pb-2 font-medium w-20">Days</th>
                                <th className="pb-2 font-medium w-40">Resources</th>
                                <th className="pb-2 font-medium w-16">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {phase.tasks.map((task, taskIndex) => (
                                <tr key={task.id} className="border-b last:border-b-0">
                                  <td className="py-3">
                                    <input
                                      type="text"
                                      value={task.name}
                                      onChange={(e) => handleTaskChange(phaseIndex, taskIndex, 'name', e.target.value)}
                                      className="w-full p-2 border rounded"
                                      placeholder={`Add ${phase.name} task...`}
                                    />
                                  </td>
                                  <td className="py-3">
                                    <input
                                      type="number"
                                      min="1"
                                      value={task.days}
                                      onChange={(e) => handleTaskChange(phaseIndex, taskIndex, 'days', e.target.value)}
                                      className="w-20 p-2 border rounded"
                                    />
                                  </td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => openResourceModal(phaseIndex, taskIndex)}
                                      className="w-full flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                                    >
                                      <div className="flex flex-wrap gap-1">
                                        {task.resources.length > 0 ? (
                                          task.resources.map((resource, i) => {
                                            const { bg, text } = getResourceColors(resource.code);
                                            return (
                                              <span key={i} className={`${bg} ${text} text-xs px-2 py-0.5 rounded flex items-center`}>
                                                <span className={`w-2 h-2 rounded-full mr-1 ${getResourceColorClass(resource.code)}`}></span>
                                                {resource.code} ({resource.days}d)
                                              </span>
                                            );
                                          })
                                        ) : (
                                          <span className="text-gray-400 text-sm">Add resources</span>
                                        )}
                                      </div>
                                      <PlusCircle size={16} className="text-gray-400" />
                                    </button>
                                  </td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => handleRemoveTask(phaseIndex, taskIndex)}
                                      className="p-1 text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 mb-4">No tasks yet</p>
                          <button
                            onClick={() => handleAddTask(phaseIndex)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center mx-auto"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add {phase.name} Task
                          </button>
                        </div>
                      )}

                      {/* Add task button - only show if tasks exist */}
                      {phase.tasks.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() => handleAddTask(phaseIndex)}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add {phase.name} Task
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <ResourceModal />
    </Layout>
  );
} 