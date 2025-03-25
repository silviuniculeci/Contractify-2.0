/**
 * This script helps populate test data for project requests in the Supabase database.
 * You can run this in a Node.js environment or directly in the browser console
 * after replacing the SUPABASE_URL and SUPABASE_KEY with your actual values.
 */

// Replace these with your actual Supabase URL and anon key
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client if in Node.js
let supabase;
if (typeof window === 'undefined') {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  // Browser environment - assume supabase is already initialized
  // For browser, make sure you've included the Supabase JS client in your HTML
  console.log('Using browser Supabase client');
}

/**
 * Create project requests for existing offers
 * @param {number} count - Number of project requests to create
 * @param {boolean} includeSomeSubmitted - Whether to mark some as submitted
 */
async function createTestProjectRequests(count = 5, includeSomeSubmitted = true) {
  try {
    // Get existing offers
    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select('id, status')
      .order('created_at', { ascending: false })
      .limit(count * 2); // Get more than we need in case some are filtered out
    
    if (offersError) {
      throw new Error(`Error fetching offers: ${offersError.message}`);
    }
    
    if (!offers || offers.length === 0) {
      throw new Error('No offers found to attach project requests to');
    }
    
    console.log(`Found ${offers.length} offers to work with`);
    
    // Get active offers (typically those that are approved or pending)
    const activeOffers = offers.filter(offer => 
      ['Approved', 'Pending', 'Pending Approval'].includes(offer.status)
    );
    
    if (activeOffers.length === 0) {
      console.warn('No active offers found. Using all available offers instead.');
    }
    
    const offersToUse = activeOffers.length > 0 ? activeOffers : offers;
    const selectedOffers = offersToUse.slice(0, count);
    
    console.log(`Selected ${selectedOffers.length} offers for project requests`);
    
    // Get existing users to assign as requesters and assignees
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(5);
    
    if (usersError) {
      console.warn(`Error fetching users: ${usersError.message}`);
      console.warn('Will proceed without user assignments');
    }
    
    // Create project requests for each selected offer
    for (let i = 0; i < selectedOffers.length; i++) {
      const offer = selectedOffers[i];
      const isSubmitted = includeSomeSubmitted && i < Math.ceil(selectedOffers.length / 2);
      
      // Determine request dates
      const requested = new Date();
      requested.setDate(requested.getDate() - Math.floor(Math.random() * 30)); // Random date in the last 30 days
      
      // For submitted ones, set a submission date after the request date
      let submitted = null;
      if (isSubmitted) {
        submitted = new Date(requested);
        submitted.setDate(submitted.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days after request
      }
      
      // Random user assignments if users are available
      const requesterId = users && users.length > 0
        ? users[Math.floor(Math.random() * users.length)].id
        : null;
        
      const assigneeId = users && users.length > 0
        ? users[Math.floor(Math.random() * users.length)].id
        : null;
      
      // Create the project request
      const { data: projectRequest, error: projectRequestError } = await supabase
        .from('project_requests')
        .insert({
          offer_id: offer.id,
          status: isSubmitted ? 'SUBMITTED' : 'PENDING',
          requested_at: requested.toISOString(),
          submitted_at: isSubmitted ? submitted.toISOString() : null,
          requester_id: requesterId,
          assignee_id: assigneeId,
          notes: `Test project request ${i + 1} for offer ${offer.id}`
        })
        .select();
      
      if (projectRequestError) {
        console.error(`Error creating project request for offer ${offer.id}:`, projectRequestError);
        continue;
      }
      
      console.log(`Created project request for offer ${offer.id}`, 
        isSubmitted ? '(submitted)' : '(pending)');
      
      // If the project request was created successfully and we have a project request ID,
      // create some resource assignments
      if (projectRequest && projectRequest.length > 0) {
        // Get resource types
        const { data: resourceTypes, error: resourceTypesError } = await supabase
          .from('resource_types')
          .select('id, name, code, rate')
          .limit(10);
          
        if (resourceTypesError) {
          console.warn(`Error fetching resource types: ${resourceTypesError.message}`);
          continue;
        }
        
        if (!resourceTypes || resourceTypes.length === 0) {
          console.warn('No resource types found. Skipping resource assignment.');
          continue;
        }
        
        // Create 2-5 resource assignments for this project request
        const resourceCount = Math.floor(Math.random() * 4) + 2; // 2-5 resources
        const phases = ['Analysis', 'Development', 'Testing', 'Deployment', 'Support'];
        
        for (let j = 0; j < resourceCount; j++) {
          // Choose a random resource type
          const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
          
          // Choose a random phase
          const phase = phases[Math.floor(Math.random() * phases.length)];
          
          // Random number of days (1-20)
          const days = Math.floor(Math.random() * 20) + 1;
          
          // Create the resource assignment
          const { error: resourceError } = await supabase
            .from('project_resources')
            .insert({
              project_request_id: projectRequest[0].id,
              resource_type_id: resourceType.id,
              resource_name: resourceType.name,
              quantity: 1,
              rate: resourceType.rate || (85 + (Math.floor(Math.random() * 6) * 5)), // Use defined rate or random rate between 85-115
              days: days,
              phase: phase
            });
            
          if (resourceError) {
            console.error(`Error creating resource for project request ${projectRequest[0].id}:`, resourceError);
          } else {
            console.log(`Created ${days} days of ${resourceType.code} resource for phase ${phase}`);
          }
        }
      }
    }
    
    console.log('Finished creating test project requests');
    
  } catch (error) {
    console.error('Error in createTestProjectRequests:', error);
  }
}

// Export the function for Node.js
if (typeof module !== 'undefined') {
  module.exports = { createTestProjectRequests };
}

// Usage example (uncomment to run when executing the script directly)
// createTestProjectRequests(5, true).then(() => console.log('Done!')); 