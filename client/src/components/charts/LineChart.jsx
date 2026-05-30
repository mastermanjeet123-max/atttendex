import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = ({ data, title }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
        }
      },
      title: {
        display: !!title,
        text: title,
        color: '#fff',
      },
      tooltip: {
        backgroundColor: 'rgba(10, 10, 26, 0.9)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
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
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', minHeight: '300px' }}>
      <Line options={options} data={data} />
    </div>
  );
};

export default LineChart;
