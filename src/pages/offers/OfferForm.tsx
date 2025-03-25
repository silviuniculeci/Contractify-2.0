import { useState, useEffect, type ChangeEvent, type FormEvent, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save, ArrowLeft, FileText, ChevronDown, ChevronUp, Calendar, ArrowRight } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Offer, License, Product, ProjectType, LicenseType, OfferStatus } from '../../types/offer';
import Layout from '../../components/Layout';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx';
import RequestProjectPlanButton from '../../components/RequestProjectPlanButton';

// Update ProductCategory interface to Solution
interface Solution {
  id: string;
  name: string;
  code: string;
  description: string;
}

// Form state interface for our internal form handling
interface FormState {
  customer_name: string;
  cui: string;
  order_date: string | null;
  sales_person: string;
  project_description: string;
  go_live_date: string | null;
  approver: string | null;
  approval_date: string | null;
  status: OfferStatus;
  value: number | null;
  product_id: string | null;
  license_type_id: string | null;
  number_of_users: number | null;
  duration_months: number | null;
  project_type_id: string | null;
  annual_commitment: boolean;
  margin_pct: number;
  discount_pct: number;
  product_category: string | null;
  project_type: string | null;
  licenses: License[];
}

const initialFormData: FormState = {
  customer_name: '',
  cui: '',
  order_date: null,
  sales_person: '',
  project_description: '',
  go_live_date: null,
  approver: null,
  approval_date: null,
  status: 'Draft',
  value: null,
  product_id: null,
  license_type_id: null,
  number_of_users: null,
  duration_months: null,
  project_type_id: null,
  annual_commitment: false,
  margin_pct: 30,
  discount_pct: 0,
  product_category: null,
  project_type: null,
  licenses: []
};

// Add type definitions before the downloadOfferAsExcel function
interface OfferExcelData {
  'Client Information': Record<string, string | null>;
  'Project Details': Record<string, string | null>;
  'Licenses': Array<{
    'License Type': string;
    'Quantity': number;
    'Price': string;
    'Annual Commitment': string;
    'Monthly Payment': string;
    'Discount (%)': number;
    'Total Value': string;
    'Margin Value': string;
  }>;
  'Summary': Record<string, string>;
}

