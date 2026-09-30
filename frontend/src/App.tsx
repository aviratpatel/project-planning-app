import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { TimelineView } from './components/TimelineView';
import type { PlanResponse } from './types';
import './App.css';

function App() {
  const [planData, setPlanData] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1>Application Effort & Timeline Planner</h1>
        <p style={{ color: '#666' }}>
          Upload your CSV efforts file and configure team size to generate estimation timelines.
        </p>
      </header>

      <main>
        <FileUpload
          onPlanGenerated={(data) => setPlanData(data)}
          loading={loading}
          setLoading={setLoading}
        />

        {loading && <p style={{ textAlign: 'center' }}>Processing CSV file and building schedule...</p>}

        {planData && !loading && <TimelineView planData={planData} />}
      </main>
    </div>
  );
}

export default App;