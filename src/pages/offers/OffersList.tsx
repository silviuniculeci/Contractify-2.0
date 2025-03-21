import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, TrendingUp, Archive, Clock, DollarSign, Search, Filter, Package, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';
import type { Offer, ContractType } from '../../types/offer';
import type { Product, LicenseType, ProjectType } from '../../types/product';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';

export default function OffersList() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [licenseTypes, setLicenseTypes] = useState<Record<string, LicenseType>>({});
  const [projectTypes, setProjectTypes] = useState<Record<string, ProjectType>>({});

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackageType, setSelectedPackageType] = useState<ContractType | ''>('');
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedProjectType, setSelectedProjectType] = useState<string>('');

  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [projectTypeNames, setProjectTypeNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch offers
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select('*')
          .order('created_at', { ascending: false });

        if (offersError) {
          console.error('Error fetching offers:', offersError);
          setError('Failed to load offers');
          return;
        }

        setOffers(offersData || []);
        setFilteredOffers(offersData || []);

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');

        if (productsError) {
          console.error('Error fetching products:', productsError);
          return;
        }

        const productsMap: Record<string, Product> = {};
        productsData?.forEach(product => {
          productsMap[product.id] = product;
        });
        setProducts(productsMap);

        // Fetch license types
        const { data: licenseTypesData, error: licenseTypesError } = await supabase
          .from('license_types')
          .select('*');

        if (licenseTypesError) {
          console.error('Error fetching license types:', licenseTypesError);
          return;
        }

        const licenseTypesMap: Record<string, LicenseType> = {};
        licenseTypesData?.forEach(licenseType => {
          licenseTypesMap[licenseType.id] = licenseType;
        });
        setLicenseTypes(licenseTypesMap);
        
        // Fetch project types
        const { data: projectTypesData, error: projectTypesError } = await supabase
          .from('project_types')
          .select('*');

        if (projectTypesError) {
          console.error('Error fetching project types:', projectTypesError);
          return;
        }

        const projectTypesMap: Record<string, ProjectType> = {};
        projectTypesData?.forEach(projectType => {
          projectTypesMap[projectType.id] = projectType;
        });
        setProjectTypes(projectTypesMap);

        // Fetch product categories for name mapping
        const { data: productCategories, error: productError } = await supabase
          .from('product_categories')
          .select('id, name');

        if (productError) {
          console.error('Error fetching product categories:', productError);
        } else {
          const productMap: Record<string, string> = {};
          productCategories?.forEach(product => {
            productMap[product.id] = product.name;
          });
          setProductNames(productMap);
        }

        // Fetch project types for name mapping
        const { data: projectTypesNames, error: projectTypeError } = await supabase
          .from('project_types')
          .select('id, name');

        if (projectTypeError) {
          console.error('Error fetching project types:', projectTypeError);
        } else {
          const projectTypeMap: Record<string, string> = {};
          projectTypesNames?.forEach(type => {
            projectTypeMap[type.id] = type.name;
          });
          setProjectTypeNames(projectTypeMap);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    let result = [...offers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        offer =>
          offer.customer_name.toLowerCase().includes(query) ||
          offer.cui.toLowerCase().includes(query) ||
          (products[offer.product_id || '']?.name.toLowerCase().includes(query))
      );
    }

    // Apply package type filter
    if (selectedPackageType) {
      result = result.filter(offer => offer.contract_type === selectedPackageType);
    }

    // Apply product type filter
    if (selectedProductType) {
      result = result.filter(offer => offer.product_id === selectedProductType);
    }

    // Apply project type filter
    if (selectedProjectType) {
      result = result.filter(offer => offer.project_type_id === selectedProjectType);
    }

    // Apply status filter
    if (selectedStatus) {
      result = result.filter(offer => offer.status === selectedStatus);
    }

    setFilteredOffers(result);
  }, [searchQuery, selectedPackageType, selectedProductType, selectedProjectType, selectedStatus, offers, products]);

  // Calculate statistics based on filtered offers
  const totalOffers = filteredOffers.length;
  const approvedOffers = filteredOffers.filter(offer => offer.status === 'Approved').length;
  const conversionRate = totalOffers > 0 ? Math.round((approvedOffers / totalOffers) * 100) : 0;
  const pendingOffers = filteredOffers.filter(offer => offer.status === 'Pending').length;
  
  // Update the accepted value calculation to handle null values
  const acceptedValue = filteredOffers
    .filter(offer => offer.status === 'Approved')
    .reduce((sum, offer) => sum + (offer.value || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique products for the filter dropdown
  const uniqueProducts = Object.values(products).filter(product => 
    offers.some(offer => offer.product_id === product.id)
  );
  
  // Get unique project types for the filter dropdown
  const uniqueProjectTypes = Object.values(projectTypes).filter(projectType => 
    offers.some(offer => offer.project_type_id === projectType.id)
  );

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
                    <Archive className="h-6 w-6 text-gray-400" />
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
                    <TrendingUp className="h-6 w-6 text-gray-400" />
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
                    <DollarSign className="h-6 w-6 text-gray-400" />
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
                    <Clock className="h-6 w-6 text-gray-400" />
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

                {/* Product Type Filter */}
                <div>
                  <label htmlFor="productType" className="block text-sm font-medium text-gray-700">
                    Product
                  </label>
                  <select
                    id="productType"
                    name="productType"
                    value={selectedProductType}
                    onChange={(e) => setSelectedProductType(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Products</option>
                    {uniqueProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Package Type Filter */}
                <div>
                  <label htmlFor="packageType" className="block text-sm font-medium text-gray-700">
                    Contract Type
                  </label>
                  <select
                    id="packageType"
                    name="packageType"
                    value={selectedPackageType}
                    onChange={(e) => setSelectedPackageType(e.target.value as ContractType | '')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Contract Types</option>
                    <option value="Implementation">Implementation</option>
                    <option value="Support">Support</option>
                    <option value="License">License</option>
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
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {(searchQuery || selectedPackageType || selectedProductType || selectedProjectType || selectedStatus) && (
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
                      Product: {products[selectedProductType]?.name}
                      <button
                        onClick={() => setSelectedProductType('')}
                        className="ml-2 inline-flex text-purple-400 hover:text-purple-600"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </button>
                    </span>
                  )}
                  {selectedPackageType && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Contract: {selectedPackageType}
                      <button
                        onClick={() => setSelectedPackageType('')}
                        className="ml-2 inline-flex text-blue-400 hover:text-blue-600"
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
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredOffers.map((offer) => (
                <li key={offer.id}>
                  <Link 
                    to={`/offers/${offer.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-blue-600 truncate hover:text-blue-800">
                              {offer.customer_name}
                            </p>
                            {offer.product_id && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center">
                                <Package className="h-3 w-3 mr-1" />
                                {products[offer.product_id]?.name} 
                                {offer.license_type_id && licenseTypes[offer.license_type_id] && 
                                  ` - ${licenseTypes[offer.license_type_id].name}`
                                }
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-2 flex flex-col items-end">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(offer.status)}`}>
                            {offer.status}
                          </span>
                          {offer.value && (
                            <span className="mt-1 text-sm font-medium text-gray-900">
                              €{offer.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            CUI: {offer.cui}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            {offer.contract_type}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Created at:{' '}
                            {new Date(offer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
} 