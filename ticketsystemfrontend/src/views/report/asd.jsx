import React, { useEffect, useState } from "react";
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
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Button, Col } from "react-bootstrap";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function TatPerCategorySummary({ filterType = "all", showChart = true, location, onDataReady }) {
    const [rows, setRows] = useState([]);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [yearlyData, setYearlyData] = useState([]); // Added for perYear

    // chart mode
    const [viewMode, setViewMode] = useState("category"); // category | subcategory

    const tatTypes = ["30m", "1h", "2h", "1d", "2d", "3d"];

    // Month order for sorting
    const monthOrder = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // ===== TOOLTIP HELPER =====
    const getTicketTitle = arr =>
        arr.length
            ? arr.map(id => `Ticket_id: ${id}`).join("\n")
            : "No tickets";

    // ===== HELPER: Get total count from tat object =====
    const getTotal = (tat) => {
        return Object.values(tat).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    };

    // ===== DATE FILTER HELPER =====
    const isInDateRange = (dateStr, type) => {
        if (!dateStr || type === "all") return true;

        const date = new Date(dateStr);
        const now = new Date();

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        switch (type) {
            case "today":
                return date >= startOfToday;
            case "thisWeek":
                return date >= startOfWeek;
            case "lastWeek":
                return date >= startOfLastWeek && date < startOfWeek;
            case "thisMonth":
                return date >= startOfMonth;
            case "perMonth":
                return date.getFullYear() === now.getFullYear();
            case "perYear":
                return true; // Show all years for perYear
            default:
                return true;
        }
    };

    // ===== GET MONTH NAME =====
    const getMonthName = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('default', { month: 'long' });
    };

    // ===== GET YEAR =====
    const getYear = (dateStr) => {
        const date = new Date(dateStr);
        return date.getFullYear();
    };

    // ===== FETCH DATA =====
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1️⃣ Get all TAT data
                const res = await axios.get(`${config.baseApi}/tat/get-all-tat`);
                const tatData = res.data || [];

                // 2️⃣ Filter support tickets & apply date filter
                let support = tatData.filter(
                    a =>
                        a.ticket_type === "support" &&
                        isInDateRange(a.ticket_created_at, filterType)
                );

                // 3️⃣ Get all ticket details
                const res1 = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                const allTickets = res1.data || [];

                // 4️⃣ Merge support with full ticket details
                support = support.map(s => {
                    const match = allTickets.find(
                        t => String(t.ticket_id) === String(s.ticket_id)
                    );
                    return { ...s, ...match };
                });

                // 5️⃣ Filter by location
                if (location === "lmd") {
                    support = support.filter(t => t.assigned_location === "lmd");
                } else if (location === "corp") {
                    support = support.filter(t => t.assigned_location === "corp");
                }

                // 6️⃣ Handle different filter types
                if (filterType === "perMonth") {
                    // PER MONTH VIEW - Group by month
                    const monthlyMap = {};

                    // Initialize months
                    monthOrder.forEach(month => {
                        monthlyMap[month] = {
                            month: month,
                            monthIndex: monthOrder.indexOf(month),
                            year: new Date().getFullYear(),
                            tat: Object.fromEntries(tatTypes.map(t => [t, []])),
                            categories: {}
                        };
                    });

                    // Process each ticket and group by month
                    support.forEach(item => {
                        const month = getMonthName(item.ticket_created_at);
                        if (!monthlyMap[month]) return;

                        const cat = item.category?.toLowerCase() || "uncategorized";
                        const sub = item.sub_category || "Others";
                        const tat = item.tat;
                        const ticketId = item.ticket_id;

                        if (!tat || !tatTypes.includes(tat)) return;

                        // Add to month totals
                        if (monthlyMap[month].tat[tat]) {
                            monthlyMap[month].tat[tat].push(ticketId);
                        }

                        // Initialize category for this month if not exists
                        if (!monthlyMap[month].categories[cat]) {
                            monthlyMap[month].categories[cat] = {
                                category: cat,
                                tat: Object.fromEntries(tatTypes.map(t => [t, []])),
                                subCategories: {}
                            };
                        }

                        // Add to category
                        if (monthlyMap[month].categories[cat].tat[tat]) {
                            monthlyMap[month].categories[cat].tat[tat].push(ticketId);
                        }

                        // Initialize subcategory
                        if (!monthlyMap[month].categories[cat].subCategories[sub]) {
                            monthlyMap[month].categories[cat].subCategories[sub] = {
                                name: sub,
                                tat: Object.fromEntries(tatTypes.map(t => [t, []]))
                            };
                        }

                        // Add to subcategory
                        if (monthlyMap[month].categories[cat].subCategories[sub].tat[tat]) {
                            monthlyMap[month].categories[cat].subCategories[sub].tat[tat].push(ticketId);
                        }
                    });

                    // Convert to array and sort by month order
                    const monthlyArray = Object.values(monthlyMap)
                        .sort((a, b) => a.monthIndex - b.monthIndex);

                    setMonthlyData(monthlyArray);
                    setYearlyData([]); // Clear yearly data
                    setRows([]); // Clear regular rows

                    // ===== SEND DATA TO PARENT =====
                    if (onDataReady) {
                        const summaryData = {
                            type: 'monthly',
                            data: monthlyArray,
                            summary: monthlyArray.map(month => ({
                                month: month.month,
                                total: getTotal(month.tat),
                                '30m': month.tat['30m']?.length || 0,
                                '1h': month.tat['1h']?.length || 0,
                                '2h': month.tat['2h']?.length || 0,
                                '1d': month.tat['1d']?.length || 0,
                                '2d': month.tat['2d']?.length || 0,
                                '3d': month.tat['3d']?.length || 0,
                                categories: Object.keys(month.categories).reduce((acc, cat) => {
                                    acc[cat] = getTotal(month.categories[cat].tat);
                                    return acc;
                                }, {})
                            }))
                        };
                        onDataReady(summaryData);
                    }

                } else if (filterType === "perYear") {
                    // PER YEAR VIEW - Group by year
                    const yearlyMap = {};

                    // Process each ticket and group by year
                    support.forEach(item => {
                        const year = getYear(item.ticket_created_at);
                        if (!yearlyMap[year]) {
                            yearlyMap[year] = {
                                year: year,
                                tat: Object.fromEntries(tatTypes.map(t => [t, []])),
                                months: {}
                            };
                        }

                        const cat = item.category?.toLowerCase() || "uncategorized";
                        const sub = item.sub_category || "Others";
                        const tat = item.tat;
                        const ticketId = item.ticket_id;
                        const month = getMonthName(item.ticket_created_at);

                        if (!tat || !tatTypes.includes(tat)) return;

                        // Add to year totals
                        if (yearlyMap[year].tat[tat]) {
                            yearlyMap[year].tat[tat].push(ticketId);
                        }

                        // Initialize month for this year if not exists
                        if (!yearlyMap[year].months[month]) {
                            yearlyMap[year].months[month] = {
                                month: month,
                                tat: Object.fromEntries(tatTypes.map(t => [t, []])),
                                categories: {}
                            };
                        }

                        // Add to month
                        if (yearlyMap[year].months[month].tat[tat]) {
                            yearlyMap[year].months[month].tat[tat].push(ticketId);
                        }

                        // Initialize category for this month if not exists
                        if (!yearlyMap[year].months[month].categories[cat]) {
                            yearlyMap[year].months[month].categories[cat] = {
                                category: cat,
                                tat: Object.fromEntries(tatTypes.map(t => [t, []])),
                                subCategories: {}
                            };
                        }

                        // Add to category
                        if (yearlyMap[year].months[month].categories[cat].tat[tat]) {
                            yearlyMap[year].months[month].categories[cat].tat[tat].push(ticketId);
                        }

                        // Initialize subcategory
                        if (!yearlyMap[year].months[month].categories[cat].subCategories[sub]) {
                            yearlyMap[year].months[month].categories[cat].subCategories[sub] = {
                                name: sub,
                                tat: Object.fromEntries(tatTypes.map(t => [t, []]))
                            };
                        }

                        // Add to subcategory
                        if (yearlyMap[year].months[month].categories[cat].subCategories[sub].tat[tat]) {
                            yearlyMap[year].months[month].categories[cat].subCategories[sub].tat[tat].push(ticketId);
                        }
                    });

                    // Convert to array and sort by year (descending)
                    const yearlyArray = Object.values(yearlyMap)
                        .sort((a, b) => b.year - a.year);

                    setYearlyData(yearlyArray);
                    setMonthlyData([]); // Clear monthly data
                    setRows([]); // Clear regular rows

                    // ===== SEND DATA TO PARENT =====
                    if (onDataReady) {
                        const summaryData = {
                            type: 'yearly',
                            data: yearlyArray,
                            summary: yearlyArray.map(year => ({
                                year: year.year,
                                total: getTotal(year.tat),
                                '30m': year.tat['30m']?.length || 0,
                                '1h': year.tat['1h']?.length || 0,
                                '2h': year.tat['2h']?.length || 0,
                                '1d': year.tat['1d']?.length || 0,
                                '2d': year.tat['2d']?.length || 0,
                                '3d': year.tat['3d']?.length || 0,
                                months: Object.keys(year.months).reduce((acc, month) => {
                                    acc[month] = getTotal(year.months[month].tat);
                                    return acc;
                                }, {})
                            }))
                        };
                        onDataReady(summaryData);
                    }

                } else {
                    // REGULAR VIEW - Group by category
                    const categories = ["hardware", "network", "software", "system", "uncategorized"];
                    const categoryMap = {};

                    categories.forEach(cat => {
                        categoryMap[cat] = {
                            category: cat,
                            tat: Object.fromEntries(tatTypes.map(t => [t, []])),
                            subCategories: {}
                        };
                    });

                    support.forEach(item => {
                        const cat = item.category?.toLowerCase() || "uncategorized";
                        const sub = item.sub_category || "Others";
                        const tat = item.tat;
                        const ticketId = item.ticket_id;

                        if (!tat || !tatTypes.includes(tat)) return;
                        if (!categoryMap[cat]) return;

                        // Add to category
                        if (categoryMap[cat].tat[tat]) {
                            categoryMap[cat].tat[tat].push(ticketId);
                        }

                        // Initialize subcategory
                        if (!categoryMap[cat].subCategories[sub]) {
                            categoryMap[cat].subCategories[sub] = {
                                name: sub,
                                tat: Object.fromEntries(tatTypes.map(t => [t, []]))
                            };
                        }

                        // Add to subcategory
                        if (categoryMap[cat].subCategories[sub].tat[tat]) {
                            categoryMap[cat].subCategories[sub].tat[tat].push(ticketId);
                        }
                    });

                    const finalRows = Object.values(categoryMap).filter(row => getTotal(row.tat) > 0);
                    setRows(finalRows);
                    setMonthlyData([]);
                    setYearlyData([]);

                    // ===== SEND DATA TO PARENT =====
                    if (onDataReady) {
                        const summaryData = {
                            type: 'regular',
                            data: finalRows,
                            summary: finalRows.map(row => ({
                                category: row.category,
                                total: getTotal(row.tat),
                                '30m': row.tat['30m']?.length || 0,
                                '1h': row.tat['1h']?.length || 0,
                                '2h': row.tat['2h']?.length || 0,
                                '1d': row.tat['1d']?.length || 0,
                                '2d': row.tat['2d']?.length || 0,
                                '3d': row.tat['3d']?.length || 0,
                                subcategories: Object.entries(row.subCategories).map(([name, data]) => ({
                                    name: name,
                                    total: getTotal(data.tat),
                                    '30m': data.tat['30m']?.length || 0,
                                    '1h': data.tat['1h']?.length || 0,
                                    '2h': data.tat['2h']?.length || 0,
                                    '1d': data.tat['1d']?.length || 0,
                                    '2d': data.tat['2d']?.length || 0,
                                    '3d': data.tat['3d']?.length || 0
                                }))
                            }))
                        };
                        onDataReady(summaryData);
                    }
                }

            } catch (err) {
                console.log("Error loading TAT:", err);
                if (onDataReady) {
                    onDataReady({ type: 'error', error: err.message });
                }
            }
        };

        fetchData();
    }, [filterType, location, onDataReady]);

    // ===== TABLE LOGIC =====
    const toggleCategory = category => {
        setExpandedCategory(prev => (prev === category ? null : category));
    };

    const grandTotals = tatTypes.reduce((acc, t) => {
        acc[t] = rows.reduce((sum, row) => sum + (row.tat[t]?.length || 0), 0);
        return acc;
    }, {});

    const grandTotalAll = Object.values(grandTotals).reduce(
        (sum, val) => sum + val,
        0
    );

    // ===== MONTHLY GRAND TOTALS =====
    const getMonthlyGrandTotals = () => {
        if (!monthlyData.length) return {};
        return monthlyData.reduce((acc, month) => {
            acc[month.month] = tatTypes.reduce((total, t) => {
                return total + (month.tat[t]?.length || 0);
            }, 0);
            return acc;
        }, {});
    };

    // ===== CHART COLORS =====
    const tatColors = {
        "30m": "rgba(75, 192, 192, 0.7)",
        "1h": "rgba(54, 162, 235, 0.7)",
        "2h": "rgba(153, 102, 255, 0.7)",
        "1d": "rgba(255, 159, 64, 0.7)",
        "2d": "rgba(255, 99, 132, 0.7)",
        "3d": "rgba(201, 203, 207, 0.7)"
    };

    // Category chart data based on filter type
    const getCategoryChartData = () => {
        if (filterType === "perMonth" && monthlyData.length > 0) {
            return {
                labels: monthlyData.map(m => m.month),
                datasets: ["hardware", "network", "software", "system"].map((category, index) => ({
                    label: category,
                    data: monthlyData.map(month => {
                        const catData = month.categories[category];
                        return catData ? getTotal(catData.tat) : 0;
                    }),
                    backgroundColor: `hsl(${index * 90}, 70%, 60%)`,
                    borderColor: `hsl(${index * 90}, 70%, 50%)`,
                    borderWidth: 1
                }))
            };
        } else if (filterType === "perYear" && yearlyData.length > 0) {
            return {
                labels: yearlyData.map(y => y.year),
                datasets: ["hardware", "network", "software", "system"].map((category, index) => ({
                    label: category,
                    data: yearlyData.map(year => {
                        // Aggregate category totals across all months in the year
                        let total = 0;
                        Object.values(year.months).forEach(month => {
                            const catData = month.categories[category];
                            if (catData) {
                                total += getTotal(catData.tat);
                            }
                        });
                        return total;
                    }),
                    backgroundColor: `hsl(${index * 90}, 70%, 60%)`,
                    borderColor: `hsl(${index * 90}, 70%, 50%)`,
                    borderWidth: 1
                }))
            };
        } else {
            return {
                labels: tatTypes,
                datasets: rows.map((row, index) => ({
                    label: row.category,
                    data: tatTypes.map(tat => row.tat[tat]?.length || 0),
                    backgroundColor: `hsl(${index * 90}, 70%, 60%)`,
                    borderColor: `hsl(${index * 90}, 70%, 50%)`,
                    borderWidth: 1
                }))
            };
        }
    };

    // Subcategory chart data based on filter type
    const getSubcategoryChartData = (category, subs) => {
        if (filterType === "perMonth" && monthlyData.length > 0) {
            return {
                labels: monthlyData.map(m => m.month),
                datasets: subs.map((sub, index) => ({
                    label: sub.name,
                    data: monthlyData.map(month => {
                        const catData = month.categories[category];
                        if (catData && catData.subCategories[sub.name]) {
                            return getTotal(catData.subCategories[sub.name].tat);
                        }
                        return 0;
                    }),
                    backgroundColor: `hsl(${index * 60}, 70%, 60%)`,
                    borderColor: `hsl(${index * 60}, 70%, 50%)`,
                    borderWidth: 1
                }))
            };
        } else if (filterType === "perYear" && yearlyData.length > 0) {
            return {
                labels: yearlyData.map(y => y.year),
                datasets: subs.map((sub, index) => ({
                    label: sub.name,
                    data: yearlyData.map(year => {
                        // Aggregate subcategory totals across all months in the year
                        let total = 0;
                        Object.values(year.months).forEach(month => {
                            const catData = month.categories[category];
                            if (catData && catData.subCategories[sub.name]) {
                                total += getTotal(catData.subCategories[sub.name].tat);
                            }
                        });
                        return total;
                    }),
                    backgroundColor: `hsl(${index * 60}, 70%, 60%)`,
                    borderColor: `hsl(${index * 60}, 70%, 50%)`,
                    borderWidth: 1
                }))
            };
        } else {
            return {
                labels: tatTypes,
                datasets: subs.map((sub, index) => ({
                    label: sub.name,
                    data: tatTypes.map(tat => sub.tat[tat]?.length || 0),
                    backgroundColor: `hsl(${index * 60}, 70%, 60%)`,
                    borderColor: `hsl(${index * 60}, 70%, 50%)`,
                    borderWidth: 1
                }))
            };
        }
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: {
                position: "top",
                labels: {
                    boxWidth: 12,
                    padding: 15
                }
            },
            title: {
                display: true,
                font: { size: 16 }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value} tickets`;
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: false,
                beginAtZero: true,
                title: {
                    display: true,
                    text: filterType === "perMonth" ? 'Number of Tickets per Month' :
                        filterType === "perYear" ? 'Number of Tickets per Year' : 'Number of Tickets'
                }
            },
            y: {
                stacked: false,
                beginAtZero: true,
                title: {
                    display: true,
                    text: filterType === "perMonth" ? 'Months' :
                        filterType === "perYear" ? 'Years' : 'TAT Timeframes'
                }
            }
        }
    };

    // Get filter display name
    const getFilterDisplayName = () => {
        switch (filterType) {
            case "thisMonth":
                return `This Month (${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})`;
            case "today":
                return `Today (${new Date().toLocaleDateString()})`;
            case "thisWeek":
                return "This Week";
            case "lastWeek":
                return "Last Week";
            case "perMonth":
                return `Monthly View - ${new Date().getFullYear()}`;
            case "perYear":
                return "Yearly View - All Years";
            case "all":
                return "All Time";
            default:
                return filterType;
        }
    };

    return (
        <div>
            {/* CHART CONTROLS */}
            {showChart && (
                <div style={{


                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "5px"
                }}>
                    {/* Centered Title */}
                    <h4 style={{
                        margin: 0,
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)"
                    }}>
                        {viewMode === "category"
                            ? (filterType === "perMonth"
                                ? `Monthly Ticket Distribution - ${new Date().getFullYear()}`
                                : filterType === "perYear"
                                    ? "Yearly Ticket Distribution - All Years"
                                    : `TAT per Category - ${getFilterDisplayName()}`)
                            : (filterType === "perMonth"
                                ? "Monthly Sub-category Distribution"
                                : filterType === "perYear"
                                    ? "Yearly Sub-category Distribution"
                                    : "TAT per Sub-category")}
                    </h4>

                    {/* Button on the Right */}
                    <div style={{
                        marginLeft: "auto",
                        display: "flex",
                        justifyContent: "flex-end"
                    }}>
                        <Button
                            onClick={() =>
                                setViewMode(
                                    viewMode === "category"
                                        ? "subcategory"
                                        : "category"
                                )
                            }
                            style={{ padding: "8px 14px", cursor: "pointer" }}
                        >
                            Switch to{" "}
                            {viewMode === "category"
                                ? "Sub-category"
                                : "Category"}{" "}
                            View
                        </Button>
                    </div>
                </div>
            )}

            {/* REGULAR CATEGORY TABLE - Show for regular filter types */}
            {!showChart && filterType !== "perMonth" && filterType !== "perYear" && (
                <>
                    <table
                        style={{
                            width: "100%",
                            height: "100%",
                            borderCollapse: "collapse"
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#0d3f00", color: "#fff" }}>
                                <th style={th}>Category</th>
                                <th style={th}>30 minutes</th>
                                <th style={th}>1 hour</th>
                                <th style={th}>2 hours</th>
                                <th style={th}>1 day</th>
                                <th style={th}>2 days</th>
                                <th style={th}>3 days</th>
                                <th style={th}>Total</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row, i) => (
                                <React.Fragment key={i}>
                                    <tr
                                        onClick={() =>
                                            toggleCategory(row.category)
                                        }
                                        style={{
                                            cursor: "pointer",
                                            background: "#f9f9f9",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        <td
                                            style={{
                                                ...td,
                                                textAlign: "start",
                                                paddingLeft: "10px"
                                            }}
                                        >
                                            {row.category}
                                        </td>
                                        {tatTypes.map(t => (
                                            <td
                                                key={t}
                                                style={td}
                                                title={getTicketTitle(row.tat[t])}
                                            >
                                                {row.tat[t]?.length || 0}
                                            </td>
                                        ))}

                                        <td style={{ ...td, fontWeight: "bold" }}>
                                            {getTotal(row.tat)}
                                        </td>
                                    </tr>

                                    {expandedCategory === row.category &&
                                        Object.values(row.subCategories).map(
                                            (sub, j) => (
                                                <tr
                                                    key={`${i}-${j}`}
                                                    style={{
                                                        background: "#ffffff"
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            ...td,
                                                            textAlign: "start",
                                                            paddingLeft: "30px"
                                                        }}
                                                    >
                                                        {sub.name}
                                                    </td>
                                                    {tatTypes.map(t => (
                                                        <td
                                                            key={t}
                                                            style={td}
                                                            title={getTicketTitle(sub.tat[t])}
                                                        >
                                                            {sub.tat[t]?.length || 0}
                                                        </td>
                                                    ))}

                                                    <td
                                                        style={{
                                                            ...td,
                                                            fontWeight: "bold"
                                                        }}
                                                    >
                                                        {getTotal(sub.tat)}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                </React.Fragment>
                            ))}

                            {/* GRAND TOTAL ROW */}
                            {rows.length > 0 && (
                                <tr
                                    style={{
                                        background: "#e8f5e9",
                                        fontWeight: "bold"
                                    }}
                                >
                                    <td style={{ ...td, textAlign: "start" }}>
                                        TOTAL
                                    </td>
                                    {tatTypes.map(t => (
                                        <td key={t} style={td}>
                                            {grandTotals[t]}
                                        </td>
                                    ))}
                                    <td style={td}>{grandTotalAll}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* EMPTY STATE */}
                    {rows.length === 0 && (
                        <div style={{
                            textAlign: "center",
                            padding: "40px",
                            backgroundColor: "#f9f9f9",
                            border: "1px solid #ddd",
                            borderRadius: "4px",

                        }}>
                            <h4>No tickets found for {getFilterDisplayName()}</h4>
                            <p style={{ color: "#666" }}>Try changing the filter or check back later.</p>
                        </div>
                    )}
                </>
            )}

            {/* MONTHLY SUMMARY TABLE - Show for perMonth filter */}
            {!showChart && filterType === "perMonth" && (
                <div>
                    <h4>Monthly Summary - {new Date().getFullYear()}</h4>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#0d3f00", color: "#fff" }}>
                                <th style={th}>Month</th>
                                <th style={th}>30 minutes</th>
                                <th style={th}>1 hour</th>
                                <th style={th}>2 hours</th>
                                <th style={th}>1 day</th>
                                <th style={th}>2 days</th>
                                <th style={th}>3 days</th>
                                <th style={th}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.length > 0 ? (
                                <>
                                    {monthlyData.map((month, index) => (
                                        <tr key={index} style={{ background: index % 2 === 0 ? "#f9f9f9" : "#ffffff" }}>
                                            <td style={{ ...td, textAlign: "start", fontWeight: "bold" }}>
                                                {month.month}
                                            </td>
                                            {tatTypes.map(t => (
                                                <td key={t} style={td} title={getTicketTitle(month.tat[t])}>
                                                    {month.tat[t]?.length || 0}
                                                </td>
                                            ))}
                                            <td style={{ ...td, fontWeight: "bold" }}>
                                                {getTotal(month.tat)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Grand Total Row */}
                                    <tr style={{ background: "#e8f5e9", fontWeight: "bold" }}>
                                        <td style={{ ...td, textAlign: "start" }}>TOTAL</td>
                                        {tatTypes.map(t => (
                                            <td key={t} style={td}>
                                                {monthlyData.reduce((sum, month) => sum + (month.tat[t]?.length || 0), 0)}
                                            </td>
                                        ))}
                                        <td style={td}>
                                            {monthlyData.reduce((sum, month) => sum + getTotal(month.tat), 0)}
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ ...td, textAlign: "center", padding: "40px" }}>
                                        <h4>No tickets found for {getFilterDisplayName()}</h4>
                                        <p style={{ color: "#666" }}>Try changing the filter or check back later.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* YEARLY SUMMARY TABLE - Show for perYear filter */}
            {!showChart && filterType === "perYear" && (
                <div>
                    <h4>Yearly Summary - All Years</h4>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse"
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#0d3f00", color: "#fff" }}>
                                <th style={th}>Year</th>
                                <th style={th}>30 minutes</th>
                                <th style={th}>1 hour</th>
                                <th style={th}>2 hours</th>
                                <th style={th}>1 day</th>
                                <th style={th}>2 days</th>
                                <th style={th}>3 days</th>
                                <th style={th}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {yearlyData.length > 0 ? (
                                <>
                                    {yearlyData.map((year, index) => (
                                        <tr key={index} style={{ background: index % 2 === 0 ? "#f9f9f9" : "#ffffff" }}>
                                            <td style={{ ...td, textAlign: "start", fontWeight: "bold" }}>
                                                {year.year}
                                            </td>
                                            {tatTypes.map(t => (
                                                <td key={t} style={td} title={getTicketTitle(year.tat[t])}>
                                                    {year.tat[t]?.length || 0}
                                                </td>
                                            ))}
                                            <td style={{ ...td, fontWeight: "bold" }}>
                                                {getTotal(year.tat)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Grand Total Row */}
                                    <tr style={{ background: "#e8f5e9", fontWeight: "bold" }}>
                                        <td style={{ ...td, textAlign: "start" }}>TOTAL</td>
                                        {tatTypes.map(t => (
                                            <td key={t} style={td}>
                                                {yearlyData.reduce((sum, year) => sum + (year.tat[t]?.length || 0), 0)}
                                            </td>
                                        ))}
                                        <td style={td}>
                                            {yearlyData.reduce((sum, year) => sum + getTotal(year.tat), 0)}
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ ...td, textAlign: "center", padding: "40px" }}>
                                        <h4>No tickets found for {getFilterDisplayName()}</h4>
                                        <p style={{ color: "#666" }}>Try changing the filter or check back later.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Expandable Monthly Details */}
                    {yearlyData.length > 0 && (
                        <div >
                            <h5>Monthly Details by Year</h5>
                            {yearlyData.map((year, yearIndex) => (
                                <div key={yearIndex} >
                                    <h6 style={{ color: "#0d3f00", borderBottom: "2px solid #0d3f00", paddingBottom: "5px" }}>
                                        {year.year}
                                    </h6>
                                    <table
                                        style={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                            marginTop: "10px"
                                        }}
                                    >
                                        <thead>
                                            <tr style={{ background: "#e8f5e9" }}>
                                                <th style={th}>Month</th>
                                                <th style={th}>30 minutes</th>
                                                <th style={th}>1 hour</th>
                                                <th style={th}>2 hours</th>
                                                <th style={th}>1 day</th>
                                                <th style={th}>2 days</th>
                                                <th style={th}>3 days</th>
                                                <th style={th}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthOrder.map((month, monthIndex) => {
                                                const monthData = year.months[month];
                                                if (!monthData || getTotal(monthData.tat) === 0) return null;
                                                return (
                                                    <tr key={monthIndex} style={{ background: monthIndex % 2 === 0 ? "#f9f9f9" : "#ffffff" }}>
                                                        <td style={{ ...td, textAlign: "start" }}>
                                                            {month}
                                                        </td>
                                                        {tatTypes.map(t => (
                                                            <td key={t} style={td} title={getTicketTitle(monthData.tat[t])}>
                                                                {monthData.tat[t]?.length || 0}
                                                            </td>
                                                        ))}
                                                        <td style={{ ...td, fontWeight: "bold" }}>
                                                            {getTotal(monthData.tat)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* CATEGORY CHART */}
            {showChart && viewMode === "category" && (
                <div style={{ width: "100%", height: filterType === "perMonth" || filterType === "perYear" ? "500px" : "400px" }}>
                    <Bar
                        data={getCategoryChartData()}
                        options={{
                            ...chartOptions,
                            plugins: {
                                ...chartOptions.plugins,
                                // title: {
                                //     ...chartOptions.plugins.title,
                                //     text: filterType === "perMonth"
                                //         ? `Monthly Ticket Distribution - ${new Date().getFullYear()}`
                                //         : filterType === "perYear"
                                //             ? "Yearly Ticket Distribution - All Years"
                                //             : `TAT per Category - ${getFilterDisplayName()}`
                                // }
                            }
                        }}
                    />
                </div>
            )}

            {/* SUBCATEGORY CHARTS */}
            {showChart && viewMode === "subcategory" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "50px",

                    }}
                >
                    {filterType === "perMonth" ? (
                        ["hardware", "network", "software", "system"].map((category, i) => {
                            const allSubs = new Set();
                            monthlyData.forEach(month => {
                                const catData = month.categories[category];
                                if (catData && catData.subCategories) {
                                    Object.keys(catData.subCategories).forEach(sub => allSubs.add(sub));
                                }
                            });

                            const subs = Array.from(allSubs).map(subName => ({
                                name: subName,
                            }));

                            if (subs.length === 0) return null;

                            const data = {
                                labels: monthlyData.map(m => m.month),
                                datasets: subs.map((sub, index) => ({
                                    label: sub.name,
                                    data: monthlyData.map(month => {
                                        const catData = month.categories[category];
                                        if (catData && catData.subCategories[sub.name]) {
                                            return getTotal(catData.subCategories[sub.name].tat);
                                        }
                                        return 0;
                                    }),
                                    backgroundColor: `hsl(${index * 60}, 70%, 60%)`,
                                    borderColor: `hsl(${index * 60}, 70%, 50%)`,
                                    borderWidth: 1
                                }))
                            };

                            return (
                                <div key={i} style={{ width: "100%", height: "400px" }}>
                                    <Bar
                                        data={data}
                                        options={{
                                            ...chartOptions,
                                            plugins: {
                                                ...chartOptions.plugins,
                                                title: {
                                                    ...chartOptions.plugins.title,
                                                    text: `${category} - Monthly Sub-category Distribution (${new Date().getFullYear()})`
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            );
                        })
                    ) : filterType === "perYear" ? (
                        ["hardware", "network", "software", "system"].map((category, i) => {
                            const allSubs = new Set();
                            yearlyData.forEach(year => {
                                Object.values(year.months).forEach(month => {
                                    const catData = month.categories[category];
                                    if (catData && catData.subCategories) {
                                        Object.keys(catData.subCategories).forEach(sub => allSubs.add(sub));
                                    }
                                });
                            });

                            const subs = Array.from(allSubs).map(subName => ({
                                name: subName,
                            }));

                            if (subs.length === 0) return null;

                            const data = {
                                labels: yearlyData.map(y => y.year),
                                datasets: subs.map((sub, index) => ({
                                    label: sub.name,
                                    data: yearlyData.map(year => {
                                        let total = 0;
                                        Object.values(year.months).forEach(month => {
                                            const catData = month.categories[category];
                                            if (catData && catData.subCategories[sub.name]) {
                                                total += getTotal(catData.subCategories[sub.name].tat);
                                            }
                                        });
                                        return total;
                                    }),
                                    backgroundColor: `hsl(${index * 60}, 70%, 60%)`,
                                    borderColor: `hsl(${index * 60}, 70%, 50%)`,
                                    borderWidth: 1
                                }))
                            };

                            return (
                                <div key={i} style={{ width: "100%", height: "400px" }}>
                                    <Bar
                                        data={data}
                                        options={{
                                            ...chartOptions,
                                            plugins: {
                                                ...chartOptions.plugins,
                                                title: {
                                                    ...chartOptions.plugins.title,
                                                    text: `${category} - Yearly Sub-category Distribution`
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            );
                        })
                    ) : (
                        rows.map((cat, i) => {
                            const subs = Object.values(cat.subCategories);
                            if (subs.length === 0) return null;

                            const data = getSubcategoryChartData(cat.category, subs);
                            const options = {
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    // title: {
                                    //     ...chartOptions.plugins.title,
                                    //     text: `TAT per Sub-category - ${cat.category} (${getFilterDisplayName()})`
                                    // }
                                }
                            };

                            return (
                                <div key={i} style={{ width: "100%", height: "400px" }}>
                                    <Bar data={data} options={options} />
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

const th = {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center",
    fontWeight: "bold"
};

const td = {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center"
};