export default function OfferForm(): ReactElement {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormState>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [availableProjectTypes, setAvailableProjectTypes] = useState<ProjectType[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productInfoOpen, setProductInfoOpen] = useState(true);
  const [projectDescOpen, setProjectDescOpen] = useState(true);
  const [approvalInfoOpen, setApprovalInfoOpen] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([{ 
    id: 1, 
    type: '', 
    quantity: 1, 
    price: '',
    annualCommitment: false,
    monthlyPayment: false,
    discount: 0,
    totalValue: '',
    marginValue: ''
  }]);

  // Update state variable names and types
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);

  // Product-related state
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [selectedLicenseType, setSelectedLicenseType] = useState<LicenseType | null>(null);

  // Calculate total values
  const calculateTotals = () => {
    let totalValue = 0;
    let totalDiscount = 0;
    let totalMargin = 0;

    licenses.forEach(license => {
      const price = parseFloat(license.price) || 0;
      const quantity = license.quantity || 0;
      const discount = license.discount || 0;
      
      const itemValue = price * quantity;
      const itemDiscount = itemValue * (discount / 100);
      const finalItemValue = itemValue - itemDiscount;
      const itemMargin = finalItemValue * 0.3; // 30% margin
      
      totalValue += itemValue;
      totalDiscount += itemDiscount;
      totalMargin += itemMargin;
    });

    return {
      totalValue: totalValue.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      finalTotal: (totalValue - totalDiscount).toFixed(2),
      totalMargin: totalMargin.toFixed(2)
    };
  };
  
  const totals = calculateTotals();

  const addLicense = () => {
    const newId = licenses.length > 0 ? Math.max(...licenses.map(l => l.id)) + 1 : 1;
    setLicenses([...licenses, { 
      id: newId, 
      type: '', 
      quantity: 1, 
      price: '',
      annualCommitment: false,
      monthlyPayment: false,
      discount: 0,
      totalValue: '',
      marginValue: ''
    }]);
  };

  const removeLicense = (id: number) => {
    setLicenses(licenses.filter(license => license.id !== id));
  };

  // Fetch existing offer data if we're in edit mode
  useEffect(() => {
    const fetchOffer = async () => {
      if (id) {
        try {
          setLoading(true);
          console.log('Starting to fetch offer with ID:', id);
          // First fetch solutions to have them available
          await fetchSolutions();
          
          // First get the basic offer data
          console.log('Fetching basic offer data for ID:', id);
          const { data: offerData, error: offerError } = await supabase
            .from('offers')
            .select('*')
            .eq('id', id)
            .single();

          if (offerError) {
            console.error('Error fetching offer:', offerError);
            console.error('Error details:', JSON.stringify(offerError));
            setError('Failed to load offer: ' + offerError.message);
            console.log('Checking database schema after error...');
            await checkDatabaseSchema();
            return;
          }

          if (!offerData) {
            console.error('No offer data found for ID:', id);
            setError('Failed to load offer: No data found');
            console.log('Checking database schema after no data...');
            await checkDatabaseSchema();
            return;
          }

          console.log('Offer data:', offerData);
          
          // Get solution data if solution_id exists
          let solutionData = null;
          let productCategory = null;
          
          if (offerData.solution_id) {
            console.log('Fetching solution data for ID:', offerData.solution_id);
            const { data: solution, error: solutionError } = await supabase
              .from('solutions')
              .select('id, code, name')
              .eq('id', offerData.solution_id)
              .single();
              
            if (solutionError) {
              console.error('Error fetching solution data:', solutionError);
            } else if (solution) {
              console.log('Found solution data:', solution);
              solutionData = solution;
              productCategory = solution.code;
              
              // Update the selected product for dropdowns
              const matchingSolution = solutions.find(s => s.id === solution.id);
              if (matchingSolution) {
                console.log('Found matching solution in solutions list:', matchingSolution);
                setSelectedSolution(matchingSolution);
              } else {
                console.log('Solution not in list yet, will be updated when solutions are fetched');
              }
            }
          } else {
            console.log('No solution_id found in offer data');
          }
          
          // Get project type data if project_type_id exists
          let projectTypeData = null;
          let projectType = null;
          
          if (offerData.project_type_id) {
            console.log('Fetching project type data for ID:', offerData.project_type_id);
            const { data: projectTypeResult, error: projectTypeError } = await supabase
              .from('project_types')
              .select('id, code, name')
              .eq('id', offerData.project_type_id)
              .single();
              
            if (projectTypeError) {
              console.error('Error fetching project type data:', projectTypeError);
            } else if (projectTypeResult) {
              console.log('Found project type data:', projectTypeResult);
              projectTypeData = projectTypeResult;
              // Convert database code to UI code
              projectType = convertDbCodeToUiCode(projectTypeResult.code);
              console.log('Converted project type from', projectTypeResult.code, 'to', projectType);
            }
          } else {
            console.log('No project_type_id found in offer data');
          }
          
          // Get license data
          console.log('Fetching licenses for offer ID:', id);
          const { data: licenseData, error: licenseError } = await supabase
            .from('offer_licenses')
            .select('*')
            .eq('offer_id', id);
            
          if (licenseError) {
            console.error('Error fetching licenses:', licenseError);
          }
          
          console.log('Found license data:', licenseData);
          
          // Update form data with all fields
          setFormData({
            customer_name: offerData.customer_name,
            cui: offerData.cui,
            order_date: offerData.order_date || null,
            sales_person: offerData.sales_person,
            project_description: offerData.project_description || '',
            go_live_date: offerData.go_live_date || null,
            approver: offerData.approver || null,
            approval_date: offerData.approval_date || null,
            status: offerData.status,
            value: offerData.value || null,
            product_id: offerData.solution_id || null,
            license_type_id: offerData.license_type_id || null,
            number_of_users: offerData.number_of_users || null,
            duration_months: offerData.duration_months || null,
            project_type_id: offerData.project_type_id || null,
            annual_commitment: offerData.annual_commitment || false,
            margin_pct: offerData.margin_pct || 30,
            discount_pct: offerData.discount_pct || 0,
            product_category: productCategory,
            project_type: projectType,
            licenses: []
          });

          console.log('Form data set with solution:', productCategory, 'and project type:', projectType);

          // Handle licenses
          if (licenseData && licenseData.length > 0) {
            console.log('Processing offer licenses:', licenseData);
            
            // First fetch the license types to populate the dropdown
            if (productCategory) {
              console.log('Fetching license types before processing licenses');
              try {
                await fetchLicenseTypesForSolution(productCategory);
              } catch (err) {
                console.error('Error pre-fetching license types:', err);
              }
            }
            
            // Then format the licenses for display
            const formattedLicenses = licenseData.map((license: any, index: number) => {
              // Get license type details if available
              const licenseTypeDetails = licenseTypes.find(lt => lt.id === license.license_type_id);
              console.log('License type details for license', index, ':', licenseTypeDetails);
              
              return {
                id: index + 1,
                type: license.license_type_id,
                quantity: license.quantity,
                price: license.price ? license.price.toString() : '',
                annualCommitment: license.annual_commitment,
                monthlyPayment: license.monthly_payment,
                discount: license.discount || 0,
                totalValue: license.total_value ? license.total_value.toString() : '',
                marginValue: license.margin_value ? license.margin_value.toString() : ''
              };
            });
            
            console.log('Formatted licenses for UI:', formattedLicenses);
            setLicenses(formattedLicenses);
          } else {
            console.log('No licenses found for this offer, using default empty license');
            setLicenses([{ 
              id: 1, 
              type: '', 
              quantity: 1, 
              price: '',
              annualCommitment: false,
              monthlyPayment: false,
              discount: 0,
              totalValue: '',
              marginValue: ''
            }]);
          }

          // If solution is set, fetch license types
          if (productCategory) {
            console.log('Fetching license types for saved solution:', productCategory);
            try {
              // Make sure to set proper state before fetching license types
              setFormData(prevData => ({
                ...prevData,
                product_category: productCategory
              }));
              
              // Directly call the function to fetch license types
              await fetchLicenseTypesForSolution(productCategory);
            } catch (licenseTypeError) {
              console.error('Error fetching license types:', licenseTypeError);
            }
          }

          // Expand approval section if approver or date is set
          if (offerData.approver || offerData.approval_date) {
            setApprovalInfoOpen(true);
          }
        } catch (err) {
          console.error('Error in fetchOffer:', err);
          setError('An unexpected error occurred while loading the offer');
          console.log('Checking database schema after exception...');
          await checkDatabaseSchema();
        } finally {
          setLoading(false);
        }
      }
    };

    // Add diagnostic function to check DB structure
    const checkDatabaseSchema = async () => {
      console.log('Running database schema check...');
      try {
        // Check offers table columns
        const { data: offersColumns, error: offersError } = await supabase.rpc(
          'get_columns_for_table', 
          { table_name: 'offers' }
        );
        
        if (offersError) {
          console.error('Error checking offers table schema:', offersError);
        } else {
          console.log('Offers table columns:', offersColumns);
        }
        
        // Check solutions table
        const { data: solutionsColumns, error: solutionsError } = await supabase.rpc(
          'get_columns_for_table', 
          { table_name: 'solutions' }
        );
        
        if (solutionsError) {
          console.error('Error checking solutions table schema:', solutionsError);
        } else {
          console.log('Solutions table columns:', solutionsColumns);
        }
        
        // Check offer_licenses table
        const { data: licensesColumns, error: licensesError } = await supabase.rpc(
          'get_columns_for_table', 
          { table_name: 'offer_licenses' }
        );
        
        if (licensesError) {
          console.error('Error checking offer_licenses table schema:', licensesError);
        } else {
          console.log('Offer_licenses table columns:', licensesColumns);
        }
        
        // Try a direct query to see what tables are available
        const { data: tablesList, error: tablesError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');
          
        if (tablesError) {
          console.error('Error checking available tables:', tablesError);
        } else {
          console.log('Available tables in public schema:', tablesList);
        }
        
      } catch (err) {
        console.error('Error checking database schema:', err);
      }
    };

    fetchOffer();
    checkDatabaseSchema(); // Run schema check
  }, [id]);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      // No need to filter since the database now only contains the required products
      console.log('Fetched products:', data);
      setProducts(data || []);
    } catch (err) {
      console.error('Error in fetchProducts:', err);
    }
  };

  // Fetch license types when solution is selected
  const fetchLicenseTypes = async () => {
    try {
      if (!formData.product_category) {
        console.error('No solution selected for fetchLicenseTypes');
        setLicenseTypes([]);
        return;
      }

      console.log('Fetching license types for solution code:', formData.product_category);
      
      // Get the solution ID
      const { data: solutionData, error: solutionError } = await supabase
        .from('solutions')
        .select('id, name, code')
        .eq('code', formData.product_category)
        .single();

      if (solutionError) {
        console.error('Error fetching solution by code:', solutionError);
        console.log('Trying to fetch solution by name instead...');
        
        // Try by name as a fallback
        const { data: solutionByNameData, error: solutionByNameError } = await supabase
          .from('solutions')
          .select('id, name, code')
          .eq('name', formData.product_category)
          .single();
      
        if (solutionByNameError) {
          console.error('Error also fetching solution by name:', solutionByNameError);
          setLicenseTypes([]);
          return;
        }
        
        if (solutionByNameData?.id) {
          console.log('Found solution by name:', solutionByNameData);
          
          // Update product_id in form data
          setFormData(prev => ({ ...prev, product_id: solutionByNameData.id }));
          
          // Fetch license types with this ID
          await fetchLicenseTypesForId(solutionByNameData.id);
          return;
        }
        
        console.error('Solution not found by code or name');
        setLicenseTypes([]);
        return;
      }

      if (!solutionData?.id) {
        console.error('No solution found for code:', formData.product_category);
        setLicenseTypes([]);
        return;
      }

      console.log('Found solution ID for code:', solutionData.id);
      
      // Update product_id in form data
      setFormData(prev => ({ ...prev, product_id: solutionData.id }));
      
      // Fetch license types
      await fetchLicenseTypesForId(solutionData.id);
    } catch (err) {
      console.error('Error in fetchLicenseTypes:', err);
      setLicenseTypes([]);
    }
  };

  // Helper function to fetch license types by solution ID
  const fetchLicenseTypesForId = async (solutionId: string) => {
    try {
      console.log('Fetching license types for solution ID:', solutionId);
      const { data, error } = await supabase
        .from('license_types')
        .select('*')
        .eq('solution_id', solutionId)
        .order('name');

      if (error) {
        console.error('Error fetching license types:', error);
        setLicenseTypes([]);
        return;
      }

      console.log(`Fetched license types for solution ID ${solutionId}:`, data);
      setLicenseTypes(data || []);
    } catch (err) {
      console.error('Error in fetchLicenseTypesForId:', err);
      setLicenseTypes([]);
    }
  };

  useEffect(() => {
    // If a product category is selected on component mount, fetch its license types
    if (formData.product_category) {
      fetchLicenseTypes();
    }
  }, [formData.product_category]); // Add dependency on product_category

  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.id) {
        try {
          // First, try to get the user profile
          let { data, error } = await supabase
            .from('users')
            .select('first_name, last_name, email')
            .eq('id', user.id);

          // If no rows or error, try to create the user profile
          if (error || !data || data.length === 0) {
            console.log('User profile not found, creating one...');
            
            // Create the user profile
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                { 
                  id: user.id, 
                  email: user.email, 
                  first_name: '', 
                  last_name: '' 
                }
              ]);
              
            if (insertError) {
              console.error('Error creating user profile:', insertError);
              // Fall back to using email
              setFormData(prev => ({
                ...prev,
                sales_person: user.email || ''
              }));
              return;
            }
            
            // Try fetching again after creation
            const response = await supabase
              .from('users')
              .select('first_name, last_name, email')
              .eq('id', user.id);
              
            data = response.data;
            error = response.error;
          }

          if (error) {
            console.error('Error fetching user profile:', error);
            // Fallback to email if we can't get the profile
            setFormData(prev => ({
              ...prev,
              sales_person: user.email || ''
            }));
            return;
          }

          if (data && data.length > 0) {
            const userProfile = data[0];
            // If first_name and last_name are available and not empty, use them
            if (userProfile.first_name || userProfile.last_name) {
              const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
              setFormData(prev => ({
                ...prev,
                sales_person: fullName || user.email || ''
              }));
            } else {
              // Fallback to email if name is not set
              setFormData(prev => ({
                ...prev,
                sales_person: userProfile.email || user.email || ''
              }));
            }
          } else {
            // No data found even after creation attempt
            setFormData(prev => ({
              ...prev,
              sales_person: user.email || ''
            }));
          }
        } catch (err) {
          console.error('Error in fetchUserName:', err);
          // Fallback to email in case of any error
          setFormData(prev => ({
            ...prev,
            sales_person: user.email || ''
          }));
        }
      }
    };

    fetchUserName();
  }, [user]);

  // Update fetchCategories function name and logs
  const fetchSolutions = async () => {
    try {
      const { data, error } = await supabase
        .from('solutions')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching solutions:', error);
        return;
      }

      console.log('Fetched solutions:', data);
      setSolutions(data || []);
    } catch (err) {
      console.error('Error in fetchSolutions:', err);
    }
  };

  // Update useEffect to use new function name
  useEffect(() => {
    fetchSolutions();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      
      // If annual_commitment changed, recalculate the price
      if (name === 'annual_commitment' && selectedLicenseType) {
        calculatePrice(selectedLicenseType, formData.number_of_users || 0, checked);
      }
      return;
    }
    
    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
      
      // If discount_pct or margin_pct changed, recalculate the price
      if ((name === 'discount_pct' || name === 'margin_pct') && selectedLicenseType) {
        calculatePrice(
          selectedLicenseType, 
          formData.number_of_users || 0, 
          formData.annual_commitment,
          name === 'discount_pct' ? Number(value) : formData.discount_pct,
          name === 'margin_pct' ? Number(value) : formData.margin_pct
        );
      }
      return;
    }
    
    // Special handling for project_type
    if (name === 'project_type') {
      handleProjectTypeChange(e as React.ChangeEvent<HTMLSelectElement>);
      return;
    }
    
    // Handle other inputs
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const solutionCode = e.target.value;
    console.log('Selected solution code:', solutionCode);
    
    // First find the solution in our solutions list
    const selectedSol = solutionCode ? solutions.find(s => s.code === solutionCode) : null;
    console.log('Found solution object:', selectedSol);
    
    if (selectedSol) {
      // Update the selected solution state for use elsewhere
      setSelectedSolution(selectedSol);
      
      // Update form data with both the solution code and the solution ID
      setFormData(prev => ({ 
        ...prev, 
        product_category: solutionCode,  // Keep this field for backward compatibility
        product_id: selectedSol.id,
        project_type: null // Reset project type when solution changes
      }));
    } else {
      // Solution not found or none selected
      setSelectedSolution(null);
      setFormData(prev => ({ 
        ...prev, 
        product_category: solutionCode,
        product_id: null,
        project_type: null
      }));
    }
    
    // Reset licenses
    setLicenses([{ 
      id: 1, 
      type: '', 
      quantity: 1, 
      price: '',
      annualCommitment: false,
      monthlyPayment: false,
      discount: 0,
      totalValue: '',
      marginValue: ''
    }]);
    
    // Clear license types first
    setLicenseTypes([]);
    
    // If solution is selected, fetch license types
    if (solutionCode) {
      // Schedule fetch license types to run after state is updated
      setTimeout(() => fetchLicenseTypes(), 0);
    }
  };

  // Create a separate function for handling project type changes
  const handleProjectTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectTypeCode = e.target.value;
    console.log('Selected project type code from dropdown:', projectTypeCode);
    
    // First update the project_type code in form data right away
    setFormData(prev => ({ ...prev, project_type: projectTypeCode }));
    
    if (!projectTypeCode) {
      console.log('No project type selected, clearing project_type_id');
      setFormData(prev => ({ ...prev, project_type_id: null }));
      return;
    }
    
    // Convert from UI project type to database code
    const dbProjectTypeCode = projectTypeCode === 'PROJECT_IMPLEMENTATION' 
      ? 'IMPLEMENTATION' 
      : projectTypeCode === 'PROJECT_LOCALIZATION' 
        ? 'LOCALIZATION' 
        : projectTypeCode;
    
    console.log('Converted to database project type code:', dbProjectTypeCode);
    
    try {
      // Look up the project type ID
      console.log('Looking up project type ID for code:', dbProjectTypeCode);
      const { data: projectTypeData, error } = await supabase
        .from('project_types')
        .select('id, code, name')
        .eq('code', dbProjectTypeCode)
        .single();
      
      if (error) {
        console.error('Error getting project type ID:', error);
        return;
      }
      
      if (projectTypeData) {
        const projectTypeId = projectTypeData.id;
        console.log('Found project type ID:', projectTypeId, 'for code:', projectTypeData.code, 'name:', projectTypeData.name);
        
        // Important: Update the project_type_id in form data right away
        setFormData(prev => ({ ...prev, project_type_id: projectTypeId }));
      } else {
        console.error('No project type found for code:', dbProjectTypeCode);
      }
    } catch (err) {
      console.error('Error getting project type ID:', err);
    }
  };

  // Convert from database project type code to UI display code
  const convertDbCodeToUiCode = (dbCode: string | null): string | null => {
    if (!dbCode) return null;
    
    return dbCode === 'IMPLEMENTATION' 
      ? 'PROJECT_IMPLEMENTATION' 
      : dbCode === 'LOCALIZATION' 
        ? 'PROJECT_LOCALIZATION' 
        : dbCode;
  };

  const handleLicenseTypeChange = (licenseTypeId: string) => {
    const selectedType = licenseTypes.find(lt => lt.id === licenseTypeId);
    setSelectedLicenseType(selectedType || null);
    setFormData(prev => ({
      ...prev,
      license_type_id: licenseTypeId
    }));
  };

  const handleUsersChange = (value: string) => {
    const numUsers = parseInt(value);
    setFormData(prev => ({
      ...prev,
      number_of_users: isNaN(numUsers) ? null : numUsers
    }));
  };

  const calculatePrice = (
    licenseType: LicenseType, 
    users: number, 
    annualCommitment: boolean = false,
    discountPct: number = 0,
    marginPct: number = 30
  ) => {
    if (!licenseType || !users) {
      setFormData(prev => ({ ...prev, value: null }));
      return;
    }

    let basePrice: number;
    
    // Use yearly price if annual commitment is checked, otherwise use monthly price
    if (annualCommitment && licenseType.yearly_price) {
      basePrice = licenseType.yearly_price;
    } else if (licenseType.monthly_price) {
      basePrice = licenseType.monthly_price;
    } else {
      setFormData(prev => ({ ...prev, value: null }));
      return;
    }
    
    // Check if this is Enterprise tier with custom pricing
    const isEnterprise = licenseType.code.includes('ENT');
    if (isEnterprise && !licenseType.monthly_price && !licenseType.yearly_price) {
      // For Enterprise tier with no price, just use the users as placeholder
      setFormData(prev => ({ 
        ...prev, 
        value: null,
        number_of_users: users
      }));
      return;
    }

    // Calculate price based on number of users
    let totalPrice = basePrice * users;

    // Apply discount
    if (discountPct > 0) {
      totalPrice = totalPrice * (1 - (discountPct / 100));
    }
    
    // Multiply by 12 if annual commitment (for monthly prices)
    if (annualCommitment && !licenseType.yearly_price) {
      totalPrice = totalPrice * 12;
    }
    
    // Calculate margin (30% by default)
    const margin = totalPrice * (marginPct / 100);
    
    // Add margin to total price
    totalPrice += margin;
    
    // Round to 2 decimal places
    totalPrice = Math.round(totalPrice * 100) / 100;
    
    setFormData(prev => ({ 
      ...prev, 
      value: totalPrice,
      number_of_users: users,
      annual_commitment: annualCommitment,
      discount_pct: discountPct,
      margin_pct: marginPct
    }));
  };

  // Format data for submission (adjusted to ensure licenses are properly stored)
  const formatDataForSubmission = async (data: FormState, status: OfferStatus) => {
    if (!user?.id) {
      console.error('User ID is missing!');
      throw new Error('User ID is required');
    }

    const totals = calculateTotals();
    
    // Get product_id from the product_category if needed
    let product_id = data.product_id;
    if (data.product_category && !product_id) {
      try {
        console.log('Getting product_id from category:', data.product_category);
        const { data: categoryData, error } = await supabase
          .from('solutions')
          .select('id, name')
          .eq('name', data.product_category)
          .single();
          
        if (!error && categoryData) {
          product_id = categoryData.id;
          console.log('Found product_id:', product_id, 'for category:', categoryData.name);
        } else {
          console.error('Failed to get product_id for category:', data.product_category, 'Error:', error);
        }
      } catch (err) {
        console.error('Error getting product ID from category:', err);
      }
    }
    
    // Get project_type_id from the project_type if needed
    let project_type_id = data.project_type_id;
    console.log('Initial project_type_id from form data:', project_type_id);
    console.log('Project type code from form data:', data.project_type);
    
    if (data.project_type && !project_type_id) {
      try {
        // Convert from UI project type to database code
        const dbProjectTypeCode = data.project_type === 'PROJECT_IMPLEMENTATION'
          ? 'IMPLEMENTATION'
          : data.project_type === 'PROJECT_LOCALIZATION'
            ? 'LOCALIZATION'
            : data.project_type;
        
        console.log('Looking up project_type_id for code:', dbProjectTypeCode, '(converted from', data.project_type, ')');
        
        const { data: projectTypeData, error } = await supabase
          .from('project_types')
          .select('id, code, name')
          .eq('code', dbProjectTypeCode)
          .single();
          
        if (!error && projectTypeData) {
          project_type_id = projectTypeData.id;
          console.log('Found project_type_id:', project_type_id, 'for code:', projectTypeData.code, 'name:', projectTypeData.name);
        } else {
          console.error('Failed to get project_type_id for code:', dbProjectTypeCode, 'Error:', error);
        }
      } catch (err) {
        console.error('Error getting project type ID from code:', err);
      }
    }

    console.log('Final product_id that will be saved:', product_id);
    console.log('Final project_type_id that will be saved:', project_type_id);

    // Create the final data object to save
    const finalData = {
      customer_name: data.customer_name,
      cui: data.cui,
      order_date: data.order_date,
      sales_person: data.sales_person,
      project_description: data.project_description || null,
      go_live_date: data.go_live_date,
      approver: data.approver || null,
      approval_date: data.approval_date,
      status,
      value: parseFloat(totals.finalTotal) || 0,
      product_id, // Directly use the resolved product_id
      license_type_id: licenses[0]?.type || null,
      number_of_users: licenses[0]?.quantity || null,
      duration_months: licenses[0]?.monthlyPayment ? 12 : 1,
      project_type_id, // Directly use the resolved project_type_id
      annual_commitment: licenses.some(l => l.annualCommitment),
      margin_pct: data.margin_pct,
      discount_pct: data.discount_pct,
      created_by: user.id
    };

    console.log('Full data being saved to offers table:', finalData);
    return finalData;
  };

  const handleSaveDraft = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.customer_name || !formData.cui) {
        setError('Customer Name and CUI are required fields');
        return;
      }

      if (!user?.id) {
        setError('You must be logged in to save an offer');
        return;
      }

      // Validate licenses before saving
      const validLicenses = licenses.filter(license => 
        license.type && license.type.trim() !== ''
      );

      if (validLicenses.length === 0) {
        setError('At least one license with a valid license type is required');
        return;
      }

      // Get solution ID from the selected solution
      let solutionId = formData.product_id;
      if (!solutionId && formData.product_category) {
        console.log('Looking up solution ID for category:', formData.product_category);
        const { data: solutionData, error: solutionError } = await supabase
          .from('solutions')
          .select('id')
          .eq('code', formData.product_category)
          .single();

        if (solutionError) {
          console.error('Error fetching solution:', solutionError);
          setError('Failed to get solution information');
          return;
        }
        solutionId = solutionData?.id;
        console.log('Found solution ID:', solutionId);
      }

      if (!solutionId) {
        setError('Solution is required');
        return;
      }

      // Get project type ID from the selected project type
      let projectTypeId = formData.project_type_id;
      if (!projectTypeId && formData.project_type) {
        const dbProjectTypeCode = formData.project_type === 'PROJECT_IMPLEMENTATION'
          ? 'IMPLEMENTATION'
          : formData.project_type === 'PROJECT_LOCALIZATION'
            ? 'LOCALIZATION'
            : formData.project_type;

        const { data: projectTypeData, error: projectTypeError } = await supabase
          .from('project_types')
          .select('id')
          .eq('code', dbProjectTypeCode)
          .single();

        if (projectTypeError) {
          console.error('Error fetching project type:', projectTypeError);
          setError('Failed to get project type information');
          return;
        }
        projectTypeId = projectTypeData?.id;
      }

      // Format the data for submission
      const formattedData = {
        customer_name: formData.customer_name,
        cui: formData.cui,
        order_date: formData.order_date,
        sales_person: formData.sales_person,
        project_description: formData.project_description || null,
        go_live_date: formData.go_live_date,
        approver: formData.approver || null,
        approval_date: formData.approval_date,
        status: 'Draft',
        value: parseFloat(totals.finalTotal) || 0,
        solution_id: solutionId, // Changed from product_id to solution_id
        license_type_id: validLicenses[0].type,
        number_of_users: validLicenses[0].quantity || null,
        duration_months: validLicenses[0].monthlyPayment ? 12 : 1,
        project_type_id: projectTypeId,
        annual_commitment: validLicenses.some(l => l.annualCommitment),
        margin_pct: formData.margin_pct,
        discount_pct: formData.discount_pct,
        created_by: user.id
      };

      console.log('Saving offer data:', formattedData);
      
      let offerId: string;
      
      if (id) {
        // Update existing offer
        const { error: updateError } = await supabase
          .from('offers')
          .update(formattedData)
          .eq('id', id);

        if (updateError) {
          console.error('Error updating offer:', updateError);
          setError(updateError.message);
          return;
        }
        offerId = id;
      } else {
        // Create new offer
        const { data, error: insertError } = await supabase
          .from('offers')
          .insert([formattedData])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating offer:', insertError);
          setError(insertError.message);
          return;
        }
        offerId = data.id;
      }

      // Delete existing licenses if updating
      if (id) {
        const { error: deleteError } = await supabase
          .from('offer_licenses')
          .delete()
          .eq('offer_id', offerId);

        if (deleteError) {
          console.error('Error deleting existing licenses:', deleteError);
          setError('Failed to update licenses');
          return;
        }
      }

      // Prepare license data for insertion
      const licenseData = validLicenses.map(license => ({
        offer_id: offerId,
        license_type_id: license.type,
        quantity: license.quantity || 0,
        price: parseFloat(license.price) || 0,
        annual_commitment: license.annualCommitment,
        monthly_payment: license.monthlyPayment,
        discount: license.discount || 0,
        total_value: parseFloat(license.totalValue) || 0,
        margin_value: parseFloat(license.marginValue) || 0
      }));

      console.log('Saving license data:', licenseData);

      if (licenseData.length > 0) {
        const { error: licenseError } = await supabase
          .from('offer_licenses')
          .insert(licenseData);

        if (licenseError) {
          console.error('Error saving licenses:', licenseError);
          setError('Failed to save licenses: ' + licenseError.message);
          return;
        }
      }

      toast.success('Offer saved as draft');
      navigate('/offers');
    } catch (err) {
      console.error('Error saving offer:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.customer_name || !formData.cui) {
        setError('Customer Name and CUI are required fields');
        setLoading(false);
        return;
      }

      // Validate licenses before saving
      const validLicenses = licenses.filter(license => 
        license.type && license.type.trim() !== ''
      );

      if (validLicenses.length === 0) {
        setError('At least one license with a valid license type is required');
        setLoading(false);
        return;
      }

      // Get solution ID from the selected solution
      let solutionId = formData.product_id;
      if (!solutionId && formData.product_category) {
        console.log('Looking up solution ID for category:', formData.product_category);
        const { data: solutionData, error: solutionError } = await supabase
          .from('solutions')
          .select('id')
          .eq('code', formData.product_category)
          .single();

        if (solutionError) {
          console.error('Error fetching solution:', solutionError);
          setError('Failed to get solution information');
          return;
        }
        solutionId = solutionData?.id;
        console.log('Found solution ID:', solutionId);
      }

      if (!solutionId) {
        setError('Solution is required');
        return;
      }

      // Get project type ID from the selected project type
      let projectTypeId = formData.project_type_id;
      if (!projectTypeId && formData.project_type) {
        const dbProjectTypeCode = formData.project_type === 'PROJECT_IMPLEMENTATION'
          ? 'IMPLEMENTATION'
          : formData.project_type === 'PROJECT_LOCALIZATION'
            ? 'LOCALIZATION'
            : formData.project_type;

        const { data: projectTypeData, error: projectTypeError } = await supabase
          .from('project_types')
          .select('id')
          .eq('code', dbProjectTypeCode)
          .single();

        if (projectTypeError) {
          console.error('Error fetching project type:', projectTypeError);
          setError('Failed to get project type information');
          return;
        }
        projectTypeId = projectTypeData?.id;
      }

      // Format the data for submission
      const formattedData = {
        customer_name: formData.customer_name,
        cui: formData.cui,
        order_date: formData.order_date,
        sales_person: formData.sales_person,
        project_description: formData.project_description || null,
        go_live_date: formData.go_live_date,
        approver: formData.approver || null,
        approval_date: formData.approval_date,
        status: 'Pending',
        value: parseFloat(totals.finalTotal) || 0,
        solution_id: solutionId, // Changed from product_id to solution_id
        license_type_id: validLicenses[0].type,
        number_of_users: validLicenses[0].quantity || null,
        duration_months: validLicenses[0].monthlyPayment ? 12 : 1,
        project_type_id: projectTypeId,
        annual_commitment: validLicenses.some(l => l.annualCommitment),
        margin_pct: formData.margin_pct,
        discount_pct: formData.discount_pct,
        created_by: user?.id
      };

      console.log('Submitting offer data:', formattedData);
      
      let offerId: string;
      
      if (id) {
        const { error: updateError } = await supabase
          .from('offers')
          .update(formattedData)
          .eq('id', id);

        if (updateError) {
          console.error('Error updating offer:', updateError);
          throw updateError;
        }
        offerId = id;
      } else {
        const { data, error: insertError } = await supabase
          .from('offers')
          .insert([formattedData])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating offer:', insertError);
          throw insertError;
        }
        offerId = data.id;
      }

      // Delete existing licenses if updating
      if (id) {
        const { error: deleteError } = await supabase
          .from('offer_licenses')
          .delete()
          .eq('offer_id', offerId);

        if (deleteError) {
          console.error('Error deleting existing licenses:', deleteError);
          throw deleteError;
        }
      }

      // Prepare license data for insertion
      const licenseData = validLicenses.map(license => ({
        offer_id: offerId,
        license_type_id: license.type,
        quantity: license.quantity || 0,
        price: parseFloat(license.price) || 0,
        annual_commitment: license.annualCommitment,
        monthly_payment: license.monthlyPayment,
        discount: license.discount || 0,
        total_value: parseFloat(license.totalValue) || 0,
        margin_value: parseFloat(license.marginValue) || 0
      }));

      console.log('Saving license data:', licenseData);

      if (licenseData.length > 0) {
        const { error: licenseError } = await supabase
          .from('offer_licenses')
          .insert(licenseData);

        if (licenseError) {
          console.error('Error saving licenses:', licenseError);
          throw licenseError;
        }
      }

      toast.success('Offer submitted for approval');
      navigate('/offers');
    } catch (err) {
      console.error('Error saving offer:', err);
      setError('Failed to save offer: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories and other data on component mount
  useEffect(() => {
    fetchSolutions();
    fetchProducts();
  }, []);

  // Add additional effect to fetch license types when product category changes
  useEffect(() => {
    if (formData.product_category) {
      console.log('Product category changed, fetching license types...');
      fetchLicenseTypes();
    }
  }, [formData.product_category]);

  // Update useEffect to also make sure the project type gets resolved when the form data is updated
  useEffect(() => {
    if (formData.project_type) {
      console.log('Project type in form data changed to:', formData.project_type);
      
      // Only resolve the ID if it's not already set
      if (!formData.project_type_id) {
        console.log('Project type ID not set, looking it up...');
        (async () => {
          try {
            // Convert from UI project type to database code
            const dbProjectTypeCode = formData.project_type === 'PROJECT_IMPLEMENTATION'
              ? 'IMPLEMENTATION'
              : formData.project_type === 'PROJECT_LOCALIZATION'
                ? 'LOCALIZATION'
                : formData.project_type;
            
            console.log('Looking up project_type_id for code:', dbProjectTypeCode, '(converted from', formData.project_type, ')');
            
            const { data: projectTypeData, error } = await supabase
              .from('project_types')
              .select('id, code, name')
              .eq('code', dbProjectTypeCode)
              .single();
            
            if (!error && projectTypeData) {
              const projectTypeId = projectTypeData.id;
              console.log('Found project_type_id:', projectTypeId, 'for code:', projectTypeData.code, 'name:', projectTypeData.name);
              setFormData(prev => ({ ...prev, project_type_id: projectTypeId }));
            } else {
              console.error('Error looking up project type ID:', error);
            }
          } catch (err) {
            console.error('Error looking up project type ID:', err);
          }
        })();
      }
    }
  }, [formData.project_type]);

  // Debugging effect to log changes in project_type_id
  useEffect(() => {
    console.log('Current project_type_id in form state:', formData.project_type_id);
  }, [formData.project_type_id]);

  // Fetch license types for a specific category
  const fetchLicenseTypesForCategory = async (categoryCode: string) => {
    try {
      console.log('Starting fetchLicenseTypesForCategory with code:', categoryCode);
      if (!categoryCode) {
        console.error('No solution code provided');
        setLicenseTypes([]);
        return;
      }

      console.log('Fetching license types for solution:', categoryCode);
      
      // Get the solution ID
      console.log('Getting solution ID for code:', categoryCode);
      const { data: solutionData, error: solutionError } = await supabase
        .from('solutions')
        .select('id, name')
        .eq('code', categoryCode)
        .single();

      if (solutionError) {
        console.error('Error fetching solution:', solutionError);
        console.error('Error details:', JSON.stringify(solutionError));
        setLicenseTypes([]);
        return;
      }

      if (!solutionData?.id) {
        console.error('No solution found for code:', categoryCode);
        console.log('Trying to look up solution by name instead of code');
        
        // Try to fetch by name as a fallback
        const { data: solutionByNameData, error: solutionByNameError } = await supabase
          .from('solutions')
          .select('id, name, code')
          .eq('name', categoryCode)
          .single();
          
        if (solutionByNameError) {
          console.error('Also failed to find solution by name:', solutionByNameError);
          setLicenseTypes([]);
          return;
        }
        
        if (!solutionByNameData?.id) {
          console.error('Could not find solution by code or name:', categoryCode);
          setLicenseTypes([]);
          return;
        }
        
        console.log('Found solution by name!', solutionByNameData);
        
        // Use this solution ID instead
        const solutionId = solutionByNameData.id;
        console.log('Using solution ID found by name:', solutionId);
        
        // Then fetch license types using the solution ID
        console.log('Fetching license types for solution ID:', solutionId);
        const { data, error } = await supabase
          .from('license_types')
          .select('*')
          .eq('solution_id', solutionId)
          .order('name');

        if (error) {
          console.error('Error fetching license types:', error);
          console.error('Error details:', JSON.stringify(error));
          setLicenseTypes([]);
          return;
        }

        console.log(`Fetched license types for solution (found by name):`, data);
        setLicenseTypes(data || []);
        return;
      }

      console.log('Found solution ID:', solutionData.id, 'for code:', categoryCode);

      // Then fetch license types using the solution ID
      console.log('Fetching license types for solution ID:', solutionData.id);
      const { data, error } = await supabase
        .from('license_types')
        .select('*')
        .eq('solution_id', solutionData.id)
        .order('name');

      if (error) {
        console.error('Error fetching license types:', error);
        console.error('Error details:', JSON.stringify(error));
        setLicenseTypes([]);
        return;
      }

      console.log(`Fetched license types for ${categoryCode}:`, data);
      setLicenseTypes(data || []);
    } catch (err) {
      console.error('Caught exception in fetchLicenseTypesForCategory:', err);
      setLicenseTypes([]);
    }
  };

  // Update useEffect to fix license type fetching when solution changes
  useEffect(() => {
    if (formData.product_category) {
      console.log('Solution changed to:', formData.product_category);
      
      // Find if there's a matching solution in our solutions list
      const matchingSolution = solutions.find(s => s.code === formData.product_category);
      if (matchingSolution) {
        console.log('Found matching solution in list:', matchingSolution);
        setSelectedSolution(matchingSolution);
        
        // Update product_id if not already set
        if (!formData.product_id && matchingSolution.id) {
          console.log('Setting product_id from matching solution:', matchingSolution.id);
          setFormData(prev => ({ ...prev, product_id: matchingSolution.id }));
        }
      } else {
        console.log('No matching solution found in current list for code:', formData.product_category);
      }
      
      // Fetch license types for this solution
      fetchLicenseTypes();
    } else {
      console.log('Solution cleared');
      setLicenseTypes([]);
    }
  }, [formData.product_category, solutions]); // Add solutions as dependency

  // Fetch license types for a specific solution
  const fetchLicenseTypesForSolution = async (solutionCode: string) => {
    try {
      console.log('Starting fetchLicenseTypesForSolution with code:', solutionCode);
      if (!solutionCode) {
        console.error('No solution code provided');
        setLicenseTypes([]);
        return;
      }

      console.log('Fetching license types for solution:', solutionCode);
      
      // Get the solution ID
      console.log('Getting solution ID for code:', solutionCode);
      const { data: solutionData, error: solutionError } = await supabase
        .from('solutions')
        .select('id, name')
        .eq('code', solutionCode)
        .single();

      if (solutionError) {
        console.error('Error fetching solution:', solutionError);
        console.error('Error details:', JSON.stringify(solutionError));
        setLicenseTypes([]);
        return;
      }

      if (!solutionData?.id) {
        console.error('No solution found for code:', solutionCode);
        console.log('Trying to look up solution by name instead of code');
        
        // Try to fetch by name as a fallback
        const { data: solutionByNameData, error: solutionByNameError } = await supabase
          .from('solutions')
          .select('id, name, code')
          .eq('name', solutionCode)
          .single();
        
        if (solutionByNameError) {
          console.error('Also failed to find solution by name:', solutionByNameError);
          setLicenseTypes([]);
          return;
        }
        
        if (!solutionByNameData?.id) {
          console.error('Could not find solution by code or name:', solutionCode);
          setLicenseTypes([]);
          return;
        }
        
        console.log('Found solution by name!', solutionByNameData);
        
        // Use this solution ID instead
        const solutionId = solutionByNameData.id;
        console.log('Using solution ID found by name:', solutionId);
        
        // Then fetch license types using the solution ID
        console.log('Fetching license types for solution ID:', solutionId);
        const { data, error } = await supabase
          .from('license_types')
          .select('*')
          .eq('solution_id', solutionId)
          .order('name');

        if (error) {
          console.error('Error fetching license types:', error);
          console.error('Error details:', JSON.stringify(error));
          setLicenseTypes([]);
          return;
        }

        console.log(`Fetched license types for solution (found by name):`, data);
        setLicenseTypes(data || []);
        return;
      }

      console.log('Found solution ID:', solutionData.id, 'for code:', solutionCode);

      // Then fetch license types using the solution ID
      console.log('Fetching license types for solution ID:', solutionData.id);
      const { data, error } = await supabase
        .from('license_types')
        .select('*')
        .eq('solution_id', solutionData.id)
        .order('name');

      if (error) {
        console.error('Error fetching license types:', error);
        console.error('Error details:', JSON.stringify(error));
        setLicenseTypes([]);
        return;
      }

      console.log(`Fetched license types for ${solutionCode}:`, data);
      setLicenseTypes(data || []);
    } catch (err) {
      console.error('Caught exception in fetchLicenseTypesForSolution:', err);
      setLicenseTypes([]);
    }
  };

  const downloadOfferAsExcel = (): void => {
    // Prepare the offer data
    const offerData: OfferExcelData = {
      'Client Information': {
        'Customer Name': formData.customer_name,
        'CUI': formData.cui,
        'Order Date': formData.order_date,
        'Sales Person': formData.sales_person,
        'Go Live Date': formData.go_live_date,
      },
      'Project Details': {
        'Solution': solutions.find(s => s.code === formData.product_category)?.name || '',
        'Project Type': formData.project_type_id 
          ? (projectTypes.find(pt => pt.id === formData.project_type_id)?.name || '')
          : '',
        'Project Description': formData.project_description,
      },
      'Licenses': licenses.map(license => ({
        'License Type': licenseTypes.find(lt => lt.id === license.type)?.name || '',
        'Quantity': license.quantity,
        'Price': `€${license.price || '0'}`,
        'Annual Commitment': license.annualCommitment ? 'Yes' : 'No',
        'Monthly Payment': license.monthlyPayment ? 'Yes' : 'No',
        'Discount (%)': license.discount,
        'Total Value': `€${license.totalValue || '0'}`,
        'Margin Value': `€${license.marginValue || '0'}`
      })),
      'Summary': {
        'Total Value': `€${totals.totalValue}`,
        'Total Discount': `€${totals.totalDiscount}`,
        'Final Total': `€${totals.finalTotal}`,
        'Total Margin': `€${totals.totalMargin}`
      }
    };

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create main sheet with client info and project details
    const mainSheetData = [{
      ...(offerData['Client Information' as keyof OfferExcelData]),
      ...(offerData['Project Details' as keyof OfferExcelData])
    }];
    const mainWs = XLSX.utils.json_to_sheet(mainSheetData);
    XLSX.utils.book_append_sheet(wb, mainWs, 'Offer Details');

    // Create licenses sheet
    const licensesWs = XLSX.utils.json_to_sheet(offerData.Licenses);
    XLSX.utils.book_append_sheet(wb, licensesWs, 'Licenses');

    // Create summary sheet
    const summaryWs = XLSX.utils.json_to_sheet([offerData.Summary]);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Generate Excel file and trigger download
    const fileName = `Offer-${formData.customer_name}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="ml-2 text-gray-600">Loading offer...</p>
        </div>
      </Layout>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-40 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center space-x-2 text-blue-600 font-semibold mb-6">
          <FileText size={20} />
          <span>Contractify</span>
        </div>
        <div className="space-y-1">
          <div className="text-gray-500 text-sm font-medium px-2 py-1">Offers</div>
          <div className="text-blue-600 bg-blue-50 rounded px-2 py-1 flex items-center space-x-2 text-sm font-medium">
            <Plus size={16} />
            <span>New Offer</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-blue-600" />
            <h1 className="text-lg font-medium">{id ? 'Edit Offer' : 'New Offer'}</h1>
          </div>
          <div className="text-sm px-3 py-1 bg-gray-100 rounded text-gray-500">
            {formData.status}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-400">
            {error}
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* General Information - Two Columns */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="font-medium">General</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <input 
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Client name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CUI (VAT)</label>
                    <input 
                      type="text"
                      name="cui"
                      value={formData.cui}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Client identifier"
                    />
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="order_date" className="block text-sm font-medium text-gray-700">
                      Order Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <DatePicker
                        selected={formData.order_date ? new Date(formData.order_date) : null}
                        onChange={(date: Date | null) => {
                          setFormData({ 
                            ...formData, 
                            order_date: date ? date.toISOString().split('T')[0] : null 
                          });
                        }}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select date"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Person</label>
                    <input 
                      type="text"
                      name="sales_person"
                      value={formData.sales_person}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div 
              className="border-b border-gray-200 px-4 py-3 flex justify-between items-center cursor-pointer"
              onClick={() => setProductInfoOpen(!productInfoOpen)}
            >
              <div className="flex items-center space-x-2">
                <h2 className="font-medium">Product Information</h2>
              </div>
              {productInfoOpen ? (
                <ChevronUp size={18} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </div>
            
            {productInfoOpen && (
              <div className="p-4 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Solution Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Solution</label>
                    <select
                      name="product_category"
                      value={formData.product_category || ''}
                      onChange={handleSolutionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a solution</option>
                      {solutions && solutions.map((solution) => (
                        <option key={solution.id} value={solution.code}>
                          {solution.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Project Type Selection - Always visible */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <select
                      name="project_type"
                      value={formData.project_type || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a project type</option>
                      {/* Show Implementation for all solutions */}
                      <option value="PROJECT_IMPLEMENTATION">Project Implementation</option>
                      
                      {/* Show Localization only for BC and F&O solutions */}
                      {formData.product_category && ['BUSINESS_CENTRAL', 'FINANCE_AND_OPERATIONS'].includes(formData.product_category) && (
                        <option value="PROJECT_LOCALIZATION">Project Localization</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Go-Live Date */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Go-Live Estimated Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <DatePicker
                      selected={formData.go_live_date ? new Date(formData.go_live_date) : null}
                      onChange={(date: Date | null) => {
                        setFormData({
                          ...formData,
                          go_live_date: date ? date.toISOString().split('T')[0] : null
                        });
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select date"
                    />
                  </div>
                </div>

                {/* License Table */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Licenses</label>
                    <button 
                      type="button"
                      onClick={addLicense}
                      className="inline-flex items-center justify-center px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-medium"
                    >
                      <Plus size={14} className="mr-1" />
                      Add License
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                      <div className="col-span-3">License Type</div>
                      <div className="col-span-1">Quantity</div>
                      <div className="col-span-1">Price</div>
                      <div className="col-span-1 text-center">Annual Commitment</div>
                      <div className="col-span-1 text-center">Monthly Payment</div>
                      <div className="col-span-1">Discount</div>
                      <div className="col-span-1">Total Value</div>
                      <div className="col-span-2">Margin Value</div>
                      <div className="col-span-1"></div>
                    </div>
                    
                    {/* License Table Body */}
                    {licenses.map((license) => {
                      return (
                        <div key={license.id} className="px-4 py-3 grid grid-cols-12 gap-4 border-t border-gray-200">
                          <div className="col-span-3">
                            <div className="relative">
                              <select 
                                className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={license.type}
                                onChange={(e) => {
                                  const licenseTypeId = e.target.value;
                                  console.log('Selected license type ID:', licenseTypeId);
                                  const selectedType = licenseTypes.find(lt => lt.id === licenseTypeId);
                                  console.log('Found license type:', selectedType);
                                  
                                  if (selectedType) {
                                    const updatedLicenses = licenses.map(l => {
                                      if (l.id === license.id) {
                                        const basePrice = selectedType.monthly_price || 0;
                                        const quantity = l.quantity || 1;
                                        const multiplier = l.annualCommitment ? 12 : 1;
                                        const subtotal = basePrice * quantity * multiplier;
                                        const discountValue = subtotal * (l.discount / 100);
                                        const total = (subtotal - discountValue).toFixed(2);
                                        const margin = (Number(total) * 0.3).toFixed(2);
                                        
                                        return {
                                          ...l,
                                          type: licenseTypeId,
                                          price: basePrice.toString(),
                                          totalValue: total,
                                          marginValue: margin
                                        };
                                      }
                                      return l;
                                    });
                                    setLicenses(updatedLicenses);
                                  } else {
                                    // Handle case where no license type is selected (empty selection)
                                    const updatedLicenses = licenses.map(l => {
                                      if (l.id === license.id) {
                                        return {
                                          ...l,
                                          type: '',
                                          price: '',
                                          totalValue: '',
                                          marginValue: ''
                                        };
                                      }
                                      return l;
                                    });
                                    setLicenses(updatedLicenses);
                                  }
                                }}
                              >
                                <option value="">Select a license type</option>
                                {licenseTypes.map((lt) => (
                                  <option key={lt.id} value={lt.id}>
                                    {lt.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          
                          <div className="col-span-1">
                            <input 
                              type="number" 
                              min="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              value={license.quantity}
                              onChange={(e) => {
                                const quantity = parseInt(e.target.value) || 1;
                                const updatedLicenses = licenses.map(l => {
                                  if (l.id === license.id) {
                                    const price = parseFloat(l.price) || 0;
                                    const discount = l.discount || 0;
                                    const multiplier = l.annualCommitment ? 12 : 1;
                                    const subtotal = Number(price) * Number(quantity) * Number(multiplier);
                                    const discountValue = Number(subtotal) * (Number(discount)/100);
                                    const calculatedTotal = (subtotal - discountValue).toFixed(2);
                                    const calculatedMargin = (Number(calculatedTotal) * 0.3).toFixed(2);
                                    return {
                                      ...l, 
                                      quantity, 
                                      totalValue: calculatedTotal,
                                      marginValue: calculatedMargin
                                    };
                                  }
                                  return l;
                                });
                                setLicenses(updatedLicenses);
                              }}
                            />
                          </div>
                          
                          <div className="col-span-1">
                            <input 
                              type="text" 
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="€ 0.00"
                              value={license.price}
                              onChange={(e) => {
                                const price = e.target.value;
                                const updatedLicenses = licenses.map(l => {
                                  if (l.id === license.id) {
                                    const numPrice = parseFloat(price) || 0;
                                    const quantity = l.quantity || 0;
                                    const discount = l.discount || 0;
                                    const multiplier = l.annualCommitment ? 12 : 1;
                                    const subtotal = Number(numPrice) * Number(quantity) * Number(multiplier);
                                    const discountValue = Number(subtotal) * (Number(discount)/100);
                                    const calculatedTotal = (subtotal - discountValue).toFixed(2);
                                    const calculatedMargin = (Number(calculatedTotal) * 0.3).toFixed(2);
                                    return {
                                      ...l, 
                                      price, 
                                      totalValue: calculatedTotal,
                                      marginValue: calculatedMargin
                                    };
                                  }
                                  return l;
                                });
                                setLicenses(updatedLicenses);
                              }}
                            />
                          </div>
                          
                          <div className="col-span-1 flex justify-center items-center">
                            <input 
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={license.annualCommitment}
                              onChange={(e) => {
                                const annualCommitment = e.target.checked;
                                const updatedLicenses = licenses.map(l => {
                                  if (l.id === license.id) {
                                    const price = parseFloat(l.price) || 0;
                                    const quantity = l.quantity || 0;
                                    const discount = l.discount || 0;
                                    const multiplier = annualCommitment ? 12 : 1;
                                    const subtotal = Number(price) * Number(quantity) * Number(multiplier);
                                    const discountValue = Number(subtotal) * (Number(discount)/100);
                                    const calculatedTotal = (subtotal - discountValue).toFixed(2);
                                    const calculatedMargin = (Number(calculatedTotal) * 0.3).toFixed(2);
                                    return {
                                      ...l, 
                                      annualCommitment,
                                      totalValue: calculatedTotal,
                                      marginValue: calculatedMargin
                                    };
                                  }
                                  return l;
                                });
                                setLicenses(updatedLicenses);
                              }}
                            />
                          </div>
                          
                          <div className="col-span-1 flex justify-center items-center">
                            <input 
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={license.monthlyPayment}
                              onChange={(e) => {
                                const updatedLicenses = licenses.map(l => 
                                  l.id === license.id ? {...l, monthlyPayment: e.target.checked} : l
                                );
                                setLicenses(updatedLicenses);
                              }}
                            />
                          </div>
                          
                          <div className="col-span-1">
                            <div className="flex items-center">
                              <input 
                                type="number"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0"
                                value={license.discount}
                                onChange={(e) => {
                                  const discount = parseInt(e.target.value) || 0;
                                  const updatedLicenses = licenses.map(l => {
                                    if (l.id === license.id) {
                                      const price = parseFloat(l.price) || 0;
                                      const quantity = l.quantity || 0;
                                      const multiplier = l.annualCommitment ? 12 : 1;
                                      const subtotal = Number(price) * Number(quantity) * Number(multiplier);
                                      const discountValue = Number(subtotal) * (Number(discount)/100);
                                      const calculatedTotal = (subtotal - discountValue).toFixed(2);
                                      const calculatedMargin = (Number(calculatedTotal) * 0.3).toFixed(2);
                                      return {
                                        ...l, 
                                        discount, 
                                        totalValue: calculatedTotal,
                                        marginValue: calculatedMargin
                                      };
                                    }
                                    return l;
                                  });
                                  setLicenses(updatedLicenses);
                                }}
                              />
                              <span className="ml-1">%</span>
                            </div>
                          </div>
                          
                          <div className="col-span-1">
                            <input 
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="€ 0.00"
                              value={license.totalValue ? `€${license.totalValue}` : "€ 0.00"}
                              readOnly
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <input 
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                              placeholder="€ 0.00"
                              value={license.marginValue ? `€${license.marginValue}` : "€ 0.00"}
                              readOnly
                            />
                          </div>
                          
                          <div className="col-span-1">
                            <div className="flex items-center justify-center">
                              {licenses.length > 1 && (
                                <button 
                                  type="button"
                                  onClick={() => removeLicense(license.id)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* License Summary - Moved inside the license table */}
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center">
                      <span className="font-medium text-sm mr-8">License Summary</span>
                      <div className="flex-grow"></div>
                      <div className="flex items-center space-x-5 mr-16">
                        <div>
                          <span className="text-xs text-gray-500 mr-1">Total:</span>
                          <span className="text-sm font-medium">€{totals.totalValue}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 mr-1">Discount:</span>
                          <span className="text-sm font-medium text-red-500">-€{totals.totalDiscount}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 mr-1">Final:</span>
                          <span className="text-sm font-bold">€{totals.finalTotal}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 mr-1">Margin:</span>
                          <span className="text-sm font-medium text-green-600">€{totals.totalMargin}</span>
                        </div>
                        <div className="bg-blue-50 rounded px-2 py-1">
                          <span className="text-sm font-medium text-blue-600">
                            {licenses.length > 0 && parseFloat(totals.totalValue) > 0
                              ? (parseFloat(totals.totalDiscount) / parseFloat(totals.totalValue) * 100).toFixed(1) 
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Description */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div 
              className="px-4 py-3 flex justify-between items-center cursor-pointer"
              onClick={() => setProjectDescOpen(!projectDescOpen)}
            >
              <div className="flex items-center space-x-2">
                <h2 className="font-medium">Project Description</h2>
              </div>
              {projectDescOpen ? (
                <ChevronUp size={18} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </div>
            
            {projectDescOpen && (
              <div className="p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                  <textarea 
                    name="project_description"
                    value={formData.project_description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Describe the project scope, objectives, and requirements..."
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* Approval Information */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div 
              className="px-4 py-3 flex justify-between items-center cursor-pointer"
              onClick={() => setApprovalInfoOpen(!approvalInfoOpen)}
            >
              <div className="flex items-center space-x-2">
                <h2 className="font-medium">Approval Information</h2>
              </div>
              {approvalInfoOpen ? (
                <ChevronUp size={18} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </div>
            
            {approvalInfoOpen && (
              <div className="p-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approver</label>
                    <input 
                      type="text"
                      name="approver"
                      value={formData.approver || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Approver name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required by</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <DatePicker
                        selected={formData.approval_date ? new Date(formData.approval_date) : null}
                        onChange={(date: Date | null) => {
                          setFormData({ 
                            ...formData, 
                            approval_date: date ? date.toISOString().split('T')[0] : null 
                          });
                        }}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select date"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="fixed bottom-0 left-40 right-0 bg-white border-t border-gray-200 p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              {/* Left side - Cancel button */}
              <div>
                <button 
                  type="button"
                  onClick={() => navigate('/offers')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Offers
                </button>
              </div>

              {/* Right side - Action buttons */}
              <div className="flex items-center space-x-4">
                {/* Download Excel */}
                <button
                  type="button"
                  onClick={downloadOfferAsExcel}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Excel
                </button>

                {/* Save as Draft */}
                <button 
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </button>

                {/* Request Project Plan */}
                <RequestProjectPlanButton
                  offerId={id || ''}
                  className="px-4 py-2 border border-yellow-300 rounded-md text-yellow-700 font-medium hover:bg-yellow-50 bg-white"
                  buttonText={
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Request Project Plan
                    </>
                  }
                />

                {/* Submit for Approval */}
                <button 
                  type="submit"
                  className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Submit for Approval
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Add padding at the bottom to prevent content from being hidden behind fixed buttons */}
          <div className="h-20"></div>
        </form>
      </div>
    </div>
  );
}