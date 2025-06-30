
import React from 'react';
import { useParams } from 'react-router-dom';
import SalesRepDashboard from '@/components/SalesRepDashboard';

const SalesRepPage = () => {
  const { salesRepId } = useParams<{ salesRepId: string }>();

  if (!salesRepId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Rep Not Found</h1>
          <p className="text-gray-600">Invalid sales representative ID</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <div className="container mx-auto p-6">
        <SalesRepDashboard salesRepId={salesRepId} />
      </div>
    </div>
  );
};

export default SalesRepPage;
