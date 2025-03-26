import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Plus, Filter } from 'lucide-react';
import Layout from '../../components/Layout';
import { supabase } from '../../supabaseClient';

interface Offer {
  id: string;
  customer_name: string;
  solution_id: string;
  project_type_id: string;
  order_date: string;
  value: number;
  status: string;
}

const getSolutionName = async (solution_id: string) => {
  try {
    const { data, error } = await supabase
      .from('solutions')
      .select('name')
      .eq('id', solution_id)
      .single();

    if (error) {
      console.error('Error fetching solution name:', error);
      return '';
    }

    return data.name || '';
  } catch (error) {
    console.error('Error fetching solution name:', error);
    return '';
  }
};

const getProjectTypeName = async (project_type_id: string) => {
  try {
    const { data, error } = await supabase
      .from('project_types')
      .select('name')
      .eq('id', project_type_id)
      .single();

    if (error) {
      console.error('Error fetching project type name:', error);
      return '';
    }

    return data.name || '';
  } catch (error) {
    console.error('Error fetching project type name:', error);
    return '';
  }
};

const SavedOffersView = () => {
  // State for filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [solutionFilter, setSolutionFilter] = useState('all');
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [solutionNames, setSolutionNames] = useState<{ [key: string]: string }>({});
  const [projectTypeNames, setProjectTypeNames] = useState<{ [key: string]: string }>({});
  
  // State for chart data
  const [statusCounts, setStatusCounts] = useState({
    approved: 0,
    pending: 0,
    draft: 0,
    rejected: 0,
  });

  useEffect(() => {
    const fetchSolutionNames = async () => {
      const names: { [key: string]: string } = {};
      for (const offer of offers) {
        const solutionName = await getSolutionName(offer.solution_id);
        names[offer.solution_id] = solutionName;
      }
      setSolutionNames(names);
    };

    fetchSolutionNames();
  }, [offers]);

  useEffect(() => {
    const fetchProjectTypeNames = async () => {
      const names: { [key: string]: string } = {};
      for (const offer of offers) {
        const projectTypeName = await getProjectTypeName(offer.project_type_id);
        names[offer.project_type_id] = projectTypeName;
      }
      setProjectTypeNames(names);
    };

    fetchProjectTypeNames();
  }, [offers]);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data, error } = await supabase
          .from('offers')
          .select('*');

        if (error) {
          console.error('Error fetching offers:', error);
        }

        setOffers(data || []);
      } catch (error) {
        console.error('Error fetching offers:', error);
      }
    };

    fetchOffers();
  }, []);

  useEffect(() => {
    const calculateStatusCounts = () => {
      const counts = {
        approved: 0,
        pending: 0,
        draft: 0,
        rejected: 0,
      };

      offers.forEach((offer) => {
        const status = offer.status.toLowerCase();
        if (counts.hasOwnProperty(status)) {
          counts[status as keyof typeof counts]++;
        }
      });

      setStatusCounts(counts);
    };

    calculateStatusCounts();
  }, [offers]);

  // Available solutions and project types (would come from API in real app)
  const solutions = ['Business Central', 'Timeqode', 'Finance and Operations'];
  const projectTypes = ['Implementation', 'Enhancement', 'Support', 'Training'];

  // Filter offers based on selected filters
  const filteredOffers = offers.filter((offer: Offer) => {
    const matchesStatus = statusFilter === 'all' || offer.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSolution = solutionFilter === 'all' || offer.solution_id === solutionFilter;
    const matchesProjectType = projectTypeFilter === 'all' || offer.project_type_id === projectTypeFilter;

    return matchesStatus && matchesSolution && matchesProjectType;
  });

  // Get status badge class based on status
  const getStatusClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Function to calculate chart bar widths based on status counts
  const calculateBarWidth = (status: string) => {
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    return total === 0 ? 0 : (statusCounts[status as keyof typeof statusCounts] / total) * 100;
  };

  return (
    <Layout>
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-blue-600" />
            <h1 className="font-medium text-lg">Offers Overview</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1.5 rounded-md text-white text-sm font-medium bg-blue-600 border border-blue-600 shadow-sm hover:bg-blue-700 transition-colors duration-200 flex items-center">
              <Plus size={14} className="mr-1" />
              New Offer
            </button>
          </div>
        </div>
      </header>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Stats Overview Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm col-span-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Overview</h3>
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                  Current Month
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-gray-100 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-medium text-gray-500">Total Offers</div>
                    <div className="p-2 bg-blue-100 rounded-md">
                      <FileText size={14} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {Object.values(statusCounts).reduce((sum, count) => sum + count, 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600">↑ 12%</span> vs last month
                  </div>
                </div>
                
                <div className="border border-gray-100 rounded-lg p-4 bg-gradient-to-br from-green-50 to-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-medium text-gray-500">Total Value</div>
                  <div className="p-2 bg-green-100 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {offers.reduce((sum, offer) => offer.value + sum, 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  <span className="text-green-600">↑ 12%</span> vs last month
                </div>
              </div>
                
                <div className="border border-gray-100 rounded-lg p-4 bg-gradient-to-br from-green-50 to-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-medium text-gray-500">Approved</div>
                    <div className="p-2 bg-green-100 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{statusCounts.approved}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600">↑ 8%</span> vs last month
                  </div>
                </div>
                
                <div className="border border-gray-100 rounded-lg p-4 bg-gradient-to-br from-red-50 to-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-medium text-gray-500">Conversion Rate</div>
                    <div className="p-2 bg-red-100 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <polyline points="19 12 12 19 5 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {Object.values(statusCounts).reduce((sum, count) => sum + count, 0) === 0 ? 
                      '0%' : 
                      `${Math.round((statusCounts.approved / Object.values(statusCounts).reduce((sum, count) => sum + count, 0)) * 100)}%`
                  }
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600">↑ 5%</span> vs last month
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status Distribution Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm row-span-1 col-span-1 md:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-medium text-gray-800">Status Distribution</h3>
                <div className="flex space-x-2">
                  <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">Weekly</button>
                  <button className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Monthly</button>
                </div>
              </div>
              
              <div className="h-10 w-full bg-gray-100 rounded-lg overflow-hidden flex mb-4">
                {calculateBarWidth('approved') > 0 && (
                  <div 
                    className="h-full bg-green-500 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${calculateBarWidth('approved')}%` }}
                  >
                    {calculateBarWidth('approved') >= 10 && (
                      <span className="text-xs text-white font-medium">
                        {statusCounts.approved}
                      </span>
                    )}
                  </div>
                )}
                
                {calculateBarWidth('pending') > 0 && (
                  <div 
                    className="h-full bg-yellow-500 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${calculateBarWidth('pending')}%` }}
                  >
                    {calculateBarWidth('pending') >= 10 && (
                      <span className="text-xs text-white font-medium">
                        {statusCounts.pending}
                      </span>
                    )}
                  </div>
                )}
                
                {calculateBarWidth('draft') > 0 && (
                  <div 
                    className="h-full bg-gray-500 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${calculateBarWidth('draft')}%` }}
                  >
                    {calculateBarWidth('draft') >= 10 && (
                      <span className="text-xs text-white font-medium">
                        {statusCounts.draft}
                      </span>
                    )}
                  </div>
                )}
                
                {calculateBarWidth('rejected') > 0 && (
                  <div 
                    className="h-full bg-red-500 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${calculateBarWidth('rejected')}%` }}
                  >
                    {calculateBarWidth('rejected') >= 10 && (
                      <span className="text-xs text-white font-medium">
                        {statusCounts.rejected}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Approved ({statusCounts.approved})</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Pending ({statusCounts.pending})</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Draft ({statusCounts.draft})</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Rejected ({statusCounts.rejected})</span>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="font-medium text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">OF-2025-032</span> was approved
                    </p>
                    <span className="text-xs text-gray-500">Today, 10:30 AM</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">OF-2025-028</span> was submitted for approval
                    </p>
                    <span className="text-xs text-gray-500">Yesterday, 4:15 PM</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">OF-2025-035</span> is pending review
                    </p>
                    <span className="text-xs text-gray-500">March 15, 2025</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3 flex-1 flex-wrap gap-y-2 text-xs">
                  <div className="relative max-w-sm flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Search offers..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                  
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={solutionFilter}
                    onChange={(e) => setSolutionFilter(e.target.value)}
                  >
                    <option value="all">All Solutions</option>
                    {solutions.map(solution => (
                      <option key={solution} value={solution}>{solution}</option>
                    ))}
                  </select>
                  
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={projectTypeFilter}
                    onChange={(e) => setProjectTypeFilter(e.target.value)}
                  >
                    <option value="all">All Project Types</option>
                    {projectTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <button className="px-3 py-2 rounded-md text-gray-700 text-xs font-medium bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors duration-200 flex items-center">
                  <Download size={14} className="mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Offers Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-medium">Offers ({filteredOffers.length})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">Client</th>
                    <th className="px-6 py-3 text-left">Solution</th>
                    <th className="px-6 py-3 text-left">Project Type</th>
                                         <th className="px-6 py-3 text-right">Value</th>
                                         <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOffers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                        No offers match your filter criteria
                      </td>
                    </tr>
                  ) : (
                    filteredOffers.map((offer: Offer) => (
                      <tr key={offer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-sm">{offer.customer_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{solutionNames[offer.solution_id]}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{projectTypeNames[offer.project_type_id]}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">{offer.value}</td>
                                                                         <td className="px-6 py-4 whitespace-nowrap">
                                                                           <div className="flex justify-center">
                                                                             <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(offer.status)}`}>
                                                                               {offer.status}
                                                                             </span>
                                                                           </div>
                                                                         </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                  <div className="flex justify-end space-x-2">
                            <button className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                            <button className="p-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default SavedOffersView;
