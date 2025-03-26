import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Calendar, FileText } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const ContractifyRedesign = () => {
  const { offerId } = useParams();
  const [productInfoOpen, setProductInfoOpen] = useState(true);
  const [approvalInfoOpen, setApprovalInfoOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('timeqode');
  const [licenses, setLicenses] = useState([{
    id: 1,
    type: '',
    quantity: 1,
    price: '',
    annualCommitment: false,
    monthlyPayment: false,
    discount: 0,
    totalValue: 0,
    marginValue: 0
  }]);
  const [offerData, setOfferData] = useState<any>(null);

  useEffect(() => {
    const fetchOfferData = async () => {
      if (offerId) {
        try {
          const { data, error } = await supabase
            .from('offers')
            .select('*')
            .eq('id', offerId)
            .single();

          if (error) {
            console.error('Error fetching offer:', error);
          }

          setOfferData(data || null);
        } catch (error) {
          console.error('Error fetching offer:', error);
        }
      }
    };

    fetchOfferData();
  }, [offerId]);

  // Calculate total values
  const calculateTotals = () => {
    let totalValue = 0;
    let totalDiscount = 0;
    let totalMargin = 0;

    licenses.forEach(license => {
      const price = parseFloat(license.price) || 0;
      const quantity = license.quantity || 0;
      const discount = license.discount || 0;
      
      // Apply annual multiplier if annual commitment is selected
      const multiplier = license.annualCommitment ? 12 : 1;
      
      const itemValue = price * quantity * multiplier;
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
      totalValue: 0,
      marginValue: 0
    }]);
  };

  const removeLicense = (id: number) => {
    setLicenses(licenses.filter(license => license.id !== id));
  };

  return (
    <div className="flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-medium">New Offer</h1>
        <div className="text-sm px-3 py-1 bg-gray-100 rounded text-gray-500">Draft</div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Form Content */}
        <div className="p-6">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Client name"
                      value={offerData?.customer_name || ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CUI (VAT)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Client identifier"
                      value={offerData?.cui || ''}
                    />
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order date</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="mm/dd/yyyy"
                      />
                      <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Person</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Sales person name"
                      defaultValue="Silviu Niculeci"
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
                <h2 className="font-medium">Offer Information</h2>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Solution</label>
                    <div className="relative">
                      <select 
                        className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        defaultValue=""
                        onChange={(e) => setSelectedProduct(e.target.value)}
                      >
                        <option value="">Select a solution</option>
                        <option value="timeqode">Timeqode</option>
                        <option value="business-central">Business Central</option>
                        <option value="finance-operations">Finance and Operations</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <div className="relative">
                      <select 
                        className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        defaultValue="implementation"
                      >
                        {selectedProduct === 'timeqode' ? (
                          <>
                            <option value="">Select a project type</option>
                            <option value="implementation">Select a project type</option>
                          </>
                        ) : (
                          <>
                            <option value="">Select a project type</option>
                            <option value="implementation">Project Implementation</option>
                            <option value="localisation">Project Localisation</option>
                          </>
                        )}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Go-Live Estimated Date</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="mm/dd/yyyy"
                    />
                    <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
                  </div>
                </div>
                
                {/* License Table */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Licenses</label>
                    <button 
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
                    
                    {/* Table Body */}
                    {licenses.map(license => (
                      <div key={license.id} className="px-4 py-3 grid grid-cols-12 gap-4 border-t border-gray-200">
                        <div className="col-span-3">
                          <div className="relative">
                            <select 
                              className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              value={license.type}
                              onChange={(e) => {
                                const updatedLicenses = licenses.map(l => 
                                  l.id === license.id ? {...l, type: e.target.value} : l
                                );
                                setLicenses(updatedLicenses);
                              }}
                            >
                              <option value="">Select a license type</option>
                              {selectedProduct === 'timeqode' && (
                                <>
                                  <option value="platform">Timeqode Platform</option>
                                  <option value="e-factura">Timeqode e-Factura</option>
                                  <option value="e-transport">Timeqode e-Transport</option>
                                </>
                              )}
                              {selectedProduct === 'business-central' && (
                                <>
                                  <option value="bc-essentials">Dynamics 365 Business Central Essentials</option>
                                  <option value="bc-premium">Dynamics 365 Business Central Premium</option>
                                  <option value="bc-team-members">Dynamics 365 Business Central Team Members</option>
                                  <option value="bc-device">Dynamics 365 Business Central Device</option>
                                  <option value="bc-additional-environment">Dynamics 365 Business Central Additional Environment Addon</option>
                                  <option value="bc-external-accountant">Dynamics 365 Business Central External Accountant</option>
                                  <option value="bc-essentials-attach">Dynamics 365 Business Central Essentials Attach</option>
                                  <option value="bc-database-capacity">Dynamics 365 Business Central Database Capacity</option>
                                  <option value="bc-database-overage">Dynamics 365 Business Central Database Capacity Overage</option>
                                  <option value="bc-database-100gb">Dynamics 365 Business Central Database Capacity 100GB</option>
                                </>
                              )}
                              {selectedProduct === 'finance-operations' && (
                                <>
                                  <option value="fo-finance-attach">Dynamics 365 Finance Attach to Qualifying Dynamics 365 Base Offer</option>
                                  <option value="fo-finance">Dynamics 365 Finance</option>
                                  <option value="fo-finance-premium">Dynamics 365 Finance Premium</option>
                                  <option value="fo-scm">Dynamics 365 Supply Chain Management</option>
                                  <option value="fo-scm-attach">Dynamics 365 Supply Chain Management Attach to Qualifying Dynamics 365 Base Offer</option>
                                  <option value="fo-scm-premium">Dynamics 365 Supply Chain Management Premium</option>
                                  <option value="fo-sensor-machines">Sensor Data Intelligence Additional Machines Add-in for Dynamics 365 Supply Chain Management</option>
                                  <option value="fo-sensor-scenario">Sensor Data Intelligence Scenario Add-in for Dynamics 365 Supply Chain Management</option>
                                  <option value="fo-pro-direct">Pro Direct Support for Dynamics 365 Operations</option>
                                </>
                              )}
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
                                  const subtotal = price * quantity * multiplier;
                                  const discountValue = subtotal * (discount/100);
                                  const calculatedTotal = subtotal - discountValue;
                                  const calculatedMargin = calculatedTotal * 0.3;
                                  return {
                                    ...l, 
                                    quantity,
                                    totalValue: parseFloat(calculatedTotal.toFixed(2)),
                                    marginValue: parseFloat(calculatedMargin.toFixed(2))
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
                            placeholder="$ 0.00"
                            value={license.price}
                            onChange={(e) => {
                              const price = e.target.value;
                              const updatedLicenses = licenses.map(l => {
                                if (l.id === license.id) {
                                  const numPrice = parseFloat(price) || 0;
                                  const quantity = l.quantity || 0;
                                  const discount = l.discount || 0;
                                  const multiplier = l.annualCommitment ? 12 : 1;
                                  const subtotal = numPrice * quantity * multiplier;
                                  const discountValue = subtotal * (discount/100);
                                  const calculatedTotal = subtotal - discountValue;
                                  const calculatedMargin = calculatedTotal * 0.3;
                                  return {
                                    ...l, 
                                    price,
                                    totalValue: parseFloat(calculatedTotal.toFixed(2)),
                                    marginValue: parseFloat(calculatedMargin.toFixed(2))
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
                                  const subtotal = price * quantity * multiplier;
                                  const discountValue = subtotal * (discount/100);
                                  const calculatedTotal = subtotal - discountValue;
                                  const calculatedMargin = calculatedTotal * 0.3;
                                  return {
                                    ...l,
                                    annualCommitment,
                                    totalValue: parseFloat(calculatedTotal.toFixed(2)),
                                    marginValue: parseFloat(calculatedMargin.toFixed(2))
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
                                    const subtotal = price * quantity * multiplier;
                                    const discountValue = subtotal * (discount/100);
                                    const calculatedTotal = subtotal - discountValue;
                                    const calculatedMargin = calculatedTotal * 0.3;
                                    return {
                                      ...l,
                                      discount,
                                      totalValue: parseFloat(calculatedTotal.toFixed(2)),
                                      marginValue: parseFloat(calculatedMargin.toFixed(2))
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
                            placeholder="$ 0.00"
                            value={license.totalValue ? `${license.totalValue}` : "$ 0.00"}
                            readOnly
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <input 
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                            placeholder="$ 0.00"
                            value={license.marginValue ? `${license.marginValue}` : "$ 0.00"}
                            readOnly
                          />
                        </div>
                        
                        <div className="col-span-1 flex items-center justify-center">
                          {licenses.length > 1 && (
                            <button 
                              onClick={() => removeLicense(license.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Ultra-Minimal License Totals Summary - Connected to table */}
                  <div className="border-t-0 border border-gray-200 rounded-b-md bg-gray-50 px-4 py-2 flex items-center" style={{marginTop: "-1px"}}>
                    <span className="font-medium text-sm mr-8">License Summary</span>
                    <div className="flex-grow"></div>
                    <div className="flex items-center space-x-5 mr-16">
                      <div>
                        <span className="text-xs text-gray-500 mr-1">Total:</span>
                        <span className="text-sm font-medium">${totals.totalValue}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 mr-1">Discount:</span>
                        <span className="text-sm font-medium text-red-500">-${totals.totalDiscount}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 mr-1">Final:</span>
                        <span className="text-sm font-bold">${totals.finalTotal}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 mr-1">Margin:</span>
                        <span className="text-sm font-medium text-green-600">${totals.totalMargin}</span>
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                  <textarea 
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Approver name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required by</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="mm/dd/yyyy"
                      />
                      <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <button className="px-3 py-1.5 rounded-md text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center border border-transparent">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Cancel
            </button>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 rounded-md text-gray-700 text-sm font-medium bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Excel
              </button>
              <button className="px-3 py-1.5 rounded-md text-gray-700 text-sm font-medium bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Save as Draft
              </button>
              <button className="px-3 py-1.5 rounded-md text-gray-700 text-sm font-medium bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="16" x2="12" y2="8"></line></svg>
                Request Project Plan
              </button>
              <button className="px-3 py-1.5 rounded-md text-white text-sm font-medium bg-blue-600 border border-blue-600 shadow-sm hover:bg-blue-700 transition-colors duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractifyRedesign;