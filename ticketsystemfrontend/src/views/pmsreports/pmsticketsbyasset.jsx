import { useEffect, useState } from "react"
import axios from "axios";
import config from "config";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Form, Pagination } from "react-bootstrap";
import FeatherIcon from "feather-icons-react";

// Register all necessary ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function PmsTicketsByAsset({ filterType = 'all', showChart = true, location, onDataReady }) {
    const [chartData, setChartData] = useState(null);
    const [categoryAssets, setCategoryAssets] = useState({});
    const [monthlyCategoryAssets, setMonthlyCategoryAssets] = useState({});
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('');
    const [selectedYear, setSelectedYear] = useState(null); // Start with null
    const [availableYears, setAvailableYears] = useState([]); // Store available years from tickets
    // Add new state for month filter
    const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' or specific month
    const [availableMonths, setAvailableMonths] = useState([]); // Store available months for selected year

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(5); // Default to 5 rows per page
    const [expandedCategories, setExpandedCategories] = useState({});

    // Helper function to extract unique years from tickets
    const extractYearsFromTickets = (tickets) => {
        const years = new Set();

        tickets.forEach(ticket => {
            const ticketDate = ticket.created_at || ticket.date || ticket.created_date;
            if (ticketDate) {
                try {
                    const date = new Date(ticketDate);
                    if (!isNaN(date.getTime())) {
                        years.add(date.getFullYear());
                    }
                } catch (error) {
                    // Skip invalid dates
                }
            }
        });

        return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
    };

    // Helper function to extract unique months from tickets for a specific year
    const extractMonthsFromTickets = (tickets, year) => {
        const months = new Set();

        tickets.forEach(ticket => {
            const ticketDate = ticket.created_at || ticket.date || ticket.created_date;
            if (ticketDate) {
                try {
                    const date = new Date(ticketDate);
                    if (!isNaN(date.getTime()) && date.getFullYear() === year) {
                        const monthName = date.toLocaleString('default', { month: 'short' });
                        months.add(monthName);
                    }
                } catch (error) {
                    // Skip invalid dates
                }
            }
        });

        // Sort months in chronological order
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return Array.from(months).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    };

    // Helper function to get date range based on filter type and selected year
    const getDateRange = (filterType, year) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate, endDate = now;
        let rangeText = '';

        switch (filterType) {
            case 'today':
                startDate = today;
                rangeText = `Today (${today.toLocaleDateString()})`;
                break;

            case 'thisWeek':
                const firstDayOfWeek = new Date(today);
                const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
                const diff = day === 0 ? 6 : day - 1; // Adjust to start week on Monday
                firstDayOfWeek.setDate(today.getDate() - diff);
                startDate = firstDayOfWeek;
                rangeText = `This Week (${firstDayOfWeek.toLocaleDateString()} - ${now.toLocaleDateString()})`;
                break;

            case 'lastWeek':
                const lastWeekStart = new Date(today);
                const lastWeekEnd = new Date(today);
                // Go back to previous week
                lastWeekStart.setDate(today.getDate() - today.getDay() - 6);
                lastWeekEnd.setDate(today.getDate() - today.getDay());
                startDate = lastWeekStart;
                endDate = lastWeekEnd;
                rangeText = `Last Week (${lastWeekStart.toLocaleDateString()} - ${lastWeekEnd.toLocaleDateString()})`;
                break;

            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                rangeText = `This Month (${startDate.toLocaleDateString()} - ${now.toLocaleDateString()})`;
                break;

            case 'lastMonth':
                // First day of last month
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                // Last day of last month
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                rangeText = `Last Month (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
                break;

            case 'perMonth':
                // Show full selected year from January to December
                startDate = new Date(year, 0, 1); // January 1st of selected year
                endDate = new Date(year, 11, 31); // December 31st of selected year
                rangeText = `Year ${year} (Jan - Dec)`;
                break;

            case 'perYear':
                // Full selected year
                startDate = new Date(year, 0, 1);
                endDate = new Date(year, 11, 31);
                rangeText = `Year ${year}`;
                break;

            default:
                startDate = null;
                endDate = null;
                rangeText = 'All Time';
                break;
        }

        return { startDate, endDate, rangeText };
    };

    // Helper function to check if a date is within range
    const isDateInRange = (dateStr, startDate, endDate) => {
        if (!startDate) return true; // No filter applied

        try {
            const date = new Date(dateStr);
            // Set time to beginning of day for start date and end of day for end date
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            return date >= start && date <= end;
        } catch (error) {
            console.error('Invalid date:', dateStr);
            return false;
        }
    };

    // Helper function to get month name from date
    const getMonthName = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('default', { month: 'short' });
        } catch (error) {
            return 'Unknown';
        }
    };

    // Pagination helper functions
    const getPaginatedData = (data, page) => {
        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return data.slice(startIndex, endIndex);
    };

    const toggleCategory = (categoryKey) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryKey]: !prev[categoryKey]
        }));
        // Reset to page 1 when expanding/collapsing
        setCurrentPage(1);
    };

    const renderPagination = (totalItems, categoryKey) => {
        const totalPages = Math.ceil(totalItems / rowsPerPage);
        if (totalPages <= 1) return null;

        let items = [];
        for (let number = 1; number <= totalPages; number++) {
            items.push(
                <Pagination.Item
                    key={number}
                    active={number === currentPage}
                    onClick={() => setCurrentPage(number)}
                >
                    {number}
                </Pagination.Item>
            );
        }

        return (
            <div className="d-flex justify-content-center mt-3">
                <Pagination style={{ "--bs-pagination-active-bg": "#053b00ff", "--bs-pagination-active-border-color": "#053b00ff", "--bs-pagination-color": "#053b00ff" }}>
                    <Pagination.Prev
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    />
                    {items}
                    <Pagination.Next
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    />
                </Pagination>

            </div>
        );
    };

    // Initial fetch to get available years
    useEffect(() => {
        const fetchYears = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/pmsticket/get-all-pmsticket`);
                const tickets = res.data || [];
                const years = extractYearsFromTickets(tickets);
                setAvailableYears(years);

                // Set default selected year to the most recent year with data
                if (years.length > 0 && !selectedYear) {
                    setSelectedYear(years[0]);
                }
            } catch (err) {
                console.error('Error fetching years:', err);
            }
        };

        fetchYears();
    }, []);

    // Fetch available months when selected year changes
    useEffect(() => {
        const fetchMonths = async () => {
            if (!selectedYear) return;

            try {
                const res = await axios.get(`${config.baseApi}/pmsticket/get-all-pmsticket`);
                const tickets = res.data || [];
                const months = extractMonthsFromTickets(tickets, selectedYear);
                setAvailableMonths(months);

                // Reset selected month to 'all' when year changes
                setSelectedMonth('all');
            } catch (err) {
                console.error('Error fetching months:', err);
            }
        };

        fetchMonths();
    }, [selectedYear]);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                // Get date range based on filter type and selected year
                // Only use selected year for perMonth and perYear filters
                const yearToUse = (filterType === 'perMonth' || filterType === 'perYear') ? selectedYear : null;
                const { startDate, endDate, rangeText } = getDateRange(filterType, yearToUse);
                setDateRange(rangeText);

                // Fetch tickets
                const res = await axios.get(`${config.baseApi}/pmsticket/get-all-pmsticket`);
                let tickets = res.data || [];

                // Filter tickets by date if filter type is not 'all'
                if (filterType !== 'all' && startDate) {
                    tickets = tickets.filter(ticket => {
                        // Assuming tickets have a created_at or date field
                        const ticketDate = ticket.created_at || ticket.date || ticket.created_date;
                        return isDateInRange(ticketDate, startDate, endDate);
                    });

                    console.log(`Filtered tickets (${filterType}):`, tickets.length);
                }

                // Get all tag_ids from filtered tickets
                const tagIDs = tickets.map(t => t.tag_id).filter(id => id); // Remove null/undefined

                // Fetch assets
                const res1 = await axios.get(`${config.baseApi}/pms/get-all-assets`);
                const data1 = res1.data || [];

                // Filter active assets - get ALL active assets first (without location filter)
                let allActiveAssets = data1.filter(a => a.is_active === '1');

                // Create a Set of ALL active tag_ids for missing tag ID calculation
                const allActiveTagIds = new Set(allActiveAssets.map(a => a.tag_id));

                // Find tag_ids that are in filtered tickets but not in ALL active assets
                // This ensures unregistered assets are shown regardless of location filter
                const missingTagIds = tagIDs.filter(tagId => !allActiveTagIds.has(tagId));

                console.log("Filtered tickets count:", tickets.length);
                console.log("Total active assets:", allActiveAssets.length);
                console.log("Missing tag IDs:", missingTagIds.length);

                // NOW apply location filtering to active_assets for the table display
                let active_assets = [...allActiveAssets]; // Start with all active assets

                // Apply location filtering based on assigned_location
                if (location) {
                    console.log(`Applying location filter: ${location}`);

                    // Handle special case for 'all' - show both LMD and CORP
                    if (location.toLowerCase() === 'all') {
                        active_assets = active_assets.filter(a => {
                            return a.assigned_location &&
                                (a.assigned_location.toLowerCase() === 'lmd' ||
                                    a.assigned_location.toLowerCase() === 'corp');
                        });
                    }
                    // If location is 'lmd', filter for 'lmd' in assigned_location
                    else if (location.toLowerCase() === 'lmd') {
                        active_assets = active_assets.filter(a => {
                            return a.assigned_location && a.assigned_location.toLowerCase() === 'lmd';
                        });
                    }
                    // If location is 'corp', filter for 'corp' in assigned_location
                    else if (location.toLowerCase() === 'corp') {
                        active_assets = active_assets.filter(a => {
                            return a.assigned_location && a.assigned_location.toLowerCase() === 'corp';
                        });
                    }
                    // For other locations, do exact match
                    else {
                        active_assets = active_assets.filter(a => {
                            return a.assigned_location && a.assigned_location.toLowerCase() === location.toLowerCase();
                        });
                    }
                }

                // Filter assets that have matching tag_ids from filtered tickets
                const assetsWithMatchingTagIds = active_assets.filter(asset =>
                    tagIDs.includes(asset.tag_id)
                );

                console.log("Assets with matching tag_ids (after location filter):", assetsWithMatchingTagIds.length);

                // For perMonth filter, create monthly breakdown
                if (filterType === 'perMonth') {
                    // Initialize monthly data structure
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                    // For chart data (monthly category counts)
                    const monthlyCategoryCounts = {};
                    months.forEach(month => {
                        monthlyCategoryCounts[month] = {};
                    });

                    // For table data (monthly assets by category)
                    const monthlyAssets = {};
                    months.forEach(month => {
                        monthlyAssets[month] = {};
                    });

                    // Process each ticket and group by month
                    tickets.forEach(ticket => {
                        const ticketDate = ticket.created_at || ticket.date || ticket.created_date;
                        if (!ticketDate) return;

                        const month = getMonthName(ticketDate);

                        // Find matching asset for this ticket
                        const matchingAsset = assetsWithMatchingTagIds.find(a => a.tag_id === ticket.tag_id);

                        if (matchingAsset) {
                            const category = matchingAsset.pms_category || 'Uncategorized';

                            // Update counts for chart
                            if (!monthlyCategoryCounts[month][category]) {
                                monthlyCategoryCounts[month][category] = 0;
                            }
                            monthlyCategoryCounts[month][category]++;

                            // Update assets for table
                            if (!monthlyAssets[month][category]) {
                                monthlyAssets[month][category] = [];
                            }

                            // Check if asset already added to this month/category
                            const assetExists = monthlyAssets[month][category].some(
                                a => a.tag_id === matchingAsset.tag_id
                            );

                            if (!assetExists) {
                                monthlyAssets[month][category].push(matchingAsset);
                            }
                        }
                    });

                    // Handle unregistered assets (missing tag_ids) per month
                    if (missingTagIds.length > 0) {
                        const unregisteredCategory = 'Unregistered Assets';

                        // For unregistered assets, we need to know which month they appeared in
                        tickets.forEach(ticket => {
                            if (missingTagIds.includes(ticket.tag_id)) {
                                const ticketDate = ticket.created_at || ticket.date || ticket.created_date;
                                if (!ticketDate) return;

                                const month = getMonthName(ticketDate);

                                // Update counts for chart
                                if (!monthlyCategoryCounts[month][unregisteredCategory]) {
                                    monthlyCategoryCounts[month][unregisteredCategory] = 0;
                                }
                                monthlyCategoryCounts[month][unregisteredCategory]++;

                                // Create placeholder asset for table
                                const placeholderAsset = {
                                    tag_id: ticket.tag_id,
                                    asset_name: 'Not Registered',
                                    description: 'Asset tag ID exists in tickets but not registered in asset system',
                                    model: '-',
                                    serial_no: '-',
                                    assigned_location: '-',  // Changed from 'location' to 'assigned_location'
                                    department: '-',
                                    is_active: '0',
                                    id: `unregistered-${ticket.tag_id}-${month}`
                                };

                                // Add to monthly assets
                                if (!monthlyAssets[month][unregisteredCategory]) {
                                    monthlyAssets[month][unregisteredCategory] = [];
                                }

                                const assetExists = monthlyAssets[month][unregisteredCategory].some(
                                    a => a.tag_id === ticket.tag_id
                                );

                                if (!assetExists) {
                                    monthlyAssets[month][unregisteredCategory].push(placeholderAsset);
                                }
                            }
                        });
                    }

                    setMonthlyCategoryAssets(monthlyAssets);

                    // Prepare chart data for monthly view
                    if (showChart) {
                        // Get all unique categories across all months
                        const allCategories = [...new Set(
                            Object.values(monthlyCategoryCounts)
                                .flatMap(month => Object.keys(month))
                        )];

                        // Common colors
                        const backgroundColors = [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(255, 159, 64, 0.6)',
                            'rgba(199, 199, 199, 0.6)',
                            'rgba(83, 102, 255, 0.6)',
                            'rgba(255, 99, 255, 0.6)',
                            'rgba(54, 162, 100, 0.6)',
                            'rgba(255, 0, 0, 0.6)',
                        ];

                        const borderColors = [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)',
                            'rgba(199, 199, 199, 1)',
                            'rgba(83, 102, 255, 1)',
                            'rgba(255, 99, 255, 1)',
                            'rgba(54, 162, 100, 1)',
                            'rgba(255, 0, 0, 1)',
                        ];

                        // Create datasets for stacked bar chart
                        const datasets = allCategories.map((category, index) => ({
                            label: category,
                            data: months.map(month => monthlyCategoryCounts[month][category] || 0),
                            backgroundColor: backgroundColors[index % backgroundColors.length],
                            borderColor: borderColors[index % borderColors.length],
                            borderWidth: 1
                        }));

                        setChartData({
                            labels: months,
                            datasets: datasets
                        });
                    }

                    // Call onDataReady callback if provided
                    if (onDataReady) {
                        onDataReady(monthlyAssets);
                    }

                } else {
                    // Original logic for non-perMonth filters

                    // Group by pms_category and store full asset details
                    const categoryAssetsMap = {};
                    const categoryCount = {};

                    // Add existing assets to their categories
                    assetsWithMatchingTagIds.forEach(asset => {
                        const category = asset.pms_category || 'Uncategorized';

                        // For count
                        categoryCount[category] = (categoryCount[category] || 0) + 1;

                        // For full asset details
                        if (!categoryAssetsMap[category]) {
                            categoryAssetsMap[category] = [];
                        }
                        categoryAssetsMap[category].push(asset);
                    });

                    // Add "Unregistered Assets" category for missing tag_ids
                    if (missingTagIds.length > 0) {
                        const unregisteredCategory = 'Unregistered Assets';
                        categoryCount[unregisteredCategory] = missingTagIds.length;

                        // Create placeholder assets for missing tag_ids
                        categoryAssetsMap[unregisteredCategory] = missingTagIds.map(tagId => ({
                            tag_id: tagId,
                            asset_name: 'Not Registered',
                            description: 'Asset tag ID exists in tickets but not registered in asset system',
                            model: '-',
                            serial_no: '-',
                            assigned_location: '-',  // Changed from 'location' to 'assigned_location'
                            department: '-',
                            is_active: '0',
                            id: `unregistered-${tagId}`
                        }));
                    }

                    setCategoryAssets(categoryAssetsMap);

                    // Prepare data for chart
                    if (showChart) {
                        const labels = Object.keys(categoryCount);
                        const values = Object.values(categoryCount);

                        // Common background colors
                        const backgroundColors = [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                            'rgba(255, 159, 64, 0.6)',
                            'rgba(199, 199, 199, 0.6)',
                            'rgba(83, 102, 255, 0.6)',
                            'rgba(255, 99, 255, 0.6)',
                            'rgba(54, 162, 100, 0.6)',
                            'rgba(255, 0, 0, 0.6)',
                        ];

                        const borderColors = [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)',
                            'rgba(199, 199, 199, 1)',
                            'rgba(83, 102, 255, 1)',
                            'rgba(255, 99, 255, 1)',
                            'rgba(54, 162, 100, 1)',
                            'rgba(255, 0, 0, 1)',
                        ];

                        // Check if filter type is perYear to use Bar chart
                        const isYearly = filterType === 'perYear';

                        if (isYearly) {
                            // For Bar chart
                            setChartData({
                                labels: labels,
                                datasets: [
                                    {
                                        label: 'Number of Assets',
                                        data: values,
                                        backgroundColor: backgroundColors.slice(0, labels.length),
                                        borderColor: borderColors.slice(0, labels.length),
                                        borderWidth: 1,
                                        barPercentage: 0.7,
                                        categoryPercentage: 0.8
                                    },
                                ],
                            });
                        } else {
                            // For Pie chart
                            setChartData({
                                labels: labels,
                                datasets: [
                                    {
                                        label: 'Number of Assets',
                                        data: values,
                                        backgroundColor: backgroundColors,
                                        borderColor: borderColors,
                                        borderWidth: 1,
                                    },
                                ],
                            });
                        }
                    }

                    // Call onDataReady callback if provided
                    if (onDataReady) {
                        onDataReady(categoryAssetsMap);
                    }
                }

            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        }

        // Only fetch main data if we have selectedYear for perMonth/perYear, or for other filter types
        if ((filterType === 'perMonth' || filterType === 'perYear') ? selectedYear : true) {
            fetch();
        }
    }, [filterType, location, showChart, onDataReady, selectedYear]);

    // Reset pagination when data changes
    useEffect(() => {
        setCurrentPage(1);
        setExpandedCategories({});
    }, [categoryAssets, monthlyCategoryAssets, selectedMonth]);

    // Chart options for different chart types
    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Tickets per PMS Category - ${dateRange}`,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: `Assets per PMS Category - ${dateRange}`,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value} assets`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Assets'
                },
                ticks: {
                    stepSize: 1,
                    callback: function (value) {
                        if (Number.isInteger(value)) {
                            return value;
                        }
                        return null;
                    }
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'PMS Category'
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    };

    const stackedBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Monthly Assets by PMS Category - ${dateRange}`,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || '';
                        const value = context.raw || 0;
                        const month = context.label || '';
                        return `${month} - ${label}: ${value} assets`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                stacked: true,
                title: {
                    display: true,
                    text: 'Number of Assets'
                },
                ticks: {
                    stepSize: 1,
                    callback: function (value) {
                        if (Number.isInteger(value)) {
                            return value;
                        }
                        return null;
                    }
                }
            },
            x: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Month'
                }
            }
        }
    };

    if (loading) {
        return (
            <div style={{ paddingLeft: '20px', paddingRight: '20px', textAlign: 'center' }}>
                <div>Loading {dateRange} data...</div>
            </div>
        );
    }

    // Determine chart type
    const isPerMonth = filterType === 'perMonth';
    const isPerYear = filterType === 'perYear';
    const showYearFilter = (isPerMonth || isPerYear) && availableYears.length > 0;

    // Filter monthly data based on selected month
    const getFilteredMonthlyData = () => {
        if (selectedMonth === 'all') {
            return monthlyCategoryAssets;
        }

        // Return only the selected month
        return {
            [selectedMonth]: monthlyCategoryAssets[selectedMonth] || {}
        };
    };

    return (
        <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>

            {/* Add year and month filters for perMonth and perYear views */}
            {showYearFilter && !showChart && (
                <div style={{
                    marginBottom: '20px',
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>

                    <Form.Group className="flex-grow-1" style={{ minWidth: "150px", maxWidth: "200px" }}>
                        <Form.Label>Year</Form.Label>
                        <Form.Select value={selectedYear || ''}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {/* Add month filter for perMonth view */}
                    {isPerMonth && availableMonths.length > 0 && (
                        <Form.Group className="flex-grow-1" style={{ minWidth: "150px", maxWidth: "200px" }}>
                            <Form.Label>Month</Form.Label>
                            <Form.Select value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}>
                                <option value="all">All Months</option>
                                {availableMonths.map(month => (
                                    <option key={month} value={month}>
                                        {month}
                                    </option>
                                ))}

                            </Form.Select>
                        </Form.Group>
                    )}
                </div>
            )}

            {/* Show Chart */}
            {showChart && chartData && (
                <div style={{ height: '400px', marginBottom: '40px' }}>
                    {isPerMonth ? (
                        <Bar data={chartData} options={stackedBarOptions} />
                    ) : isPerYear ? (
                        <Bar data={chartData} options={barOptions} />
                    ) : (
                        <Pie data={chartData} options={pieOptions} />
                    )}
                </div>
            )}

            {/* Show Tables */}
            {!showChart && (
                <div style={{ marginTop: '40px' }}>
                    {isPerMonth ? (
                        // Monthly breakdown view with month filter applied
                        Object.entries(getFilteredMonthlyData()).map(([month, categories]) => {
                            const hasAssets = Object.keys(categories).length > 0;

                            return (
                                <div key={month} style={{ marginBottom: '40px' }}>
                                    <h4 style={{
                                        margin: '0 0 15px 0',
                                        padding: '10px',
                                        backgroundColor: '#e8f5e8',
                                        borderRadius: '5px',
                                        color: '#053b00ff'
                                    }}>
                                        {month} - {selectedYear}
                                    </h4>

                                    {Object.entries(categories).map(([category, assets]) => {
                                        const categoryKey = `${month}-${category}`;
                                        const paginatedAssets = getPaginatedData(assets, currentPage);

                                        return (
                                            <div key={categoryKey} style={{ marginBottom: '25px' }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        cursor: "pointer",
                                                        marginBottom: "10px"
                                                    }}
                                                    onClick={() => toggleCategory(categoryKey)}
                                                >
                                                    <h5 style={{
                                                        margin: '0 0 0 0',
                                                        color: '#053b00ff'
                                                    }}>
                                                        {category} ({assets.length} {assets.length === 1 ? 'asset' : 'assets'})
                                                    </h5>
                                                    <span style={{ marginLeft: "10px", fontSize: "1.2em" }}>
                                                        {expandedCategories[categoryKey] ? <FeatherIcon icon="chevron-down" /> : <FeatherIcon icon="chevron-right" />}
                                                    </span>
                                                </div>

                                                {expandedCategories[categoryKey] && (
                                                    <>
                                                        <table
                                                            border="1"
                                                            cellPadding="5"
                                                            style={{
                                                                borderCollapse: "collapse",
                                                                width: '100%',
                                                                marginBottom: '10px'
                                                            }}
                                                        >
                                                            <thead style={{ background: '#053b00ff', color: 'white' }}>
                                                                <tr>
                                                                    <th>Tag ID</th>
                                                                    <th>Asset Name</th>
                                                                    <th>Description</th>
                                                                    <th>Model</th>
                                                                    <th>Serial No</th>
                                                                    <th>Assigned Location</th>
                                                                    <th>Department</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {paginatedAssets.map((asset, index) => {
                                                                    const isUnregisteredAsset = asset.asset_name === 'Not Registered';

                                                                    return (
                                                                        <tr
                                                                            key={asset.id || index}
                                                                            style={{
                                                                                backgroundColor: isUnregisteredAsset ? '#ffebee' : 'inherit',
                                                                                color: isUnregisteredAsset ? '#c62828' : 'inherit',
                                                                                cursor: asset.pms_category && asset.pms_id ? "pointer" : "default"
                                                                            }}
                                                                            onClick={() => {
                                                                                if (asset.pms_category && asset.pms_id) {
                                                                                    window.open(`/ticketsystem/assets-${asset.pms_category}?id=${asset.pms_id}`)
                                                                                }
                                                                            }}
                                                                        >
                                                                            <td>{asset.tag_id}</td>
                                                                            <td>{asset.asset_name || "-"}</td>
                                                                            <td>{asset.description || "-"}</td>
                                                                            <td>{asset.model || "-"}</td>
                                                                            <td>{asset.serial_no || "-"}</td>
                                                                            <td>{asset.assigned_location || "-"}</td>
                                                                            <td>{asset.department || "-"}</td>
                                                                            <td>
                                                                                <span style={{
                                                                                    padding: '3px 8px',
                                                                                    borderRadius: '3px',
                                                                                    fontSize: '12px',
                                                                                    fontWeight: '500',
                                                                                    backgroundColor: asset.is_active === '1' ? '#d4edda' :
                                                                                        isUnregisteredAsset ? '#ffcdd2' : '#f8d7da',
                                                                                    color: asset.is_active === '1' ? '#155724' :
                                                                                        isUnregisteredAsset ? '#b71c1c' : '#721c24'
                                                                                }}>
                                                                                    {isUnregisteredAsset ? 'Unregistered' :
                                                                                        (asset.is_active === '1' ? 'Active' : 'Inactive')}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                {paginatedAssets.length === 0 && (
                                                                    <tr>
                                                                        <td colSpan="8" style={{ textAlign: "center" }}>No assets found</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                        {renderPagination(assets.length, categoryKey)}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {!hasAssets && (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '20px',
                                            backgroundColor: '#f8f9fa',
                                            marginBottom: '20px'
                                        }}>
                                            No assets found for {month}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        // Non-perMonth view
                        Object.entries(categoryAssets).length > 0 ? (
                            Object.entries(categoryAssets).map(([category, assets]) => {
                                const isUnregistered = category === 'Unregistered Assets';
                                const categoryKey = category;
                                const paginatedAssets = getPaginatedData(assets, currentPage);

                                return (
                                    <div key={category} style={{ marginBottom: '30px' }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                cursor: "pointer",
                                                marginBottom: "10px"
                                            }}
                                            onClick={() => toggleCategory(categoryKey)}
                                        >
                                            <h4 style={{
                                                margin: '0 0 0 0',
                                                borderRadius: '5px',
                                                color: 'inherit',
                                            }}>
                                                {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() + ' '}
                                                ({assets.length} {assets.length === 1 ? 'asset' : 'assets'})
                                            </h4>
                                            <span style={{ marginLeft: "10px", fontSize: "1.2em" }}>
                                                {expandedCategories[categoryKey] ? <FeatherIcon icon="chevron-down" /> : <FeatherIcon icon="chevron-right" />}
                                            </span>
                                        </div>

                                        {expandedCategories[categoryKey] && (
                                            <>
                                                <table
                                                    border="1"
                                                    cellPadding="5"
                                                    style={{
                                                        borderCollapse: "collapse",
                                                        width: '100%',
                                                        marginBottom: '10px'
                                                    }}
                                                >
                                                    <thead style={{ background: '#053b00ff', color: 'white' }}>
                                                        <tr>
                                                            <th>Tag ID</th>
                                                            <th>Asset Name</th>
                                                            <th>Description</th>
                                                            <th>Model</th>
                                                            <th>Serial No</th>
                                                            <th>Assigned Location</th>
                                                            <th>Department</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedAssets.map((asset, index) => {
                                                            const isUnregisteredAsset = asset.asset_name === 'Not Registered';

                                                            return (
                                                                <tr
                                                                    key={asset.id || index}
                                                                    style={{
                                                                        backgroundColor: isUnregisteredAsset ? '#ffebee' : 'inherit',
                                                                        color: isUnregisteredAsset ? '#c62828' : 'inherit',

                                                                    }}

                                                                >
                                                                    <td>{asset.tag_id}</td>
                                                                    <td>{asset.asset_name || "-"}</td>
                                                                    <td>{asset.description || "-"}</td>
                                                                    <td>{asset.model || "-"}</td>
                                                                    <td>{asset.serial_no || "-"}</td>
                                                                    <td>{asset.assigned_location || "-"}</td>
                                                                    <td>{asset.department || "-"}</td>
                                                                    <td>
                                                                        <span style={{
                                                                            padding: '3px 8px',
                                                                            borderRadius: '3px',
                                                                            fontSize: '12px',
                                                                            fontWeight: '500',
                                                                            backgroundColor: asset.is_active === '1' ? '#d4edda' :
                                                                                isUnregisteredAsset ? '#ffcdd2' : '#f8d7da',
                                                                            color: asset.is_active === '1' ? '#155724' :
                                                                                isUnregisteredAsset ? '#b71c1c' : '#721c24'
                                                                        }}>
                                                                            {isUnregisteredAsset ? 'Unregistered' :
                                                                                (asset.is_active === '1' ? 'Active' : 'Inactive')}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {paginatedAssets.length === 0 && (
                                                            <tr>
                                                                <td colSpan="8" style={{ textAlign: "center" }}>No assets found</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                                {renderPagination(assets.length, categoryKey)}
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa' }}>
                                No asset data available for {dateRange}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}