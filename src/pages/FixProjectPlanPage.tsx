import Layout from '../components/Layout';
import FixProjectPlanStatus from '../components/FixProjectPlanStatus';

export default function FixProjectPlanPage() {
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Project Plan Status Utility</h1>
        <p className="mb-6">
          This page provides utilities to fix project plan request statuses in the database.
        </p>
        
        <FixProjectPlanStatus />
      </div>
    </Layout>
  );
} 