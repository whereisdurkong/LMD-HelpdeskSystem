// Enhanced Chart.js Options for Monthly Data
// Use these options in your chart components when filterType === "perMonth"

export const getMonthlyChartOptions = (chartType = 'bar') => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false, // Critical for preventing compression

    layout: {
      padding: {
        top: 10,
        bottom: 20,
        left: 10,
        right: 10
      }
    },

    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 11
          },
          usePointStyle: true
        }
      },
      title: {
        display: true,
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: {
          bottom: 15
        }
      },
      tooltip: {
        titleFont: {
          size: 12
        },
        bodyFont: {
          size: 11
        },
        padding: 8
      }
    },

    scales: {
      x: {
        ticks: {
          maxRotation: 45, // Rotate month labels to prevent overlap
          minRotation: 45,
          font: {
            size: 10
          },
          padding: 5,
          // Abbreviate month names
          callback: function (value, index, ticks) {
            const monthNames = [
              'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];
            const fullMonthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];

            const label = this.getLabelForValue(value);
            const monthIndex = fullMonthNames.indexOf(label);
            return monthIndex !== -1 ? monthNames[monthIndex] : label;
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 10
          },
          padding: 5,
          // Format large numbers
          callback: function (value) {
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'k';
            }
            return value;
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },

    // Animation configuration
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },

    // Interaction configuration
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // Specific adjustments for horizontal bar charts (like TAT)
  if (chartType === 'horizontalBar') {
    return {
      ...baseOptions,
      indexAxis: 'y',
      scales: {
        x: {
          ...baseOptions.scales.y, // Swap x and y scale configs
          title: {
            display: true,
            text: 'Hours',
            font: {
              size: 11
            }
          }
        },
        y: {
          ...baseOptions.scales.x,
          ticks: {
            ...baseOptions.scales.x.ticks,
            maxRotation: 0, // No rotation needed for y-axis
            minRotation: 0
          }
        }
      }
    };
  }

  return baseOptions;
};

// Example usage in your chart components:
/*
// In AllTicketBySite.jsx or similar components
import { getMonthlyChartOptions } from './monthly-chart-options';

export default function AllTicketBySite({ filterType }) {
  // ... your existing code ...

  const chartOptions = filterType === 'perMonth' 
    ? getMonthlyChartOptions('bar')
    : {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Tickets per Site' }
        },
        scales: { y: { beginAtZero: true } }
      };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {chartData && (
        <Bar
          data={chartData}
          options={chartOptions}
        />
      )}
    </div>
  );
}
*/

// Responsive chart container component
export const MonthlyChartContainer = ({ children, filterType }) => {
  const containerStyle = {
    width: '100%',
    height: filterType === 'perMonth' ? '400px' : '300px',
    minHeight: filterType === 'perMonth' ? '350px' : '250px',
    position: 'relative'
  };

  return (
    <div style={containerStyle}>
      {children}
    </div>
  );
};

// Month abbreviation utility
export const abbreviateMonths = (labels) => {
  const monthMap = {
    'January': 'Jan', 'February': 'Feb', 'March': 'Mar',
    'April': 'Apr', 'May': 'May', 'June': 'Jun',
    'July': 'Jul', 'August': 'Aug', 'September': 'Sep',
    'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
  };

  return labels.map(label => monthMap[label] || label);
};

