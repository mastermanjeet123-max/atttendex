import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ data, title }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            family: "'Inter', sans-serif",
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: '#fff',
        font: {
          size: 16,
          family: "'Inter', sans-serif",
          weight: '600'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 26, 0.9)',
        borderColor: 'rgba(108, 99, 255, 0.3)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', minHeight: '300px' }}>
      <Bar options={options} data={data} />
    </div>
  );
};

export default BarChart;
