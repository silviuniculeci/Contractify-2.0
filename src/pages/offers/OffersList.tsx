import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Offer as BaseOffer } from '../../types/offer';
import { formatCurrency } from '../../lib/utils';
import Layout from '../../components/Layout';
import type { ContractType } from '../../types/offer';
import type { Product, LicenseType, ProjectType } from '../../types/product';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

// Add interface for project plan data
interface ProjectPlan {
  id: string;
  status: string;
  created_at: string | null;
}

// Extend the Offer type to include solution_id
interface Offer extends BaseOffer {
  solution_id?: string;
  project_plan_requested?: boolean;
  project_plan_submitted?: boolean;
  project_plans?: ProjectPlan[];
}

export default function OffersList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for URL parameters that indicate a project plan was just requested
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const requestedPlan = searchParams.get('planRequested');
    const offerId = searchParams.get('offerId');
    
    if (requestedPlan === 'true' && offerId) {
      toast.success('Project Plan requested successfully');
      // Remove the parameters from the URL to prevent showing the toast on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);
  
  // Define initial categories
  const initialCategories = [
    { id: '1', name: 'Business Central', code: 'BC' },
    { id: '2', name: 'Finance & Operations', code: 'FO' },
    { id: '3', name: 'Timeqode', code: 'TQ' }
  ];

  // All state declarations
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [licenseTypes, setLicenseTypes] = useState<Record<string, LicenseType>>({});
  const [projectTypes, setProjectTypes] = useState<Record<string, ProjectType>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedProjectType, setSelectedProjectType] = useState<string>('');
  const [projectTypeNames, setProjectTypeNames] = useState<Record<string, string>>({});
  const [showPendingProjectPlans, setShowPendingProjectPlans] = useState<boolean>(false);
  
  // Initialize categories with initial data
  const [productCategories, setProductCategories] = useState<Record<string, { id: string, name: string }>>(() => {
    const categoriesMap: Record<string, { id: string, name: string }> = {};
    initialCategories.forEach(category => {
      categoriesMap[category.id] = {
        id: category.id,
        name: category.name
      };
    });
    return categoriesMap;
  });

  // Initialize product names with initial data
  const [productNames, setProductNames] = useState<Record<string, string>>(() => {
    const namesMap: Record<string, string> = {};
    initialCategories.forEach(category => {
      namesMap[category.id] = category.name;
    });
    return namesMap;
  });

  // Add debugging flag
  const isDebugMode = true;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Starting to fetch offers...');

        // First check if we can connect to Supabase
        const { data: testConnection, error: connectionError } = await supabase
          .from('offers')
          .select('count')
          .limit(1);

        if (connectionError) {
          console.error('Supabase connection error:', connectionError);
          setError(`Database connection error: ${connectionError.message}`);
          return;
        }

        console.log('Successfully connected to Supabase');

        // Fetch offers with detailed error logging
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select(`
            *,
            project_plans:project_requests(id, status, created_at)
          `)
          .order('created_at', { ascending: false });

        if (offersError) {
          console.error('Error fetching offers:', offersError);
          setError(`Failed to load offers: ${offersError.message}`);
          return;
        }

        if (!offersData) {
          console.warn('No offers data received');
          setError('No offers data received from the server');
          return;
        }

        console.log('Successfully fetched offers:', offersData.length);
        
        // Add detailed debugging for the specific offer
        const specificOffer = offersData.find(o => o.id === 'a900599f-a7b4-4681-abfb-210ed65487a2');
        if (specificOffer) {
          console.log('IMPORTANT: Found specific offer in raw data:', specificOffer.id);
          console.log('IMPORTANT: Raw project_plans data:', JSON.stringify(specificOffer.project_plans, null, 2));
          console.log('IMPORTANT: Raw offer status:', specificOffer.status);
        } else {
          console.log('IMPORTANT: Specific offer not found in data');
        }
        
        // Process offers to include project plan information
        const processedOffers = offersData.map(offer => {
          // If this is the specific offer we're interested in, log detailed debug info
          if (offer.id === 'a900599f-a7b4-4681-abfb-210ed65487a2') {
            console.log('DEBUG: Processing specific offer:', offer.id);
            console.log('DEBUG: project_plans:', JSON.stringify(offer.project_plans, null, 2));
          }
          
          // Check if this offer has requested a project plan
          const hasProjectPlanRequest = Array.isArray(offer.project_plans) && offer.project_plans.length > 0;
          
          // Check if the project plan has been submitted - using case-insensitive comparison
          const projectPlanSubmitted = hasProjectPlanRequest && 
            offer.project_plans.some((plan: ProjectPlan) => 
              plan.status.toUpperCase() === 'SUBMITTED'
            );
          
          // Add more detailed logging for the specific offer
          if (offer.id === 'a900599f-a7b4-4681-abfb-210ed65487a2') {
            console.log('DEBUG: hasProjectPlanRequest:', hasProjectPlanRequest);
            console.log('DEBUG: projectPlanSubmitted:', projectPlanSubmitted);
            console.log('DEBUG: Combined status will be:', hasProjectPlanRequest && !projectPlanSubmitted ? 'Awaiting Project Plan' : 
                                               (hasProjectPlanRequest && projectPlanSubmitted ? 'Project Plan Submitted' : offer.status));
          }
          
          return {
            ...offer,
            project_plan_requested: hasProjectPlanRequest,
            project_plan_submitted: projectPlanSubmitted
          };
        });
        
        console.log('Processed offers:', processedOffers.length);
        setOffers(processedOffers);
        setFilteredOffers(processedOffers);

        // Fetch solutions with error handling
        const { data: solutionsData, error: solutionsError } = await supabase
          .from('solutions')
          .select('*')
          .order('name');

        if (solutionsError) {
          console.error('Error fetching solutions:', solutionsError);
          // Don't return here, continue with default values
        }

        if (solutionsData && solutionsData.length > 0) {
          console.log('Successfully fetched solutions:', solutionsData.length);
          
          const solutionsMap: Record<string, { id: string, name: string }> = {};
          const namesMap: Record<string, string> = {};
          
          solutionsData.forEach(solution => {
            solutionsMap[solution.id] = { 
              id: solution.id, 
              name: solution.name 
            };
            namesMap[solution.id] = solution.name;
          });
          
          setProductCategories(solutionsMap);
          setProductNames(namesMap);
        } else {
          console.log('No solutions found, using default values');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error in fetchData:', error);
        setError(`Failed to load data: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get combined status that includes project plan information
  const getCombinedStatus = (offer: Offer): string => {
    // Add debug logging for our specific offer
    if (offer.id === 'a900599f-a7b4-4681-abfb-210ed65487a2') {
      console.log('DEBUG: getCombinedStatus for specific offer:', offer.id);
      console.log('DEBUG: offer.status:', offer.status);
      console.log('DEBUG: offer.project_plan_requested:', offer.project_plan_requested);
      console.log('DEBUG: offer.project_plan_submitted:', offer.project_plan_submitted);
    }

    // Always prioritize project plan status conditions
    if (offer.project_plan_requested === true) {
      if (!offer.project_plan_submitted) {
        return "Awaiting Project Plan";
      } else {
        return "Project Plan Submitted";
      }
    }
    return offer.status;
  };

  // Update the getStatusColor function to include project plan statuses
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Pending Approval':
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Awaiting Project Plan':
        return 'bg-orange-100 text-orange-800';
      case 'Project Plan Submitted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Apply status filter
  useEffect(() => {
    let result = [...offers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        offer =>
          offer.customer_name.toLowerCase().includes(query) ||
          offer.cui.toLowerCase().includes(query) ||
          (productNames[offer.solution_id || '']?.toLowerCase?.() || '').includes(query)
      );
    }

    // Apply solution filter
    if (selectedProductType) {
      console.log('Filtering offers by solution ID:', selectedProductType);
      result = result.filter(offer => {
        // Try all possible field names that might contain the solution ID
        const offerSolutionId = offer.solution_id || offer.product_id;
        
        // Add more detailed logging to help debug the issue
        if (offer.id) {
          console.log(`Checking offer ${offer.id}: solution_id=${offer.solution_id}, product_id=${offer.product_id}, selected=${selectedProductType}`);
        }
        
        // Check if any of them match the selected solution
        return offerSolutionId === selectedProductType;
      });
    }

    // Apply project type filter
    if (selectedProjectType) {
      result = result.filter(offer => offer.project_type_id === selectedProjectType);
    }

    // Apply status filter - updated to check combined status
    if (selectedStatus) {
      result = result.filter(offer => {
        const combinedStatus = getCombinedStatus(offer);
        return combinedStatus === selectedStatus;
      });
    }

    // Apply pending project plans filter
    if (showPendingProjectPlans) {
      result = result.filter(offer => 
        offer.project_plan_requested === true && 
        (offer.project_plan_submitted === false || offer.project_plan_submitted === undefined)
      );
    }

    console.log('Filtered offers:', result.length);
    setFilteredOffers(result);
  }, [searchQuery, selectedProductType, selectedProjectType, selectedStatus, showPendingProjectPlans, offers, productNames]);

  // Calculate statistics based on filtered offers
  const totalOffers = filteredOffers.length;
  const approvedOffers = filteredOffers.filter(offer => offer.status === 'Approved').length;
  const conversionRate = totalOffers > 0 ? Math.round((approvedOffers / totalOffers) * 100) : 0;
  const pendingOffers = filteredOffers.filter(offer => offer.status === 'Pending').length;
  
  // Update the accepted value calculation to handle null values
  const acceptedValue = filteredOffers
    .filter(offer => offer.status === 'Approved')
    .reduce((sum, offer) => sum + (offer.value || 0), 0);

  // Get unique products for the filter dropdown
  const uniqueProducts = Object.values(products).filter(product => 
    offers.some(offer => offer.product_id === product.id)
  );
  
  // Get unique project types for the filter dropdown
  const uniqueProjectTypes = Object.values(projectTypes).filter(projectType => 
    offers.some(offer => offer.project_type_id === projectType.id)
  );

  const handleDeleteOffer = async (offerId: string) => {
    try {
      // Delete the offer
      const { error: offerError } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (offerError) {
        console.error('Error deleting offer:', offerError);
        toast.error(`Failed to delete offer: ${offerError.message}`);
        return;
      }

      // Update local state
      setOffers(offers.filter(offer => offer.id !== offerId));
      setFilteredOffers(filteredOffers.filter(offer => offer.id !== offerId));
      toast.success('Offer deleted successfully');
    } catch (error) {
      console.error('Error in handleDeleteOffer:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Add a useEffect hook specifically for debugging solutions
  useEffect(() => {
    const checkSolutions = async () => {
      try {
        console.log('DEBUG: Directly querying solutions table...');
        const { data, error } = await supabase
          .from('solutions')
          .select('*');
        
        if (error) {
          console.error('DEBUG: Error fetching solutions:', error);
        } else {
          console.log('DEBUG: Raw solutions data:', JSON.stringify(data, null, 2));
          console.log('DEBUG: Number of solutions:', data?.length || 0);
        }
      } catch (err) {
        console.error('DEBUG: Exception in checkSolutions:', err);
      }
    };
    
    checkSolutions();
  }, []);

  // Add a useEffect to log offer ID fields after data is loaded
  useEffect(() => {
    if (offers.length > 0) {
      console.log('OFFER FIELD DEBUG:');
      console.log('First offer keys:', Object.keys(offers[0]));
      const firstOffer = offers[0];
      console.log('solution_id:', firstOffer.solution_id);
      console.log('product_id:', firstOffer.product_id);
      console.log('All solution IDs:', offers.map(o => o.solution_id || o.product_id));
      
      console.log('SOLUTION DEBUG:');
      console.log('All solution names:', productNames);
    }
  }, [offers, productNames]);

  // Add a new function to check the offers table schema
  const checkOffersSchema = async () => {
    try {
      console.log('Checking offers table schema...');
      
      // Try to get the column names directly
      const { data: columns, error: columnsError } = await supabase.rpc(
        'get_columns_for_table',
        { table_name: 'offers' }
      );
      
      if (columnsError) {
        console.error('Error fetching columns:', columnsError);
      } else {
        console.log('Offers table columns:', columns);
      }
      
      // Try a direct query to check a single offer
      if (offers.length > 0) {
        const firstOfferId = offers[0].id;
        
        if (firstOfferId) {
          const { data: offerData, error: offerError } = await supabase
            .from('offers')
            .select('*')
            .eq('id', firstOfferId)
            .single();
            
          if (offerError) {
            console.error('Error fetching sample offer:', offerError);
          } else {
            console.log('Sample offer from direct query:', offerData);
            console.log('Sample offer fields:', Object.keys(offerData));
          }
        }
      }
    } catch (err) {
      console.error('Error checking offers schema:', err);
    }
  };

  // Call this function after offers are loaded
  useEffect(() => {
    if (offers.length > 0) {
      checkOffersSchema();
    }
  }, [offers]);

  // Add function to render project plan status badge
  const renderProjectPlanStatus = (offer: Offer) => {
    if (!offer.project_plan_requested) {
      return null;
    }
    
    if (offer.project_plan_submitted) {
      return (
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          Project Plan Submitted
        </span>
      );
    } else {
      return (
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          Project Plan Pending
        </span>
      );
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Offer Overview</h1>
              <p className="mt-1 text-sm text-gray-500">Manage all your offers in one place</p>
            </div>
            <Link
              to="/offers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Offer
            </Link>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Offers */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Offers</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{totalOffers}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{conversionRate}%</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Accepted Value */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Accepted Value</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          €{acceptedValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Offers */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Offers</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{pendingOffers}</div>
                        <p className="ml-2 flex items-baseline text-sm font-semibold text-yellow-600">
                          Awaiting Response
                        </p>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="mt-6 bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
            <div className="flex gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                <span className="text-sm text-gray-600">
                  {filteredOffers.filter(o => o.status === 'Pending').length} Pending
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                <span className="text-sm text-gray-600">
                  {filteredOffers.filter(o => o.status === 'Approved').length} Accepted
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                <span className="text-sm text-gray-600">
                  {filteredOffers.filter(o => o.status === 'Rejected').length} Rejected
                </span>
              </div>
            </div>
          </div>

          {/* Filter Section - Updated */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-base font-medium text-gray-700">Filter Offers</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Search Input */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search offers..."
                    />
                  </div>
                </div>

                {/* Product Category Filter */}
                <div>
                  <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700">
                    Solution
                  </label>
                  <select
                    id="productCategory"
                    name="productCategory"
                    value={selectedProductType}
                    onChange={(e) => {
                      console.log('Selected solution ID:', e.target.value);
                      setSelectedProductType(e.target.value);
                    }}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Solutions</option>
                    {Object.keys(productCategories).length > 0 ? (
                      Object.entries(productCategories)
                        .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                        .map(([id, category]) => (
                          <option key={id} value={id}>
                            {category.name}
                          </option>
                        ))
                    ) : (
                      // Fallback options if productCategories is empty
                      [
                        { id: '1', name: 'Business Central' },
                        { id: '2', name: 'Finance & Operations' },
                        { id: '3', name: 'Timeqode' }
                      ].map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Project Type Filter */}
                <div>
                  <label htmlFor="projectType" className="block text-sm font-medium text-gray-700">
                    Project Type
                  </label>
                  <select
                    id="projectType"
                    name="projectType"
                    value={selectedProjectType}
                    onChange={(e) => setSelectedProjectType(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Project Types</option>
                    {uniqueProjectTypes.map((projectType) => (
                      <option key={projectType.id} value={projectType.id}>
                        {projectType.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Awaiting Project Plan">Awaiting Project Plan</option>
                    <option value="Project Plan Submitted">Project Plan Submitted</option>
                  </select>
                </div>

                {/* Project Plan Filter */}
                <div className="col-span-1 lg:col-span-4 mt-2">
                  <div className="flex items-center">
                    <input
                      id="filter-pending-project-plans"
                      name="filter-pending-project-plans"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={showPendingProjectPlans}
                      onChange={(e) => setShowPendingProjectPlans(e.target.checked)}
                    />
                    <label htmlFor="filter-pending-project-plans" className="ml-2 block text-sm text-gray-700">
                      Show only offers awaiting project plans from operations
                    </label>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {(searchQuery || selectedProductType || selectedProjectType || selectedStatus || showPendingProjectPlans) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchQuery && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Search: {searchQuery}
                      <button
                        onClick={() => setSearchQuery('')}
                        className="ml-2 inline-flex text-blue-400 hover:text-blue-600"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </button>
                    </span>
                  )}
                  {selectedProductType && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      Solution: {productCategories[selectedProductType]?.name || 'Unknown'}
                      <button
                        onClick={() => setSelectedProductType('')}
                        className="ml-2 inline-flex text-purple-400 hover:text-purple-600"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </button>
                    </span>
                  )}
                  {selectedProjectType && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Project: {projectTypeNames[selectedProjectType]}
                      <button
                        onClick={() => setSelectedProjectType('')}
                        className="ml-2 inline-flex text-green-400 hover:text-green-600"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </button>
                    </span>
                  )}
                  {selectedStatus && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Status: {selectedStatus}
                      <button
                        onClick={() => setSelectedStatus('')}
                        className="ml-2 inline-flex text-blue-400 hover:text-blue-600"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </button>
                    </span>
                  )}
                  {showPendingProjectPlans && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Awaiting Project Plans
                      <button
                        onClick={() => setShowPendingProjectPlans(false)}
                        className="ml-2 inline-flex text-yellow-400 hover:text-yellow-600"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 border-l-4 border-red-400 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading offers...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No offers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {offers.length > 0 
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating a new offer.'}
            </p>
            <div className="mt-6">
              <Link
                to="/offers/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Offer
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solution</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOffers.map((offer) => (
                    <tr key={offer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/offers/${offer.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {offer.customer_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{offer.cui}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(() => {
                            const solutionId = offer.solution_id || offer.product_id;
                            if (solutionId && productNames[solutionId]) {
                              return productNames[solutionId];
                            }
                            return 'N/A';
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{projectTypeNames[offer.project_type_id || ''] || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(offer.value)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                          getStatusColor(getCombinedStatus(offer))
                        )}>
                          {getCombinedStatus(offer)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {offer.created_at ? new Date(offer.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {offer.status === 'Draft' && (
                          <button
                            onClick={() => handleDeleteOffer(offer.id || '')}
                            className="text-red-600 hover:text-red-900"
                            title="Delete offer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 