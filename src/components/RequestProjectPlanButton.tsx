import { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { toast } from 'sonner';

// Constants
const OPERATIONS_MANAGER_ID = 'bbdd2a0b-490a-4ea2-955f-340c60e64725'; // BC specialist user ID to assign projects to
const DEFAULT_SOLUTION_ID = '3a799f6c-e99b-4464-9f23-a4cd720bf199'; // Default solution ID if none is found

interface RequestProjectPlanButtonProps {
  offerId: string;
  className?: string;
  buttonText?: ReactNode;
}

export default function RequestProjectPlanButton({
  offerId,
  className = '',
  buttonText = 'Request Project Plan'
}: RequestProjectPlanButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestProjectPlan = async () => {
    if (!offerId) {
      toast.error('Cannot request project plan: No offer ID provided');
      return;
    }

    if (!user) {
      toast.error('Cannot request project plan: You must be logged in');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Requesting project plan for offer: ${offerId}`);

      // First check if there's already a project request for this offer
      const { data: existingRequests, error: checkError } = await supabase
        .from('project_requests')
        .select('id, status')
        .eq('offer_id', offerId);
        
      if (checkError) {
        console.error('Error checking existing project requests:', checkError);
        toast.error(`Failed to check existing project requests: ${checkError.message}`);
        return;
      }
      
      const existingRequest = existingRequests && existingRequests.length > 0 ? existingRequests[0] : null;
      console.log('Existing project request:', existingRequest);

      // First, get the offer details to include in the project request
      // Log the offer fields first to see what's available
      const { data: offerFields, error: fieldsError } = await supabase
        .from('offers')
        .select('*')
        .limit(1);
        
      if (fieldsError) {
        console.error('Error checking offer fields:', fieldsError);
        toast.error(`Failed to check offer structure: ${fieldsError.message}`);
        return;
      }
      
      if (offerFields && offerFields.length > 0) {
        console.log('Available offer fields:', Object.keys(offerFields[0]));
      }

      // Now get the specific offer with correct field names
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('id, customer_name, solution_id, created_by')
        .eq('id', offerId)
        .single();

      if (offerError) {
        console.error('Error fetching offer details:', offerError);
        toast.error(`Failed to fetch offer details: ${offerError.message}`);
        return;
      }

      console.log('Offer details retrieved:', offerData);
      
      // Log and verify solution_id
      if (!offerData.solution_id) {
        console.warn('Warning: Offer does not have a solution_id', offerId);
        console.log('Using default solution ID instead');
      } else {
        console.log('Solution ID found:', offerData.solution_id);
      }
      
      // Create a project request with the offer information
      // First create a basic object with essential fields
      const projectRequestData: Record<string, any> = {
        offer_id: offerId,
        status: 'PENDING' // Explicitly set status to PENDING
      };
      
      // Add solution_id if available
      if (offerData.solution_id) {
        projectRequestData.solution_id = offerData.solution_id;
      } else {
        projectRequestData.solution_id = DEFAULT_SOLUTION_ID;
      }
      
      // Attempt to add sales person as requested_by and implementation manager as assigned_to
      try {
        // Get current user (sales person) information
        if (user && user.id) {
          projectRequestData.requested_by = user.id; // This is the sales person
        }
        
        // Get implementation manager based on solution
        if (offerData.solution_id) {
          // Here you would typically get the implementation manager for this solution
          // For now we'll use the default operations manager (BC specialist)
          projectRequestData.assigned_to = OPERATIONS_MANAGER_ID;
        } else {
          // If no solution_id, still assign to operations manager
          projectRequestData.assigned_to = OPERATIONS_MANAGER_ID;
        }
      } catch (err) {
        console.warn('Error setting user fields, will proceed with basic fields only:', err);
      }
      
      console.log('Project request data to be saved:', projectRequestData);
      
      let data;
      let error;
      
      // First try with all fields including requested_by and assigned_to
      try {
        if (existingRequest) {
          // Update existing project request
          console.log(`Updating existing project request (ID: ${existingRequest.id}) with:`, projectRequestData);
          const updateResult = await supabase
            .from('project_requests')
            .update(projectRequestData)
            .eq('id', existingRequest.id)
            .select();
            
          data = updateResult.data;
          error = updateResult.error;
        } else {
          // Create new project request
          console.log('Creating new project request with:', projectRequestData);
          const insertResult = await supabase
            .from('project_requests')
            .insert(projectRequestData)
            .select();
            
          data = insertResult.data;
          error = insertResult.error;
        }
        
        // If error occurs and it's due to invalid columns, try again with just the essential fields
        if (error && error.message && (error.message.includes('requested_by') || error.message.includes('assigned_to'))) {
          console.warn('Error with user fields, trying with minimal fields:', error.message);
          
          // Try with just the basic fields
          const minimalData = {
            offer_id: offerId,
            status: 'PENDING',
            solution_id: offerData.solution_id || DEFAULT_SOLUTION_ID
          };
          
          if (existingRequest) {
            const fallbackResult = await supabase
              .from('project_requests')
              .update(minimalData)
              .eq('id', existingRequest.id)
              .select();
              
            data = fallbackResult.data;
            error = fallbackResult.error;
          } else {
            const fallbackResult = await supabase
              .from('project_requests')
              .insert(minimalData)
              .select();
              
            data = fallbackResult.data;
            error = fallbackResult.error;
          }
        }
      } catch (err) {
        console.error('Unexpected error making database request:', err);
        error = { message: err instanceof Error ? err.message : 'Unknown error' };
      }

      if (error) {
        console.error('Error with project request:', error);
        toast.error(`Failed to request project plan: ${error.message}`);
        return;
      }

      console.log('Project plan request result:', data);
      
      // Verify the created project request has the solution_id
      if (data && data.length > 0) {
        if (!data[0].solution_id) {
          console.warn('Warning: Created project request does not have a solution_id', data[0]);
          
          // Try to update it with the default solution ID as a fallback
          const { error: updateError } = await supabase
            .from('project_requests')
            .update({ solution_id: DEFAULT_SOLUTION_ID })
            .eq('id', data[0].id);
            
          if (updateError) {
            console.error('Error updating solution_id after creation:', updateError);
          } else {
            console.log('Updated project request with default solution_id');
          }
        } else {
          console.log('Project request created with solution_id:', data[0].solution_id);
        }
      }
      
      // Navigate to the offers list with query parameters to trigger notification
      navigate(`/offers?planRequested=true&offerId=${offerId}`);
      
      // No need for toast here - it will be shown by OffersList based on URL params
    } catch (error) {
      console.error('Unexpected error requesting project plan:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleRequestProjectPlan}
      disabled={isLoading}
      className={`bg-yellow-600 hover:bg-yellow-700 text-white ${className}`}
    >
      {isLoading ? 'Requesting...' : buttonText}
    </Button>
  );
} 