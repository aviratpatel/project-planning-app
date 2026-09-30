import React, { useState, ChangeEvent, FormEvent } from 'react';
import type { PlanResponse } from '../types';

interface FileUploadProps {
  onPlanGenerated: (data: PlanResponse) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onPlanGenerated, loading, setLoading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [developers, setDevelopers] = useState<number>(2);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('totalDevelopers', developers.toString());
    formData.append('startDate', startDate);

    try {
      const response = await fetch('http://localhost:5000/api/plan/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate plan');
      }

      const result: PlanResponse = await response.json();
      onPlanGenerated(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred during file upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!file) {
      setError('Please select a CSV file first before exporting to Excel.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('totalDevelopers', developers.toString());
    formData.append('startDate', startDate);

    try {
      const response = await fetch('http://localhost:5000/api/plan/export-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to export Excel file.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Project_Timeline_${startDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download Excel spreadsheet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2>Project Planner Configurator</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="csvFile">Upload Efforts CSV:</label>
          <input
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={styles.input}
          />
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label htmlFor="developers">Total Developers:</label>
            <input
              id="developers"
              type="number"
              min="1"
              max="100"
              value={developers}
              onChange={(e) => setDevelopers(parseInt(e.target.value, 10) || 1)}
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label htmlFor="startDate">Project Start Date:</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.buttonGroup}>
          <button type="submit" disabled={loading} style={styles.buttonPrimary}>
            {loading ? 'Processing Schedule...' : 'Generate Timeline Plan'}
          </button>
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={loading || !file}
            style={{
              ...styles.buttonSecondary,
              opacity: loading || !file ? 0.6 : 1,
              cursor: loading || !file ? 'not-allowed' : 'pointer'
            }}
          >
            📊 Save Timeline to Excel
          </button>
        </div>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: '24px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '24px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  row: {
    display: 'flex',
    gap: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left'
  },
  input: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px'
  },
  buttonPrimary: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#0066cc',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '15px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  buttonSecondary: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#2b8a3e',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '15px',
    fontWeight: 'bold'
  },
  error: {
    color: '#d9534f',
    fontSize: '14px',
    textAlign: 'left'
  }
};