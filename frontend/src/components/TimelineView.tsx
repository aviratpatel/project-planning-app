import React from 'react';
import type { PlanResponse } from '../types';

interface TimelineViewProps {
  planData: PlanResponse;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ planData }) => {
  const { summary, breakdownByApp, schedule } = planData;

  return (
    <div style={styles.container}>
      {/* Metrics Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.metricCard}>
          <h4>Total Workload</h4>
          <p style={styles.metricVal}>{summary.totalEffortDays} Days</p>
        </div>
        <div style={styles.metricCard}>
          <h4>Developers</h4>
          <p style={styles.metricVal}>{summary.totalDevelopers}</p>
        </div>
        <div style={styles.metricCard}>
          <h4>Project Duration</h4>
          <p style={{ ...styles.metricVal, fontSize: '18px' }}>
            {`${summary.projectStartDate} → ${summary.projectEndDate}`}
          </p>
  
          <span style={styles.subtext}>1 Dev per Feature (Excluding Weekends)</span>
        </div>
      </div>

      {/* Application Breakdown */}
      <div style={styles.section}>
        <h3>Effort Breakdown by Application</h3>
        <div style={styles.appGrid}>
          {Object.entries(breakdownByApp).map(([appName, appData]) => (
            <div key={appName} style={styles.appCard}>
              <h4>{appName} ({appData.totalEffort} Days Total)</h4>
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }} />
              {Object.entries(appData.screens).map(([screenName, screenData]) => (
                <div key={screenName} style={styles.screenItem}>
                  <strong>{screenName}</strong> ({screenData.totalEffort} days)
                  <ul style={styles.featureList}>
                    {screenData.features.map((f, idx) => (
                      <li key={idx}>
                        {f.feature}: {f.effortInDays} day(s)
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Schedule Table */}
      <div style={styles.section}>
        <h3>Developer Feature Allocation Schedule</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Application</th>
                <th style={styles.th}>Screen</th>
                <th style={styles.th}>Feature</th>
                <th style={styles.th}>Effort</th>
                <th style={styles.th}>Assigned Resource</th>
                <th style={styles.th}>Schedule Date Window</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>{item.application}</td>
                  <td style={styles.td}>{item.screen}</td>
                  <td style={styles.td}>{item.feature}</td>
                  <td style={styles.td}>{item.effortInDays} Day(s)</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{item.assignedDeveloper}</span>
                  </td>
                  <td style={styles.td}>
                    <strong>{item.startDateFormatted}</strong> to <strong>{item.endDateFormatted}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px'
  },
  metricCard: {
    backgroundColor: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    textAlign: 'center'
  },
  metricVal: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#0066cc',
    margin: '8px 0 4px 0'
  },
  subtext: {
    fontSize: '12px',
    color: '#6c757d'
  },
  badge: {
    backgroundColor: '#e7f5ff',
    color: '#1971c2',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '13px'
  },
  section: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    textAlign: 'left'
  },
  appGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginTop: '12px'
  },
  appCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '12px',
    backgroundColor: '#fafafa'
  },
  screenItem: {
    marginTop: '8px',
    fontSize: '14px'
  },
  featureList: {
    margin: '4px 0 0 16px',
    paddingLeft: '8px',
    fontSize: '13px',
    color: '#555'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px'
  },
  tableHeader: {
    backgroundColor: '#f1f3f5'
  },
  th: {
    padding: '10px',
    borderBottom: '2px solid #dee2e6',
    textAlign: 'left'
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #e9ecef'
  },
  tr: {
    textAlign: 'left'
  }
};