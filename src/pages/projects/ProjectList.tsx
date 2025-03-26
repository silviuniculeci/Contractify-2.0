import React, { useState } from 'react';
import { ChevronDown, Filter, Calendar, User, Clock, MessageSquare, PieChart, Folder } from 'lucide-react';

const ProjectsDashboard = () => {
  const [expandedSections, setExpandedSections] = useState({
    new: true,
    returned: true,
    inProgress: true,
    completed: true
  });
  const toggleSection = (section: 'new' | 'returned' | 'inProgress' | 'completed') => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Side Panel */}
      <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center pt-5">
        <div className="w-14 h-14 rounded-lg bg-blue-600 text-white flex flex-col items-center justify-center cursor-pointer mb-4 hover:bg-blue-700">
          <div className="text-lg mb-1">📊</div>
          <span className="text-xs">Projects</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-medium">Projects Overview</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center text-sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          <div className="bg-blue-50 p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="mr-3 rounded-full p-2 bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-gray-600 text-sm font-medium">New Projects</div>
            </div>
            <div className="text-3xl font-medium text-gray-800">5</div>
          </div>
          <div className="bg-amber-50 p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="mr-3 rounded-full p-2 bg-amber-100">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-gray-600 text-sm font-medium">Returned for Review</div>
            </div>
            <div className="text-3xl font-medium text-gray-800">3</div>
          </div>
          <div className="bg-green-50 p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="mr-3 rounded-full p-2 bg-green-100">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-gray-600 text-sm font-medium">In Progress</div>
            </div>
            <div className="text-3xl font-medium text-gray-800">8</div>
          </div>
          <div className="bg-purple-50 p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="mr-3 rounded-full p-2 bg-purple-100">
                <Folder className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-gray-600 text-sm font-medium">Completed</div>
            </div>
            <div className="text-3xl font-medium text-gray-800">12</div>
          </div>
        </div>
        
        {/* Projects Sections */}
        <div className="mb-6">
          <div 
            className="flex justify-between items-center p-4 bg-white rounded-t-lg shadow-sm border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('new')}
          >
            <h2 className="font-medium">Projects Submitted by Sales</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
          
          {expandedSections.new && (
            <div className="bg-white rounded-b-lg shadow-sm">
              <div key="1" className="border-b border-gray-100 p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex">
                  <div className="flex-1">
                    <div className="font-medium mb-1">Test Company S SRL - Business Central Implementation</div>
                    <div className="flex text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" /> Go-live: 24/07/2025
                      </span>
                      <span className="flex items-center">
                        <User className="mr-1 h-4 w-4" /> Silviu Niculeci
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" /> Submitted: 20/03/2025
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      New
                    </span>
                  </div>
                </div>
              </div>
              
              <div key="2" className="border-b border-gray-100 p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex">
                  <div className="flex-1">
                    <div className="font-medium mb-1">Acme Corporation - Business Central Manufacturing</div>
                    <div className="flex text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" /> Go-live: 15/05/2025
                      </span>
                      <span className="flex items-center">
                        <User className="mr-1 h-4 w-4" /> Alex Johnson
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" /> Submitted: 18/03/2025
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      New
                    </span>
                  </div>
                </div>
              </div>
              
              <div key="3" className="p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex">
                  <div className="flex-1">
                    <div className="font-medium mb-1">Global Trading Ltd - Business Central Finance</div>
                    <div className="flex text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" /> Go-live: 01/06/2025
                      </span>
                      <span className="flex items-center">
                        <User className="mr-1 h-4 w-4" /> Maria Garcia
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" /> Submitted: 15/03/2025
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      New
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <div
            className="flex justify-between items-center p-4 bg-white rounded-t-lg shadow-sm border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('returned')}
          >
            <h2 className="font-medium">Projects Returned for Review</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
          
          {expandedSections.returned && (
            <div className="bg-white rounded-b-lg shadow-sm">
              <div key="4" className="border-b border-gray-100 p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex">
                  <div className="flex-1">
                    <div className="font-medium mb-1">Tech Solutions Inc - Business Central Cloud Migration</div>
                    <div className="flex text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" /> Go-live: 10/05/2025
                      </span>
                      <span className="flex items-center">
                        <User className="mr-1 h-4 w-4" /> John Smith
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="mr-1 h-4 w-4" /> 2 comments
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Returned
                    </span>
                  </div>
                </div>
              </div>
              
              <div key="5" className="p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex">
                  <div className="flex-1">
                    <div className="font-medium mb-1">Pacific Retail - Business Central POS Integration</div>
                    <div className="flex text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" /> Go-live: 01/06/2025
                      </span>
                      <span className="flex items-center">
                        <User className="mr-1 h-4 w-4" /> Sarah Lee
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="mr-1 h-4 w-4" /> 5 comments
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Returned
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <div
            className="flex justify-between items-center p-4 bg-white rounded-t-lg shadow-sm border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('inProgress')}
          >
            <h2 className="font-medium">Projects In Progress</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
          
          {expandedSections.inProgress && (
            <div className="bg-white rounded-b-lg shadow-sm">
              <div key="6" className="border-b border-gray-100 p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex">
                  <div className="flex-1">
                    <div className="font-medium mb-1">SC Fashionhouse SA - Business Central Implementation</div>
                    <div className="flex text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" /> Go-live: 15/04/2025
                      </span>
                      <span className="flex items-center">
                        <User className="mr-1 h-4 w-4" /> Robert Chen
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
              
              <div key="7" className="p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex">
                  <div className="flex-1">
                    <div className="font-medium mb-1">Northern Manufacturing - Business Central Production</div>
                    <div className="flex text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" /> Go-live: 30/04/2025
                      </span>
                      <span className="flex items-center">
                        <User className="mr-1 h-4 w-4" /> David Wilson
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <div
            className="flex justify-between items-center p-4 bg-white rounded-t-lg shadow-sm border-b border-gray-200 cursor-pointer"
            onClick={() => toggleSection('completed')}
          >
            <h2 className="font-medium">Completed Projects</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
          
          {expandedSections.completed && (
            
              <div key="8" className="bg-white rounded-b-lg shadow-sm p-10 text-center text-gray-500">
                <Folder className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No completed projects in the last 30 days</p>
              </div>
            
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsDashboard;