import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import config from "config";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function PMSTATperCategory({ filterType = "all", showChart = true, location, onDataReady }) {
    const [tableData, setTableData] = useState([]);
    const [chartData, setChartData] = useState({ datasets: [] });
    const [chartOptions, setChartOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState([]);

    // Month names for reference
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/tat/get-all-pms-tat`);
                const pmstat = res.data;
                setRawData(pmstat);
                console.log('TAT Data:', pmstat);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Location filter function - NEW
    const filterDataByLocation = (data, location) => {
        if (!location || location === 'all') {
            return data; // Return all data if no location filter or 'all'
        }

        return data.filter(item => {
            const itemLocation = item.assigned_location || item.location || '';
            // Case-insensitive comparison
            return itemLocation.toLowerCase() === location.toLowerCase();
        });
    };

    // Date filter function
    const filterDataByDate = (data, filterType) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return data.filter(item => {
            const itemDate = new Date(item.created_at || item.date || item.timestamp);

            switch (filterType) {
                case 'today':
                    return itemDate >= today;

                case 'thisWeek': {
                    const startOfWeek = new Date(today);
                    const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
                    const diff = day === 0 ? 6 : day - 1; // Adjust to make Monday as start of week
                    startOfWeek.setDate(today.getDate() - diff);
                    return itemDate >= startOfWeek;
                }

                case 'lastWeek': {
                    const startOfLastWeek = new Date(today);
                    const day = today.getDay();
                    const diff = day === 0 ? 6 : day - 1;
                    startOfLastWeek.setDate(today.getDate() - diff - 7);

                    const endOfLastWeek = new Date(startOfLastWeek);
                    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);

                    return itemDate >= startOfLastWeek && itemDate <= endOfLastWeek;
                }

                case 'perMonth':
                case 'perYear':
                    // For perMonth and perYear, we want all data for grouping
                    return true;

                case 'all':
                default:
                    return true;
            }
        });
    };

    // Combined filter function
    const applyFilters = (data, filterType, location) => {
        // First apply location filter
        const locationFiltered = filterDataByLocation(data, location);
        // Then apply date filter
        return filterDataByDate(locationFiltered, filterType);
    };

    // Process data whenever rawData, filterType, or location changes
    useEffect(() => {
        if (rawData.length > 0) {
            // Apply both location and date filters
            const filteredData = applyFilters(rawData, filterType, location);

            console.log(`Filtered data - Location: ${location || 'all'}, Date: ${filterType}:`, filteredData.length);

            if (filterType === 'perMonth') {
                // Process data for monthly view
                const processed = processMonthlyData(filteredData);
                setTableData(processed);

                // Process for monthly chart
                const { chartData, chartOptions } = processMonthlyDataForChart(filteredData, location);
                setChartData(chartData);
                setChartOptions(chartOptions);
            }
            else if (filterType === 'perYear') {
                // Process data for yearly view
                const processed = processYearlyData(filteredData);
                setTableData(processed);

                // Process for yearly chart
                const { chartData, chartOptions } = processYearlyDataForChart(filteredData, location);
                setChartData(chartData);
                setChartOptions(chartOptions);
            }
            else {
                // Original processing for TAT timeframes
                const processed = processData(filteredData);
                setTableData(processed);

                const { chartData, chartOptions } = processDataForChart(processed, location);
                setChartData(chartData);
                setChartOptions(chartOptions);
            }

            // Call onDataReady callback if provided
            if (onDataReady) {
                onDataReady({
                    filteredCount: filteredData.length,
                    totalCount: rawData.length,
                    filterType,
                    location: location || 'all'
                });
            }
        }
    }, [rawData, filterType, location]);

    // Original processData function (updated to use location parameter if needed)
    const processData = (data) => {
        const categoryMap = new Map();

        data.forEach(item => {
            const category = item.pms_category || 'Uncategorized';
            const tat = item.tat || item.tat_category;

            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    category: category,
                    '30m': 0,
                    '1h': 0,
                    '2h': 0,
                    '1d': 0,
                    '2d': 0,
                    '3d': 0,
                    total: 0
                });
            }

            const categoryData = categoryMap.get(category);
            categoryData.total++;

            if (tat === '1h') categoryData['1h']++;
            else if (tat === '30m') categoryData['30m']++;
            else if (tat === '2h') categoryData['2h']++;
            else if (tat === '1d') categoryData['1d']++;
            else if (tat === '2d') categoryData['2d']++;
            else if (tat === '3d') categoryData['3d']++;
        });

        return Array.from(categoryMap.values());
    };

    // Process data by month
    const processMonthlyData = (data) => {
        const monthlyMap = new Map();

        // Initialize all months with zero counts
        monthNames.forEach(month => {
            monthlyMap.set(month, {
                month: month,
                '30m': 0,
                '1h': 0,
                '2h': 0,
                '1d': 0,
                '2d': 0,
                '3d': 0,
                total: 0
            });
        });

        data.forEach(item => {
            const itemDate = new Date(item.created_at || item.date || item.timestamp);
            const monthIndex = itemDate.getMonth(); // 0-11
            const month = monthNames[monthIndex];
            const tat = item.tat || item.tat_category;

            const monthData = monthlyMap.get(month);
            monthData.total++;

            if (tat === '1h') monthData['1h']++;
            else if (tat === '30m') monthData['30m']++;
            else if (tat === '2h') monthData['2h']++;
            else if (tat === '1d') monthData['1d']++;
            else if (tat === '2d') monthData['2d']++;
            else if (tat === '3d') monthData['3d']++;
        });

        return Array.from(monthlyMap.values());
    };

    // Process data for monthly chart (updated with location in title)
    const processMonthlyDataForChart = (data, location) => {
        // First, aggregate data by month
        const monthlyData = processMonthlyData(data);

        // TAT timeframes in desired order
        const timeframes = ['30m', '1h', '2h', '1d', '2d', '3d'];
        const timeframeLabels = {
            '30m': '30 Minutes',
            '1h': '1 Hour',
            '2h': '2 Hours',
            '1d': '1 Day',
            '2d': '2 Days',
            '3d': '3 Days'
        };

        // Generate colors for timeframes (different colors for each TAT type)
        const timeframeColors = {
            '30m': 'rgba(255, 99, 132, 0.8)',
            '1h': 'rgba(54, 162, 235, 0.8)',
            '2h': 'rgba(255, 206, 86, 0.8)',
            '1d': 'rgba(75, 192, 192, 0.8)',
            '2d': 'rgba(153, 102, 255, 0.8)',
            '3d': 'rgba(255, 159, 64, 0.8)'
        };

        // Create datasets - one for each TAT timeframe
        const datasets = timeframes.map((timeframe) => ({
            label: timeframeLabels[timeframe],
            data: monthlyData.map(month => month[timeframe] || 0),
            backgroundColor: timeframeColors[timeframe],
            borderColor: timeframeColors[timeframe].replace('0.8', '1'),
            borderWidth: 1,
            stack: 'stack0'
        }));

        // Chart data structure with months as labels
        const chartData = {
            labels: monthNames, // January to December
            datasets: datasets
        };

        // Get location display name
        const locationDisplay = location && location !== 'all' ? location.toUpperCase() : 'All Locations';

        // Chart options for monthly view
        const chartOptions = {
            indexAxis: 'x', // This makes it a vertical bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: `TAT Assets by Month - ${locationDisplay}`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value} assets`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Month',
                        font: {
                            weight: 'bold',
                            size: 12
                        }
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Number of Assets',
                        font: {
                            weight: 'bold',
                            size: 12
                        }
                    },
                    beginAtZero: true
                }
            }
        };

        return { chartData, chartOptions };
    };

    // Process data by year
    const processYearlyData = (data) => {
        const yearlyMap = new Map();

        // Get all available years from data
        const years = new Set();
        data.forEach(item => {
            const itemDate = new Date(item.created_at || item.date || item.timestamp);
            const year = itemDate.getFullYear();
            years.add(year);
        });

        // Sort years ascending
        const sortedYears = Array.from(years).sort((a, b) => a - b);

        // Initialize each year with zero counts
        sortedYears.forEach(year => {
            yearlyMap.set(year, {
                year: year,
                '30m': 0,
                '1h': 0,
                '2h': 0,
                '1d': 0,
                '2d': 0,
                '3d': 0,
                total: 0
            });
        });

        data.forEach(item => {
            const itemDate = new Date(item.created_at || item.date || item.timestamp);
            const year = itemDate.getFullYear();
            const tat = item.tat || item.tat_category;

            const yearData = yearlyMap.get(year);
            if (yearData) { // Check if year exists (should always exist)
                yearData.total++;

                if (tat === '1h') yearData['1h']++;
                else if (tat === '30m') yearData['30m']++;
                else if (tat === '2h') yearData['2h']++;
                else if (tat === '1d') yearData['1d']++;
                else if (tat === '2d') yearData['2d']++;
                else if (tat === '3d') yearData['3d']++;
            }
        });

        return Array.from(yearlyMap.values());
    };

    // Process data for yearly chart (updated with location in title)
    const processYearlyDataForChart = (data, location) => {
        // First, aggregate data by year
        const yearlyData = processYearlyData(data);

        // Extract years for labels
        const years = yearlyData.map(item => item.year.toString());

        // TAT timeframes in desired order
        const timeframes = ['30m', '1h', '2h', '1d', '2d', '3d'];
        const timeframeLabels = {
            '30m': '30 Minutes',
            '1h': '1 Hour',
            '2h': '2 Hours',
            '1d': '1 Day',
            '2d': '2 Days',
            '3d': '3 Days'
        };

        // Generate colors for timeframes (different colors for each TAT type)
        const timeframeColors = {
            '30m': 'rgba(255, 99, 132, 0.8)',
            '1h': 'rgba(54, 162, 235, 0.8)',
            '2h': 'rgba(255, 206, 86, 0.8)',
            '1d': 'rgba(75, 192, 192, 0.8)',
            '2d': 'rgba(153, 102, 255, 0.8)',
            '3d': 'rgba(255, 159, 64, 0.8)'
        };

        // Create datasets - one for each TAT timeframe
        const datasets = timeframes.map((timeframe) => ({
            label: timeframeLabels[timeframe],
            data: yearlyData.map(year => year[timeframe] || 0),
            backgroundColor: timeframeColors[timeframe],
            borderColor: timeframeColors[timeframe].replace('0.8', '1'),
            borderWidth: 1,
            stack: 'stack0'
        }));

        // Chart data structure with years as labels
        const chartData = {
            labels: years,
            datasets: datasets
        };

        // Get location display name
        const locationDisplay = location && location !== 'all' ? location.toUpperCase() : 'All Locations';

        // Chart options for yearly view
        const chartOptions = {
            indexAxis: 'x', // Vertical bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: `TAT Assets by Year - ${locationDisplay}`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value} assets`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Year',
                        font: {
                            weight: 'bold',
                            size: 12
                        }
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Number of Assets',
                        font: {
                            weight: 'bold',
                            size: 12
                        }
                    },
                    beginAtZero: true
                }
            }
        };

        return { chartData, chartOptions };
    };

    // Original processDataForChart function (updated with location in title)
    const processDataForChart = (data, location) => {
        // TAT timeframes in desired order
        const timeframes = ['30m', '1h', '2h', '1d', '2d', '3d'];
        const timeframeLabels = {
            '30m': '30 Minutes',
            '1h': '1 Hour',
            '2h': '2 Hours',
            '1d': '1 Day',
            '2d': '2 Days',
            '3d': '3 Days'
        };

        // Generate colors for categories
        const categoryColors = [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
            'rgba(255, 99, 255, 0.8)',
            'rgba(54, 162, 50, 0.8)'
        ];

        // Create datasets for stacked bar chart
        const datasets = data.map((category, index) => ({
            label: category.category,
            data: timeframes.map(timeframe => category[timeframe] || 0),
            backgroundColor: categoryColors[index % categoryColors.length],
            borderColor: categoryColors[index % categoryColors.length].replace('0.8', '1'),
            borderWidth: 1,
            stack: 'stack0'
        }));

        // Chart data structure
        const chartData = {
            labels: timeframes.map(tf => timeframeLabels[tf]),
            datasets: datasets
        };

        // Get location display name
        const locationDisplay = location && location !== 'all' ? location.toUpperCase() : 'All Locations';

        // Chart options with dynamic title based on filter and location
        const chartOptions = {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: `TAT Assets by Category - ${locationDisplay}`,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            const total = context.chart.data.datasets.reduce((sum, dataset) => sum + (dataset.data[context.dataIndex] || 0), 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} assets (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Number of Assets',
                        font: {
                            weight: 'bold',
                            size: 12
                        }
                    },
                    beginAtZero: true
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'TAT Timeframe',
                        font: {
                            weight: 'bold',
                            size: 12
                        }
                    }
                }
            }
        };

        return { chartData, chartOptions };
    };

    // Helper function to get display name for filter
    const getFilterDisplayName = (filter) => {
        const names = {
            'all': 'All Time',
            'today': 'Today',
            'thisWeek': 'This Week',
            'lastWeek': 'Last Week',
            'perMonth': 'Per Month',
            'perYear': 'Per Year'
        };
        return names[filter] || filter;
    };

    if (loading) return <div style={{ paddingTop: '150px', textAlign: 'center' }}>Loading...</div>;

    // Conditionally render based on showChart prop
    return (
        <div style={{ padding: '20px' }}>

            {showChart ? (
                // Show Bar Chart when showChart is true
                <div style={{ width: '100%', height: '100%' }}>
                    <Bar key={`${filterType}-${location}`} data={chartData} options={chartOptions} />
                </div>
            ) : (
                // Show Table when showChart is false
                <div style={{ overflowX: 'auto' }}>
                    <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '800px' }}>
                        <thead style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                            <tr style={{ textAlign: 'center' }}>
                                <th>
                                    {filterType === 'perMonth' ? 'Month' :
                                        filterType === 'perYear' ? 'Year' : 'PMS Category'}
                                </th>
                                <th>30m</th>
                                <th>1h</th>
                                <th>2hr</th>
                                <th>1day</th>
                                <th>2days</th>
                                <th>3days</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, index) => (
                                <tr key={row.category || row.month || row.year}
                                    style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                    <td><strong>{row.category || row.month || row.year}</strong></td>
                                    <td style={{ textAlign: 'center' }}>{row['30m']}</td>
                                    <td style={{ textAlign: 'center' }}>{row['1h']}</td>
                                    <td style={{ textAlign: 'center' }}>{row['2h']}</td>
                                    <td style={{ textAlign: 'center' }}>{row['1d']}</td>
                                    <td style={{ textAlign: 'center' }}>{row['2d']}</td>
                                    <td style={{ textAlign: 'center' }}>{row['3d']}</td>
                                    <td style={{ textAlign: 'center' }}><strong>{row.total}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot style={{ backgroundColor: '#e9e9e9', fontWeight: 'bold' }}>
                            <tr>
                                <td>Total</td>
                                <td style={{ textAlign: 'center' }}>{tableData.reduce((sum, row) => sum + row['30m'], 0)}</td>
                                <td style={{ textAlign: 'center' }}>{tableData.reduce((sum, row) => sum + row['1h'], 0)}</td>
                                <td style={{ textAlign: 'center' }}>{tableData.reduce((sum, row) => sum + row['2h'], 0)}</td>
                                <td style={{ textAlign: 'center' }}>{tableData.reduce((sum, row) => sum + row['1d'], 0)}</td>
                                <td style={{ textAlign: 'center' }}>{tableData.reduce((sum, row) => sum + row['2d'], 0)}</td>
                                <td style={{ textAlign: 'center' }}>{tableData.reduce((sum, row) => sum + row['3d'], 0)}</td>
                                <td style={{ textAlign: 'center' }}>{tableData.reduce((sum, row) => sum + row.total, 0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}