import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { toast } from 'sonner';

// Constants for specific users and solutions
const OPERATIONS_MANAGER_ID = 'bbdd2a0b-490a-4ea2-955f-340c60e64725'; // BC specialist user ID
const DEFAULT_SOLUTION_ID = '3a799f6c-e99b-4464-9f23-a4cd720bf199'; // Default solution ID to use

export default function FixProjectPlanStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  
  // New function to check and fix multiple project requests for the same offer
  const checkAndFixMultipleRequests = async () => {
    setIsLoading(true);
    setResult('Checking for offers with multiple project requests...');
    
    try {
      // Get all project requests grouped by offer_id
      const { data, error } = await supabase
        .from('project_requests')
        .select('offer_id')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw new Error(`Error fetching project requests: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        setResult('No project requests found.');
        return;
      }
      
      // Group by offer_id and count
      const offerCounts: Record<string, number> = {};
      data.forEach(req => {
        if (req.offer_id) {
          offerCounts[req.offer_id] = (offerCounts[req.offer_id] || 0) + 1;
        }
      });
      
      // Find offers with multiple requests
      const offersWithMultiple = Object.entries(offerCounts)
        .filter(([_, count]) => count > 1)
        .map(([offerId, count]) => ({ offerId, count }));
      
      if (offersWithMultiple.length === 0) {
        setResult('No offers with multiple project requests found.');
        return;
      }
      
      setResult(`Found ${offersWithMultiple.length} offers with multiple project requests:\n` + 
        offersWithMultiple.map(o => `- Offer ${o.offerId}: ${o.count} requests`).join('\n'));
      
      // Fix each offer with multiple requests (keep the newest one)
      for (const { offerId } of offersWithMultiple) {
        // Get all requests for this offer, sorted by creation date
        const { data: offerRequests, error: requestsError } = await supabase
          .from('project_requests')
          .select('*')
          .eq('offer_id', offerId)
          .order('created_at', { ascending: false });
          
        if (requestsError || !offerRequests || offerRequests.length <= 1) {
          continue;
        }
        
        // Keep the newest request
        const newest = offerRequests[0];
        const othersToDelete = offerRequests.slice(1).map(r => r.id);
        
        setResult(prev => `${prev}\n\nFor offer ${offerId}:
- Keeping newest request: ${newest.id} (created: ${newest.created_at})
- Deleting ${othersToDelete.length} older requests`);
        
        // Delete older requests
        if (othersToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('project_requests')
            .delete()
            .in('id', othersToDelete);
            
          if (deleteError) {
            setResult(prev => `${prev}\n- Error deleting older requests: ${deleteError.message}`);
          } else {
            setResult(prev => `${prev}\n- Successfully deleted older requests`);
            toast.success(`Fixed multiple project requests for offer ${offerId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking multiple requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(prev => `${prev}\nError: ${errorMessage}`);
      toast.error(`Failed to check multiple requests: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fixSpecificOffer = async () => {
    setIsLoading(true);
    try {
      const offerId = 'a900599f-a7b4-4681-abfb-210ed65487a2';
      
      // First check if the project request exists
      const { data: existingRequests, error: checkError } = await supabase
        .from('project_requests')
        .select('*')
        .eq('offer_id', offerId);
        
      if (checkError) {
        throw new Error(`Error checking existing requests: ${checkError.message}`);
      }
      
      // Log what we found
      console.log('Existing project requests:', existingRequests);
      setResult(`Found ${existingRequests?.length || 0} existing project requests`);
      
      // If there are existing requests, update them to PENDING status
      if (existingRequests && existingRequests.length > 0) {
        const { data: updateData, error: updateError } = await supabase
          .from('project_requests')
          .update({ 
            status: 'PENDING'
          })
          .eq('offer_id', offerId)
          .select();
          
        if (updateError) {
          throw new Error(`Error updating requests: ${updateError.message}`);
        }
        
        console.log('Updated project requests:', updateData);
        setResult(prev => `${prev}\nUpdated ${updateData?.length || 0} project requests to PENDING status`);
        toast.success('Project request status updated to PENDING');
      } else {
        // Create a new request
        const { data: insertData, error: insertError } = await supabase
          .from('project_requests')
          .insert({
            offer_id: offerId,
            status: 'PENDING'
          })
          .select();
          
        if (insertError) {
          throw new Error(`Error creating new request: ${insertError.message}`);
        }
        
        console.log('Created new project request:', insertData);
        setResult(prev => `${prev}\nCreated new project request with status PENDING`);
        toast.success('New project request created with PENDING status');
      }
    } catch (error) {
      console.error('Error fixing project plan status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`Error: ${errorMessage}`);
      toast.error(`Failed to fix project plan status: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fixProjectDetails = async () => {
    setIsLoading(true);
    try {
      const projectId = '02026c54-1f78-4d14-bca5-6cd753ee85a5';
      
      // First, get the current project details
      const { data: projectData, error: projectError } = await supabase
        .from('project_requests')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        throw new Error(`Error fetching project request: ${projectError.message}`);
      }
      
      console.log('Current project details:', projectData);
      
      // Get the offer details to ensure we have correct data
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('id, customer_name, solution_id, created_by')
        .eq('id', projectData.offer_id)
        .single();
        
      if (offerError) {
        console.error('Error fetching offer details:', offerError);
        toast.error(`Failed to fetch offer details: ${offerError.message}`);
        return;
      }
      
      console.log('Offer details retrieved:', offerData);
      
      // Prepare update data - start with solution_id which is known to work
      const updateData = {
        solution_id: offerData.solution_id || DEFAULT_SOLUTION_ID
      };
      
      // Log initial update data
      console.log('Initial update data:', updateData);
      setResult(`Starting update for project ${projectId}...`);
      
      // Try to update with solution_id first
      const { data: solutionUpdateResult, error: solutionUpdateError } = await supabase
        .from('project_requests')
        .update(updateData)
        .eq('id', projectId)
        .select();
        
      if (solutionUpdateError) {
        setResult(prev => `${prev}\nError updating solution_id: ${solutionUpdateError.message}`);
      } else {
        setResult(prev => `${prev}\nSuccessfully updated solution_id to: ${updateData.solution_id}`);
      }
      
      // Try to update requested_by (sales person)
      if (offerData.created_by) {
        setResult(prev => `${prev}\nAttempting to set requested_by to: ${offerData.created_by}`);
        
        const { error: requestedByError } = await supabase
          .from('project_requests')
          .update({ requested_by: offerData.created_by })
          .eq('id', projectId);
          
        if (requestedByError) {
          if (requestedByError.message.includes('requested_by')) {
            setResult(prev => `${prev}\nCannot set requested_by - column does not exist in the database`);
          } else {
            setResult(prev => `${prev}\nError setting requested_by: ${requestedByError.message}`);
          }
        } else {
          setResult(prev => `${prev}\nSuccessfully set requested_by to: ${offerData.created_by}`);
        }
      } else {
        setResult(prev => `${prev}\nNo created_by field in offer data to set as requested_by`);
      }
      
      // Try to update assigned_to (implementation manager)
      setResult(prev => `${prev}\nAttempting to set assigned_to to the Business Central specialist (${OPERATIONS_MANAGER_ID})`);
      
      const { error: assignedToError } = await supabase
        .from('project_requests')
        .update({ assigned_to: OPERATIONS_MANAGER_ID })
        .eq('id', projectId);
        
      if (assignedToError) {
        if (assignedToError.message.includes('assigned_to')) {
          setResult(prev => `${prev}\nCannot set assigned_to - column does not exist in the database`);
        } else {
          setResult(prev => `${prev}\nError setting assigned_to: ${assignedToError.message}`);
        }
      } else {
        setResult(prev => `${prev}\nSuccessfully set assigned_to to: ${OPERATIONS_MANAGER_ID}`);
      }
      
      // Fetch the final state of the project request
      const { data: finalData, error: finalError } = await supabase
        .from('project_requests')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (finalError) {
        setResult(prev => `${prev}\nError fetching final project state: ${finalError.message}`);
      } else {
        setResult(prev => `${prev}\n\nFinal project state:\n${JSON.stringify(finalData, null, 2)}`);
      }
      
      toast.success('Project update attempts completed');
    } catch (error) {
      console.error('Error updating project details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`Error: ${errorMessage}`);
      toast.error(`Failed to update project details: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFieldsInDatabase = async () => {
    setIsLoading(true);
    setResult('Checking database fields...');
    
    try {
      // 1. Check table structure first
      setResult(prev => `${prev}\n\nChecking table structure...`);
      
      // Check for column existence using Postgres information_schema
      const { data: columnsData, error: columnsError } = await supabase
        .rpc('list_columns', { table_name: 'project_requests' });
      
      if (columnsError) {
        console.error('Error checking columns:', columnsError);
        setResult(prev => `${prev}\nError checking columns: ${columnsError.message}`);
        
        // Fallback - fetch a row and check its keys
        const { data: sampleRow, error: sampleError } = await supabase
          .from('project_requests')
          .select('*')
          .limit(1);
          
        if (sampleError) {
          throw new Error(`Could not retrieve sample row: ${sampleError.message}`);
        }
        
        if (sampleRow && sampleRow.length > 0) {
          const columns = Object.keys(sampleRow[0]);
          setResult(prev => `${prev}\n\nColumns in project_requests table: ${columns.join(', ')}`);
          
          // Check for our specific fields
          const hasSolutionId = columns.includes('solution_id');
          const hasRequestedBy = columns.includes('requested_by');
          const hasAssignedTo = columns.includes('assigned_to');
          
          setResult(prev => `${prev}\n\nField existence:
- solution_id: ${hasSolutionId ? 'YES' : 'NO'}
- requested_by: ${hasRequestedBy ? 'YES' : 'NO'}
- assigned_to: ${hasAssignedTo ? 'YES' : 'NO'}`);
        }
      } else {
        if (columnsData) {
          setResult(prev => `${prev}\nColumns in project_requests table: ${columnsData.join(', ')}`);
          
          // Check for our specific fields
          const hasSolutionId = columnsData.includes('solution_id');
          const hasRequestedBy = columnsData.includes('requested_by');
          const hasAssignedTo = columnsData.includes('assigned_to');
          
          setResult(prev => `${prev}\n\nField existence:
- solution_id: ${hasSolutionId ? 'YES' : 'NO'}
- requested_by: ${hasRequestedBy ? 'YES' : 'NO'}
- assigned_to: ${hasAssignedTo ? 'YES' : 'NO'}`);
        }
      }
      
      // 2. Now check if data is being stored in these fields
      setResult(prev => `${prev}\n\nChecking data in project requests...`);
      
      // Get the most recent project requests
      const { data: recentRequests, error: recentError } = await supabase
        .from('project_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (recentError) {
        throw new Error(`Error fetching recent requests: ${recentError.message}`);
      }
      
      if (recentRequests && recentRequests.length > 0) {
        setResult(prev => `${prev}\n\nRecent project requests (${recentRequests.length}):`);
        
        recentRequests.forEach((request, index) => {
          setResult(prev => `${prev}\n\nRequest #${index + 1} (ID: ${request.id}):
- solution_id: ${request.solution_id || 'NOT SET'}
- requested_by: ${request.requested_by || 'NOT SET'}
- assigned_to: ${request.assigned_to || 'NOT SET'}`);
        });
        
        // Check specific project
        const projectId = '02026c54-1f78-4d14-bca5-6cd753ee85a5';
        const { data: specificProject, error: specificError } = await supabase
          .from('project_requests')
          .select('*')
          .eq('id', projectId)
          .single();
          
        if (!specificError && specificProject) {
          setResult(prev => `${prev}\n\nSpecific project (ID: ${projectId}):
- solution_id: ${specificProject.solution_id || 'NOT SET'}
- requested_by: ${specificProject.requested_by || 'NOT SET'}
- assigned_to: ${specificProject.assigned_to || 'NOT SET'}`);
        }
      } else {
        setResult(prev => `${prev}\nNo project requests found in database.`);
      }
      
      // 3. Test creating a new record with these fields
      setResult(prev => `${prev}\n\nTesting field insertion...`);
      
      const testData = {
        offer_id: 'a900599f-a7b4-4681-abfb-210ed65487a2',
        status: 'PENDING',
        solution_id: DEFAULT_SOLUTION_ID,
        requested_by: 'test-user-id',
        assigned_to: OPERATIONS_MANAGER_ID
      };
      
      // Try inserting with all fields
      const { data: insertData, error: insertError } = await supabase
        .from('project_requests')
        .insert(testData)
        .select();
        
      if (insertError) {
        // If error, we need to figure out which fields caused it
        console.error('Error with full insert:', insertError);
        
        if (insertError.message.includes('requested_by') || insertError.message.includes('assigned_to')) {
          setResult(prev => `${prev}\nError with requested_by/assigned_to fields: ${insertError.message}`);
          
          // Try with just solution_id
          const reducedData = {
            offer_id: 'a900599f-a7b4-4681-abfb-210ed65487a2',
            status: 'PENDING',
            solution_id: DEFAULT_SOLUTION_ID
          };
          
          const { data: reducedInsertData, error: reducedInsertError } = await supabase
            .from('project_requests')
            .insert(reducedData)
            .select();
            
          if (reducedInsertError) {
            setResult(prev => `${prev}\nEven basic insertion failed: ${reducedInsertError.message}`);
          } else {
            setResult(prev => `${prev}\nInsert with just solution_id succeeded. Database accepts: offer_id, status, solution_id`);
            
            // Clean up test data
            if (reducedInsertData && reducedInsertData.length > 0) {
              await supabase
                .from('project_requests')
                .delete()
                .eq('id', reducedInsertData[0].id);
            }
          }
        } else {
          setResult(prev => `${prev}\nInsertion error: ${insertError.message}`);
        }
      } else {
        setResult(prev => `${prev}\nInsertion with all fields succeeded! Database accepts: solution_id, requested_by, assigned_to`);
        
        // Clean up test data
        if (insertData && insertData.length > 0) {
          await supabase
            .from('project_requests')
            .delete()
            .eq('id', insertData[0].id);
        }
      }
      
    } catch (error) {
      console.error('Error checking database fields:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(prev => `${prev}\n\nError: ${errorMessage}`);
      toast.error(`Error checking database fields: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkOfferStructure = async () => {
    setIsLoading(true);
    setResult('Checking offer table structure...');
    
    try {
      // First check what fields are available in the offers table
      const { data: sampleOffer, error: sampleError } = await supabase
        .from('offers')
        .select('*')
        .limit(1);
        
      if (sampleError) {
        throw new Error(`Error fetching sample offer: ${sampleError.message}`);
      }
      
      if (sampleOffer && sampleOffer.length > 0) {
        const offerFields = Object.keys(sampleOffer[0]);
        setResult(prev => `${prev}\n\nOffer table fields: ${offerFields.join(', ')}`);
        
        // Now get the specific offer we're working with
        const projectId = '02026c54-1f78-4d14-bca5-6cd753ee85a5';
        
        // Get the project request to find its offer_id
        const { data: projectData, error: projectError } = await supabase
          .from('project_requests')
          .select('offer_id')
          .eq('id', projectId)
          .single();
          
        if (projectError) {
          setResult(prev => `${prev}\n\nError getting project request: ${projectError.message}`);
        } else if (projectData) {
          const offerId = projectData.offer_id;
          setResult(prev => `${prev}\n\nProject ${projectId} is linked to offer: ${offerId}`);
          
          // Get the specific offer
          const { data: specificOffer, error: offerError } = await supabase
            .from('offers')
            .select('*')
            .eq('id', offerId)
            .single();
            
          if (offerError) {
            setResult(prev => `${prev}\n\nError getting offer: ${offerError.message}`);
          } else if (specificOffer) {
            setResult(prev => `${prev}\n\nOffer details:\n${JSON.stringify(specificOffer, null, 2)}`);
            
            // Check for solution_id specifically
            if (specificOffer.solution_id) {
              setResult(prev => `${prev}\n\nSolution ID found in offer: ${specificOffer.solution_id}`);
            } else {
              setResult(prev => `${prev}\n\nSolution ID is missing from this offer!`);
              
              // Try to update it with the default solution ID
              const { data: updateData, error: updateError } = await supabase
                .from('offers')
                .update({ solution_id: DEFAULT_SOLUTION_ID })
                .eq('id', offerId)
                .select();
                
              if (updateError) {
                setResult(prev => `${prev}\n\nError updating offer solution_id: ${updateError.message}`);
              } else {
                setResult(prev => `${prev}\n\nUpdated offer with solution_id: ${DEFAULT_SOLUTION_ID}`);
              }
            }
          }
        }
      } else {
        setResult(prev => `${prev}\n\nNo offers found in the database!`);
      }
      
      // Now check what fields are available in the project_requests table
      const { data: sampleRequest, error: requestError } = await supabase
        .from('project_requests')
        .select('*')
        .limit(1);
        
      if (requestError) {
        setResult(prev => `${prev}\n\nError fetching sample project request: ${requestError.message}`);
      } else if (sampleRequest && sampleRequest.length > 0) {
        const requestFields = Object.keys(sampleRequest[0]);
        setResult(prev => `${prev}\n\nProject request table fields: ${requestFields.join(', ')}`);
      }
      
      toast.success('Table structure check completed');
    } catch (error) {
      console.error('Error checking offer structure:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(prev => `${prev}\n\nError: ${errorMessage}`);
      toast.error(`Failed to check offer structure: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const runDiagnostics = async () => {
    try {
      setIsLoading(true);
      setDiagnosticResult('Running diagnostics...\n\n');
      
      // First try to run a query to directly look at the table info
      try {
        const { data: tableInfo, error } = await supabase
          .rpc('get_table_schema', { table_name: 'project_requests' });
          
        if (!error && tableInfo) {
          setDiagnosticResult(prev => `${prev}Schema info: ${JSON.stringify(tableInfo, null, 2)}\n\n`);
        } else {
          setDiagnosticResult(prev => `${prev}Could not get schema info: ${error?.message || 'Unknown error'}\n\n`);
        }
      } catch (e) {
        setDiagnosticResult(prev => `${prev}Schema info error: ${e instanceof Error ? e.message : String(e)}\n\n`);
      }
      
      // Try alternate approach - get one row and show columns
      const { data: sampleRequest, error: sampleError } = await supabase
        .from('project_requests')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        setDiagnosticResult(prev => `${prev}Error getting sample: ${sampleError.message}\n\n`);
      } else if (sampleRequest && sampleRequest.length > 0) {
        const columns = Object.keys(sampleRequest[0]);
        setDiagnosticResult(prev => `${prev}Available columns: ${columns.join(', ')}\n\n`);
      } else {
        setDiagnosticResult(prev => `${prev}No sample data available\n\n`);
        
        // Try to create a sample record
        const { data: insertResult, error: insertError } = await supabase
          .from('project_requests')
          .insert({
            offer_id: 'a900599f-a7b4-4681-abfb-210ed65487a2',
            status: 'PENDING'
          })
          .select();
          
        if (insertError) {
          setDiagnosticResult(prev => `${prev}Error creating sample: ${insertError.message}\n\n`);
        } else {
          setDiagnosticResult(prev => `${prev}Created sample: ${JSON.stringify(insertResult, null, 2)}\n\n`);
        }
      }
      
      // Try different queries to get all project requests
      try {
        // Approach 1: simple select
        const { data: allRequests, error: allError } = await supabase
          .from('project_requests')
          .select('*');
          
        if (allError) {
          setDiagnosticResult(prev => `${prev}Error getting all requests: ${allError.message}\n\n`);
        } else {
          setDiagnosticResult(prev => `${prev}All requests count: ${allRequests.length}\n\n`);
        }
        
        // Approach 2: Try the exact query from ProjectList
        const { data: fullQuery, error: fullError } = await supabase
          .from('project_requests')
          .select(`
            *,
            client:clients (
              id,
              name
            ),
            assigned_to:users (
              id,
              full_name
            ),
            offer:offers (
              id,
              customer_name,
              value
            )
          `);
          
        if (fullError) {
          setDiagnosticResult(prev => `${prev}Full query error: ${fullError.message}\n\n`);
        } else {
          setDiagnosticResult(prev => `${prev}Full query results count: ${fullQuery.length}\n\n`);
        }
      } catch (e) {
        setDiagnosticResult(prev => `${prev}Query error: ${e instanceof Error ? e.message : String(e)}\n\n`);
      }
      
      // Check for our specific offer
      const offerId = 'a900599f-a7b4-4681-abfb-210ed65487a2';
      const { data: requestData, error: requestError } = await supabase
        .from('project_requests')
        .select('*')
        .eq('offer_id', offerId);
        
      if (requestError) {
        setDiagnosticResult(prev => `${prev}Error checking specific offer: ${requestError.message}\n\n`);
      } else {
        setDiagnosticResult(prev => `${prev}Found ${requestData.length} requests for specific offer\n\n`);
        if (requestData.length > 0) {
          setDiagnosticResult(prev => `${prev}Specific offer data: ${JSON.stringify(requestData, null, 2)}\n\n`);
        }
      }
      
    } catch (error) {
      console.error('Diagnostic error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDiagnosticResult(prev => `${prev}Overall diagnostic error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const listTableFields = async () => {
    setIsLoading(true);
    setResult('Listing project_requests table fields...');
    
    try {
      // Fetch a sample record to see what fields exist
      const { data, error } = await supabase
        .from('project_requests')
        .select('*')
        .limit(1);
        
      if (error) {
        throw new Error(`Error fetching sample: ${error.message}`);
      }
      
      if (data && data.length > 0) {
        const fields = Object.keys(data[0]);
        setResult(`Fields in project_requests table: ${fields.join(', ')}`);
        
        console.log('Fields in project_requests table:', fields);
        
        // Test the absolute minimum fields needed
        setResult(prev => `${prev}\n\nTesting minimal insertion with only offer_id and status...`);
        
        const { data: minimalInsert, error: minimalError } = await supabase
          .from('project_requests')
          .insert({
            offer_id: 'a900599f-a7b4-4681-abfb-210ed65487a2',
            status: 'PENDING'
          })
          .select();
          
        if (minimalError) {
          setResult(prev => `${prev}\nMinimal insertion error: ${minimalError.message}`);
        } else if (minimalInsert && minimalInsert.length > 0) {
          const newFields = Object.keys(minimalInsert[0]);
          setResult(prev => `${prev}\nMinimal insertion succeeded with fields: ${newFields.join(', ')}`);
          
          // Clean up test record
          await supabase
            .from('project_requests')
            .delete()
            .eq('id', minimalInsert[0].id);
        }
        
      } else {
        setResult('No records found in project_requests table');
        
        // Try to create a simple record to see if it works
        const { data: insertData, error: insertError } = await supabase
          .from('project_requests')
          .insert({
            offer_id: 'a900599f-a7b4-4681-abfb-210ed65487a2',
            status: 'PENDING',
            solution_id: DEFAULT_SOLUTION_ID
          })
          .select();
          
        if (insertError) {
          setResult(prev => `${prev}\nError creating test record: ${insertError.message}`);
        } else if (insertData && insertData.length > 0) {
          const fields = Object.keys(insertData[0]);
          setResult(prev => `${prev}\nCreated test record. Fields: ${fields.join(', ')}`);
          
          // Clean up test record
          await supabase
            .from('project_requests')
            .delete()
            .eq('id', insertData[0].id);
        }
      }
    } catch (error) {
      console.error('Error listing table fields:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`Error: ${errorMessage}`);
      toast.error(`Failed to list fields: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-4">Fix Project Plan Status Utility</h3>
      <div className="flex space-x-4 mb-4">
        <Button 
          onClick={fixSpecificOffer} 
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Fix Offer a900599f-a7b4-4681-abfb-210ed65487a2'}
        </Button>
        
        <Button 
          onClick={fixProjectDetails} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Updating...' : 'Fix Project 02026c54 Details'}
        </Button>
        
        <Button 
          onClick={checkFieldsInDatabase} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Checking...' : 'Check DB Fields'}
        </Button>
        
        <Button 
          onClick={checkOfferStructure} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Checking...' : 'Check Offer Structure'}
        </Button>
        
        <Button 
          onClick={runDiagnostics} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Running...' : 'Run Diagnostics'}
        </Button>
        
        <Button 
          onClick={checkAndFixMultipleRequests} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Checking...' : 'Fix Multiple Requests'}
        </Button>

        <Button 
          onClick={listTableFields} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Listing...' : 'List Table Fields'}
        </Button>
      </div>
      
      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md whitespace-pre-line">
          <h4 className="font-medium">Result:</h4>
          <p>{result}</p>
        </div>
      )}
      
      {diagnosticResult && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md overflow-auto max-h-96">
          <h4 className="font-medium">Diagnostics:</h4>
          <pre className="text-xs">{diagnosticResult}</pre>
        </div>
      )}
    </div>
  );
} 