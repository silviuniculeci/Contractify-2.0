import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  offers: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ offers }) => {
  const [totalOffers, setTotalOffers] = useState(0);
  const [averageOfferValue, setAverageOfferValue] = useState(0);
  const [openOffers, setOpenOffers] = useState(0);
  const [closedOffers, setClosedOffers] = useState(0);
  const [pendingOffers, setPendingOffers] = useState(0);

  useEffect(() => {
    setTotalOffers(offers.length);

    if (offers.length > 0) {
      const totalValue = offers.reduce((sum, offer) => sum + (offer.value || 0), 0);
      setAverageOfferValue(totalValue / offers.length);
    } else {
      setAverageOfferValue(0);
    }

    setOpenOffers(offers.filter(offer => offer.status === 'Open').length);
    setClosedOffers(offers.filter(offer => offer.status === 'Closed').length);
    setPendingOffers(offers.filter(offer => offer.status === 'Pending').length);
  }, [offers]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-2">Dashboard</h2>
      <div className="mb-2">
        <span className="font-bold">Total Offers:</span> {totalOffers}
      </div>
      <div className="mb-2">
        <span className="font-bold">Average Offer Value:</span> {averageOfferValue.toFixed(2)}
      </div>
      <div className="mb-2">
        <span className="font-bold">Open Offers:</span> {openOffers}
      </div>
      <div className="mb-2">
        <span className="font-bold">Closed Offers:</span> {closedOffers}
      </div>
      <div>
        <span className="font-bold">Pending Offers:</span> {pendingOffers}
      </div>
    </div>
  );
};

export default Dashboard;