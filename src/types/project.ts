import { Offer } from './offer';
import { Solution } from './solution';
import { User } from './user';

export type Role = {
  id: string;
  name: string;
  code: string;
  created_at: string;
};

export type ResourceType = {
  id: string;
  name: string;
  code: string;
  created_at: string;
};

export type SolutionResourceRate = {
  id: string;
  solution_id: string;
  resource_type_id: string;
  rate_per_hour: number;
  created_at: string;
};

export type ProjectRequestStatus = 'Pending' | 'In Progress' | 'Completed' | 'Rejected';

export type ProjectRequest = {
  id: string;
  offer_id: string;
  solution_id: string;
  status: ProjectRequestStatus;
  requested_by: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  offer?: Offer;
  solution?: Solution;
  requester?: User;
  assignee?: User;
  resources?: ProjectResource[];
};

export type ProjectResource = {
  id: string;
  project_request_id: string;
  resource_type_id: string;
  hours: number;
  rate_per_hour: number;
  total_cost: number;
  created_at: string;
  resource_type?: ResourceType;
}; 