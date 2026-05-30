import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const AttendanceChart = ({ present = 0, absent = 0, late = 0 }) => {
  const data = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [
      {
        data: [present, absent, late],
        backgroundColor: [
          'rgba(0, 201, 167, 0.8)', // Teal
          'rgba(255, 75, 75, 0.8)', // Red
          'rgba(240, 194, 127, 0.8)', // Gold
        ],
        borderColor: [
          '#00c9a7',
          '#ff4b4b',
          '#f0c27f',
        ],
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 26, 0.9)',
        titleColor: '#fff',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(108, 99, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6
      }
    },
    cutout: '75%',
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', minHeight: '250px' }}>
      {present === 0 && absent === 0 && late === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
          No Data Available
        </div>
      ) : (
        <Doughnut data={data} options={options} />
      )}
    </div>
  );
};

export default AttendanceChart;
