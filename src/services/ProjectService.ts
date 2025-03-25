import { supabase } from '../lib/supabase';

export interface ProjectPhase {
  id?: string;
  name: string;
  color?: string;
  days: number;
  tasks: ProjectTask[];
}

export interface ProjectTask {
  id?: string;
  name: string;
  days: number;
  resources: TaskResource[];
}

export interface TaskResource {
  code: string;
  name: string;
  days: number;
}

export interface Project {
  id?: string;
  offer_id: string;
  solution_id: string;
  title: string;
  status: string;
  phases: ProjectPhase[];
  notes?: string;
  total_days: number;
  total_cost: number;
  created_at?: string;
  updated_at?: string;
}

export const ProjectService = {
  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        offers(*)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }
    
    return data;
  },
  
  async createProject(project: Omit<Project, 'id'>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating project:', error);
      return null;
    }
    
    return data;
  },
  
  async updateProject(id: string, updates: Partial<Project>): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating project:', error);
      return false;
    }
    
    return true;
  },
  
  async getProjectsForOffer(offerId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('offer_id', offerId);
      
    if (error) {
      console.error('Error fetching projects for offer:', error);
      return [];
    }
    
    return data || [];
  },
  
  async calculateProjectCost(project: Project): Promise<number> {
    if (!project.solution_id) return 0;
    
    try {
      // Get resource rates for the solution
      const { data: resourceRates, error } = await supabase
        .from('solution_resource_rates')
        .select('*')
        .eq('solution_id', project.solution_id);
        
      if (error) throw error;
      
      if (!resourceRates || resourceRates.length === 0) {
        console.warn('No resource rates found for solution:', project.solution_id);
        return 0;
      }
      
      // Create a map for quick lookups
      const rateMap = resourceRates.reduce((acc, item) => {
        acc[item.resource_type_code] = item.rate;
        return acc;
      }, {});
      
      // Calculate cost for each resource in each task
      let totalCost = 0;
      
      project.phases.forEach(phase => {
        phase.tasks.forEach(task => {
          if (task.resources && task.resources.length > 0) {
            task.resources.forEach(resource => {
              const rate = rateMap[resource.code] || 0;
              totalCost += (resource.days * rate);
            });
          }
        });
      });
      
      return totalCost;
    } catch (error) {
      console.error('Error calculating project cost:', error);
      return 0;
    }
  }
}; 