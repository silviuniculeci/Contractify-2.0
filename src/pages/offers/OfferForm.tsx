import { useState, useEffect } from 'react';
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
import { Loader2, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Offer, License, Product, ProjectType } from '../../types/offer';
import { formatCurrency } from '../../lib/utils';
import Layout from '../../components/Layout';
import { Plus as LucidePlus, ChevronDown, ChevronUp, Calendar, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Form state interface matching database schema
interface FormState extends Omit<Offer, 'id' | 'created_by' | 'created_at' | 'updated_at'> {
  customer_name: string;
  cui: string;
  order_date: string | null;
  sales_person: string;
  contract_type: ContractType;
  project_description: string;
  go_live_date: string | null;
  approver: string;
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
}

interface License {
  id: number;
  type: string;
  quantity: number;
  price: string;
  annualCommitment: boolean;
  monthlyPayment: boolean;
  discount: number;
  totalValue: string;
  marginValue: string;
}

// Add product category type
interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description: string;
}

const initialFormData: FormState = {
  customer_name: '',
  cui: '',
  order_date: null,
  sales_person: '',
  contract_type: 'Implementation',
  project_description: '',
  go_live_date: null,
  approver: '',
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
  project_type: null
};

export default function OfferForm(): ReactElement {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState<Offer>({
    ...initialFormData,
    contract_type: 'Implementation',
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
    project_type: null
  });
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

  // Add product category type
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

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
          // First fetch categories to have them available
          await fetchCategories();
          
          console.log('Fetching offer with ID:', id);
          const { data, error: fetchError } = await supabase
            .from('offers')
            .select('*')
            .eq('id', id)
            .single();

          if (fetchError) {
            console.error('Error fetching offer:', fetchError);
            setError('Failed to load offer');
            return;
          }

          if (data) {
            console.log('Loaded offer data:', data);
            
            // Get product category from product id if available
            let productCategory = null;
            
            // Extract project type code if available
            let projectType = null;
            
            // If there's a product ID, get its category
            if (data.product_id) {
              try {
                console.log('Looking up product category for product ID:', data.product_id);
                const { data: productData, error: productError } = await supabase
                  .from('product_categories')
                  .select('code, name')
                  .eq('id', data.product_id)
                  .single();
                
                if (!productError && productData?.code) {
                  productCategory = productData.code;
                  console.log('Found product category:', productCategory, 'name:', productData.name);
                } else {
                  console.error('Error or no data when getting product category:', productError);
                }
              } catch (err) {
                console.error('Error fetching product category:', err);
              }
            } else {
              console.log('No product_id in the offer data');
            }
            
            // If there's a project type ID, get its code
            if (data.project_type_id) {
              try {
                console.log('Looking up project type code for ID:', data.project_type_id);
                const { data: projectTypeData, error: projectTypeError } = await supabase
                  .from('project_types')
                  .select('code, name')
                  .eq('id', data.project_type_id)
                  .single();
                
                if (!projectTypeError && projectTypeData?.code) {
                  // Convert database code to UI code
                  projectType = convertDbCodeToUiCode(projectTypeData.code);
                  console.log('Found project type db code:', projectTypeData.code, 
                              'converted to UI code:', projectType, 
                              'name:', projectTypeData.name);
                } else {
                  console.error('Error getting project type or no data:', projectTypeError);
                }
              } catch (err) {
                console.error('Error fetching project type:', err);
              }
            } else {
              console.log('No project_type_id found in offer data');
            }

            // Update form data with all fields, including product category and project type
            setFormData({
              customer_name: data.customer_name,
              cui: data.cui,
              order_date: data.order_date || null,
              sales_person: data.sales_person,
              contract_type: 'Default', // Use a default value to avoid enum errors
              project_description: data.project_description || '',
              go_live_date: data.go_live_date || null,
              approver: data.approver || '',
              approval_date: data.approval_date || null,
              status: data.status,
              value: data.value || null,
              product_id: data.product_id || null,
              license_type_id: data.license_type_id || null,
              number_of_users: data.number_of_users || null,
              duration_months: data.duration_months || null,
              project_type_id: data.project_type_id || null,
              annual_commitment: data.annual_commitment || false,
              margin_pct: data.margin_pct || 30,
              discount_pct: data.discount_pct || 0,
              product_category: productCategory,
              project_type: projectType
            });

            console.log('Form data set with project_type:', projectType, 'and project_type_id:', data.project_type_id);

            // Fetch associated licenses
            const { data: licenseData, error: licenseError } = await supabase
              .from('offer_licenses')
              .select('*')
              .eq('offer_id', id);

            if (licenseError) {
              console.error('Error fetching licenses:', licenseError);
              setError('Failed to load licenses');
              return;
            }

            if (licenseData && licenseData.length > 0) {
              // Convert license data to the format expected by the form
              const formattedLicenses = licenseData.map((license, index) => ({
                id: index + 1,
                type: license.license_type_id,
                quantity: license.quantity,
                price: license.price.toString(),
                annualCommitment: license.annual_commitment,
                monthlyPayment: license.monthly_payment,
                discount: license.discount,
                totalValue: license.total_value.toString(),
                marginValue: license.margin_value.toString()
              }));
              setLicenses(formattedLicenses);
            }

            // If product category is set, fetch license types
            if (productCategory) {
              console.log('Fetching license types for saved product category:', productCategory);
              await fetchLicenseTypesForCategory(productCategory);
            }

            // Expand approval section if approver or date is set
            if (data.approver || data.approval_date) {
              setApprovalInfoOpen(true);
            }
          }
        } catch (err) {
          console.error('Error in fetchOffer:', err);
          setError('An unexpected error occurred while loading the offer');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOffer();
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

  // Fetch license types when product is selected
  const fetchLicenseTypes = async () => {
    try {
      if (!formData.product_category) {
        console.error('No product category selected');
        setLicenseTypes([]);
        return;
      }

      console.log('Fetching license types for category:', formData.product_category);
      
      // Get the product category ID
      const { data: categoryData, error: categoryError } = await supabase
        .from('product_categories')
        .select('id')
        .eq('code', formData.product_category)
        .single();

      if (categoryError) {
        console.error('Error fetching category:', categoryError);
        setLicenseTypes([]);
        return;
      }

      if (!categoryData?.id) {
        console.error('No category found for code:', formData.product_category);
        setLicenseTypes([]);
        return;
      }

      console.log('Found category ID:', categoryData.id);

      // Then fetch license types using the category ID (product_id in license_types is actually the category ID)
      const { data, error } = await supabase
        .from('license_types')
        .select('*')
        .eq('product_id', categoryData.id)
        .order('name');

      if (error) {
        console.error('Error fetching license types:', error);
        setLicenseTypes([]);
        return;
      }

      console.log(`Fetched ${formData.product_category} license types:`, data);
      setLicenseTypes(data || []);

      // Reset the license type selection in all licenses
      setLicenses(licenses.map(license => ({
        ...license,
        type: '',
        price: '',
        totalValue: '',
        marginValue: ''
      })));
    } catch (err) {
      console.error('Error in fetchLicenseTypes:', err);
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

  // Add fetchCategories function
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      console.log('Fetched categories:', data);
      setCategories(data || []);
    } catch (err) {
      console.error('Error in fetchCategories:', err);
    }
  };

  // Update useEffect to fetch categories
  useEffect(() => {
    fetchCategories();
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

  const handleProductCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    console.log('Selected category:', category);
    
    setFormData(prev => ({ 
      ...prev, 
      product_category: category,
      project_type: null // Reset project type when category changes
    }));
    
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
    
    // If category is selected, try to get the product ID right away
    if (category) {
      // Get the product category ID
      (async () => {
        try {
          console.log('Looking up product ID for category:', category);
          const { data: categoryData, error } = await supabase
            .from('product_categories')
            .select('id')
            .eq('code', category)
            .single();
          
          if (!error && categoryData) {
            const product_id = categoryData.id;
            console.log('Found product ID:', product_id);
            // Update the product_id in the form
            setFormData(prev => ({ ...prev, product_id: product_id }));
          }
        } catch (err) {
          console.error('Error getting product ID from category:', err);
        }
      })();
      
      // Then fetch new license types
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

  const handleLicenseTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const licenseTypeId = e.target.value;
    
    // Update form data
    setFormData(prev => ({ 
      ...prev, 
      license_type_id: licenseTypeId || null,
      value: null
    }));
    
    if (!licenseTypeId) {
      setSelectedLicenseType(null);
      return;
    }
    
    // Get the selected license type
    const licenseType = licenseTypes.find(lt => lt.id === licenseTypeId);
    setSelectedLicenseType(licenseType || null);
    
    // Calculate price if license type and users are set
    if (licenseType && formData.number_of_users) {
      calculatePrice(
        licenseType, 
        formData.number_of_users, 
        formData.annual_commitment,
        formData.discount_pct,
        formData.margin_pct
      );
    }
  };

  const handleUsersChange = (e: ChangeEvent<HTMLInputElement>) => {
    const users = e.target.value === '' ? null : Number(e.target.value);
    
    setFormData(prev => ({ 
      ...prev, 
      number_of_users: users
    }));
    
    // Calculate price if license type and users are set
    if (selectedLicenseType && users) {
      calculatePrice(
        selectedLicenseType, 
        users, 
        formData.annual_commitment,
        formData.discount_pct,
        formData.margin_pct
      );
    } else {
      setFormData(prev => ({ ...prev, value: null }));
    }
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
          .from('product_categories')
          .select('id, code, name')
          .eq('code', data.product_category)
          .single();
          
        if (!error && categoryData) {
          product_id = categoryData.id;
          console.log('Found product_id:', product_id, 'for category:', categoryData.code, 'name:', categoryData.name);
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
      contract_type: 'Default', // Use a default value that won't cause ENUM errors
      project_description: data.project_description || null,
      go_live_date: data.go_live_date,
      approver: data.approver || null,
      approval_date: data.approval_date,
      status,
      value: parseFloat(totals.finalTotal),
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

      const formattedData = await formatDataForSubmission(formData, 'Draft');
      console.log('Formatted data for saving:', formattedData);
      
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

      // Insert only valid licenses
      const licenseData = validLicenses.map(license => ({
        offer_id: offerId,
        license_type_id: license.type,
        quantity: Number(license.quantity),
        price: Number(license.price),
        annual_commitment: Boolean(license.annualCommitment),
        monthly_payment: Boolean(license.monthlyPayment),
        discount: Number(license.discount),
        total_value: Number(license.totalValue),
        margin_value: Number(license.marginValue)
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

      const formattedData = await formatDataForSubmission(formData, 'Pending' as OfferStatus);
      console.log('Formatted data for submission:', formattedData);
      
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

      // Insert only valid licenses
      const licenseData = validLicenses.map(license => ({
        offer_id: offerId,
        license_type_id: license.type,
        quantity: Number(license.quantity),
        price: Number(license.price),
        annual_commitment: Boolean(license.annualCommitment),
        monthly_payment: Boolean(license.monthlyPayment),
        discount: Number(license.discount),
        total_value: Number(license.totalValue),
        margin_value: Number(license.marginValue)
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
    fetchCategories();
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
      if (!categoryCode) {
        console.error('No category code provided');
        setLicenseTypes([]);
        return;
      }

      console.log('Fetching license types for category:', categoryCode);
      
      // Get the product category ID
      const { data: categoryData, error: categoryError } = await supabase
        .from('product_categories')
        .select('id')
        .eq('code', categoryCode)
        .single();

      if (categoryError) {
        console.error('Error fetching category:', categoryError);
        setLicenseTypes([]);
        return;
      }

      if (!categoryData?.id) {
        console.error('No category found for code:', categoryCode);
        setLicenseTypes([]);
        return;
      }

      console.log('Found category ID:', categoryData.id);

      // Then fetch license types using the category ID (product_id in license_types is actually the category ID)
      const { data, error } = await supabase
        .from('license_types')
        .select('*')
        .eq('product_id', categoryData.id)
        .order('name');

      if (error) {
        console.error('Error fetching license types:', error);
        setLicenseTypes([]);
        return;
      }

      console.log(`Fetched ${categoryCode} license types:`, data);
      setLicenseTypes(data || []);
    } catch (err) {
      console.error('Error in fetchLicenseTypesForCategory:', err);
      setLicenseTypes([]);
    }
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
            <LucidePlus size={16} />
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
                  {/* Product Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
                    <select
                      name="product_category"
                      value={formData.product_category || ''}
                      onChange={handleProductCategoryChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a category</option>
                      <option value="BUSINESS_CENTRAL">Business Central</option>
                      <option value="FINANCE_AND_OPERATIONS">Finance & Operations</option>
                      <option value="TIMEQODE">Timeqode</option>
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
                      {formData.product_category === 'BUSINESS_CENTRAL' && (
                        <>
                          <option value="PROJECT_IMPLEMENTATION">Project Implementation</option>
                          <option value="PROJECT_LOCALIZATION">Project Localization</option>
                        </>
                      )}
                      {formData.product_category === 'FINANCE_AND_OPERATIONS' && (
                        <>
                          <option value="PROJECT_IMPLEMENTATION">Project Implementation</option>
                          <option value="PROJECT_LOCALIZATION">Project Localization</option>
                        </>
                      )}
                      {formData.product_category === 'TIMEQODE' && (
                        <option value="PROJECT_IMPLEMENTATION">Project Implementation</option>
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
                      <LucidePlus size={14} className="mr-1" />
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
                      value={formData.approver}
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
          <div className="flex justify-between mt-6">
            <button 
              type="button"
              onClick={() => navigate('/offers')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <div className="flex space-x-3">
              <button 
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
              >
                Save as Draft
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white font-medium hover:bg-blue-700"
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}