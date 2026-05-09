import { useEffect, useState } from "react";
import axios from "axios";
import config from "config";
import { Table, Button, Form, Pagination } from "react-bootstrap";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import FeatherIcon from "feather-icons-react";

const PMSbyDept = ({ filterType, location, onDataReady, showChart = true, selectedYear = new Date().getFullYear() }) => {
    const [departments, setDepartments] = useState([]);
    const [deptCount, setDeptCount] = useState({});
    const [deptStatusCount, setDeptStatusCount] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);
    const [monthlyData, setMonthlyData] = useState([]);
    const [yearlyData, setYearlyData] = useState({});
    const [ticketsByDept, setTicketsByDept] = useState({});
    const [assetsMap, setAssetsMap] = useState({});

    // New state for year selection in perMonth view
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedYearForMonth, setSelectedYearForMonth] = useState(new Date().getFullYear());

    // New state for month selection in detailed view
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("all");

    // Filter states for detailed view
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [uniqueCategories, setUniqueCategories] = useState([]);

    // Filtered tickets for detailed view
    const [filteredTicketsByDept, setFilteredTicketsByDept] = useState({});

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(5); // Default set to 5, removed setter
    const [expandedDepartments, setExpandedDepartments] = useState({});

    // Month labels
    const monthLabels = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Excel Download Function
    const downloadExcel = () => {
        try {
            // Prepare data for Excel
            let excelData = [];

            if (filterType === "perYear") {
                // For perYear view - Group tickets by year
                Object.keys(yearlyData).sort((a, b) => b - a).forEach(year => {
                    const yearData = yearlyData[year];

                    // Add year header row
                    excelData.push([`Year ${year} - Total Tickets: ${yearData.yearTotal}`]);
                    excelData.push([]); // Empty row for spacing

                    // Get departments for this year
                    const departmentsToShow = selectedDepartment !== "all"
                        ? [selectedDepartment]
                        : yearData.departments;

                    departmentsToShow.forEach(dept => {
                        const deptTickets = ticketsByDept[dept] || [];
                        const yearDeptTickets = deptTickets.filter(ticket => {
                            const ticketYear = new Date(ticket.created_at).getFullYear();
                            return ticketYear === parseInt(year);
                        });

                        // Apply category filter
                        const filteredTickets = yearDeptTickets.filter(ticket => {
                            if (selectedCategory === "all") return true;
                            const category = getAssetCategory(ticket.tag_id);
                            return category === selectedCategory;
                        });

                        if (filteredTickets.length > 0) {
                            // Add department header
                            excelData.push([`${dept} Department (${filteredTickets.length} tickets)`]);

                            // Add headers
                            excelData.push(['Tag ID', 'Asset Category', 'PMS Ticket ID', 'Status', 'Assigned To', 'Requested By', 'Created At']);

                            // Add ticket data
                            filteredTickets.forEach(ticket => {
                                excelData.push([
                                    ticket.tag_id,
                                    getAssetCategory(ticket.tag_id),
                                    ticket.pmsticket_id,
                                    ticket.pms_status,
                                    ticket.assigned_to,
                                    ticket.pmsticket_for,
                                    new Date(ticket.created_at).toLocaleString()
                                ]);
                            });

                            excelData.push([]); // Empty row between departments
                        }
                    });

                    excelData.push([]); // Empty row between years
                    excelData.push([]); // Extra spacing
                });
            } else {
                // For regular view (non-perYear filters)
                if (Object.keys(filteredTicketsByDept).length > 0) {
                    Object.keys(filteredTicketsByDept).forEach(dept => {
                        const tickets = filteredTicketsByDept[dept];

                        if (tickets.length > 0) {
                            // Add department header
                            excelData.push([`${dept} Department (${tickets.length} tickets)`]);

                            // Add headers
                            excelData.push(['Tag ID', 'Asset Category', 'PMS Ticket ID', 'Status', 'Assigned To', 'Requested By', 'Created At']);

                            // Add ticket data
                            tickets.forEach(ticket => {
                                excelData.push([
                                    ticket.tag_id,
                                    getAssetCategory(ticket.tag_id),
                                    ticket.pmsticket_id,
                                    ticket.pms_status,
                                    ticket.assigned_to,
                                    ticket.pmsticket_for,
                                    new Date(ticket.created_at).toLocaleString()
                                ]);
                            });

                            excelData.push([]); // Empty row between departments
                        }
                    });
                }
            }

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(excelData);

            // Adjust column widths
            const colWidths = [
                { wch: 15 }, // Tag ID
                { wch: 20 }, // Asset Category
                { wch: 15 }, // PMS Ticket ID
                { wch: 15 }, // Status
                { wch: 20 }, // Assigned To
                { wch: 20 }, // Requested By
                { wch: 25 }  // Created At
            ];
            ws['!cols'] = colWidths;

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Tickets');

            // Generate filename with current date and filters
            const date = new Date();
            const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            const filterInfo = [];
            if (selectedCategory !== 'all') filterInfo.push(`cat-${selectedCategory}`);
            if (selectedDepartment !== 'all') filterInfo.push(`dept-${selectedDepartment}`);
            if (filterType === 'perYear' && selectedYear) filterInfo.push(`year-${selectedYear}`);
            if (filterType === 'perMonth' && selectedYearForMonth) filterInfo.push(`year-${selectedYearForMonth}`);
            if (filterType === 'perMonth' && selectedMonth !== 'all') filterInfo.push(`month-${monthLabels[selectedMonth]}`);

            const filename = `tickets_${dateStr}${filterInfo.length ? '_' + filterInfo.join('_') : ''}.xlsx`;

            // Save file
            XLSX.writeFile(wb, filename);

        } catch (error) {
            console.error('Error downloading Excel:', error);
            alert('Error downloading Excel file. Please try again.');
        }
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/pmsticket/get-all-pmsticket`);

                const res1 = await axios.get(`${config.baseApi}/pms/get-all-assets`);
                const data1 = res1.data || [];
                const active_assets = data1.filter(a => a.is_active === '1');

                // Create a map of tag_id to asset details for quick lookup
                const assetsByTagId = {};
                const categoriesSet = new Set();

                active_assets.forEach(asset => {
                    assetsByTagId[asset.tag_id] = asset;
                    if (asset.pms_category) {
                        categoriesSet.add(asset.pms_category);
                    }
                });
                setAssetsMap(assetsByTagId);

                // Get unique categories for filter dropdown
                setUniqueCategories(["all", ...Array.from(categoriesSet).sort()]);

                let tickets = res.data || [];

                // Filter by location
                if (location === "lmd")
                    tickets = tickets.filter(t => t.assigned_location === "lmd" && t.is_active === true);
                else if (location === "corp")
                    tickets = tickets.filter(t => t.assigned_location === "corp" && t.is_active === true);
                else if (location === "all")
                    tickets = tickets.filter(t => t.is_active === true);

                // Get all available years from tickets for the year filter dropdown
                const years = [...new Set(tickets.map(t => new Date(t.created_at).getFullYear()))].sort((a, b) => b - a);
                setAvailableYears(years);

                // Set default selected year to the most recent year if available
                if (years.length > 0 && !years.includes(selectedYearForMonth)) {
                    setSelectedYearForMonth(years[0]);
                }

                const now = new Date();

                // Filter by date range
                let filteredTickets = [...tickets];

                if (filterType === "today") {
                    filteredTickets = tickets.filter(t => new Date(t.created_at).toDateString() === now.toDateString());
                } else if (filterType === "thisWeek") {
                    const start = new Date(now);
                    start.setDate(now.getDate() - now.getDay());
                    filteredTickets = tickets.filter(t => {
                        const d = new Date(t.created_at);
                        return d >= start && d <= now;
                    });
                } else if (filterType === "lastWeek") {
                    const start = new Date(now);
                    start.setDate(now.getDate() - now.getDay() - 7);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    filteredTickets = tickets.filter(t => {
                        const d = new Date(t.created_at);
                        return d >= start && d <= end;
                    });
                } else if (filterType === "thisMonth") {
                    filteredTickets = tickets.filter(t => {
                        const d = new Date(t.created_at);
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    });
                } else if (filterType === "perMonth") {
                    // For perMonth view, filter by selected year from dropdown
                    filteredTickets = tickets.filter(t =>
                        new Date(t.created_at).getFullYear() === selectedYearForMonth
                    );

                    // Get available months for the selected year
                    const monthsInYear = [...new Set(
                        filteredTickets.map(t => new Date(t.created_at).getMonth())
                    )].sort((a, b) => a - b);
                    setAvailableMonths(monthsInYear);

                    // Reset month selection if current selection is not available
                    if (selectedMonth !== 'all' && !monthsInYear.includes(selectedMonth)) {
                        setSelectedMonth('all');
                    }
                } else if (filterType === "perYear") {
                    // For perYear view, we don't filter by selected year here
                    // We want all years data
                    filteredTickets = tickets;
                }

                // Map user → department
                const uniqueUsernames = [...new Set(filteredTickets.map(ticket => ticket.pmsticket_for))];
                const userRequests = uniqueUsernames.map(username =>
                    axios.get(`${config.baseApi}/authentication/get-by-username`, {
                        params: { user_name: username },
                    })
                );
                const responses = await Promise.all(userRequests);
                const userDataArray = responses.map(res => res.data);

                const userDeptMap = {};
                userDataArray.forEach(user => {
                    userDeptMap[user.user_name] = user.emp_department;
                });

                // Group tickets by department for detailed view
                const ticketsGrouped = {};
                filteredTickets.forEach(ticket => {
                    const dept = userDeptMap[ticket.pmsticket_for];
                    if (dept) {
                        ticketsGrouped[dept] = ticketsGrouped[dept] || [];
                        ticketsGrouped[dept].push(ticket);
                    }
                });
                setTicketsByDept(ticketsGrouped);
                setFilteredTicketsByDept(ticketsGrouped); // Initialize filtered data

                // Calculate summary data for charts/tables
                const deptCountTemp = {};
                const deptStatusCountTemp = {};
                let total = 0;

                filteredTickets.forEach(ticket => {
                    const dept = userDeptMap[ticket.pmsticket_for];
                    if (dept) {
                        // Total tickets count
                        deptCountTemp[dept] = (deptCountTemp[dept] || 0) + 1;

                        // Status-wise count
                        if (!deptStatusCountTemp[dept]) {
                            deptStatusCountTemp[dept] = {
                                open: 0,
                                inprogress: 0,
                                assigned: 0,
                                resolved: 0,
                                closed: 0
                            };
                        }

                        const status = ticket.pms_status?.toLowerCase() || '';
                        if (status.includes('open')) {
                            deptStatusCountTemp[dept].open++;
                        } else if (status.includes('progress')) {
                            deptStatusCountTemp[dept].inprogress++;
                        } else if (status.includes('assigned')) {
                            deptStatusCountTemp[dept].assigned++;
                        } else if (status.includes('resolved')) {
                            deptStatusCountTemp[dept].resolved++;
                        } else if (status.includes('closed') || status.includes('close')) {
                            deptStatusCountTemp[dept].closed++;
                        }

                        total++;
                    }
                });

                setDeptCount(deptCountTemp);
                setDeptStatusCount(deptStatusCountTemp);
                setDepartments(Object.keys(deptCountTemp));
                setGrandTotal(total);

                // Handle perMonth view for summary
                if (filterType === "perMonth") {
                    const monthSummary = {};

                    filteredTickets.forEach(ticket => {
                        const d = new Date(ticket.created_at);
                        const month = d.getMonth();
                        const dept = userDeptMap[ticket.pmsticket_for];
                        if (!dept) return;

                        if (!monthSummary[month]) {
                            monthSummary[month] = {
                                deptCount: {},
                                deptStatusCount: {},
                                grandTotal: 0
                            };
                        }

                        // Total tickets count
                        monthSummary[month].deptCount[dept] =
                            (monthSummary[month].deptCount[dept] || 0) + 1;

                        // Status-wise count
                        if (!monthSummary[month].deptStatusCount[dept]) {
                            monthSummary[month].deptStatusCount[dept] = {
                                open: 0,
                                inprogress: 0,
                                assigned: 0,
                                resolved: 0,
                                closed: 0
                            };
                        }

                        const status = ticket.pms_status?.toLowerCase() || '';
                        if (status.includes('open')) {
                            monthSummary[month].deptStatusCount[dept].open++;
                        } else if (status.includes('progress')) {
                            monthSummary[month].deptStatusCount[dept].inprogress++;
                        } else if (status.includes('assigned')) {
                            monthSummary[month].deptStatusCount[dept].assigned++;
                        } else if (status.includes('resolved')) {
                            monthSummary[month].deptStatusCount[dept].resolved++;
                        } else if (status.includes('closed') || status.includes('close')) {
                            monthSummary[month].deptStatusCount[dept].closed++;
                        }

                        monthSummary[month].grandTotal++;
                    });

                    // Get departments that actually have data in this month
                    const summary = monthLabels.map((label, idx) => {
                        const monthData = monthSummary[idx] || {
                            deptCount: {},
                            deptStatusCount: {},
                            grandTotal: 0
                        };

                        // Only include departments that have data for this month
                        const departmentsWithData = Object.keys(monthData.deptCount);

                        return {
                            month: label,
                            monthIndex: idx,
                            departments: departmentsWithData,
                            deptCount: monthData.deptCount,
                            deptStatusCount: monthData.deptStatusCount,
                            grandTotal: monthData.grandTotal,
                        };
                    });

                    setMonthlyData(summary);
                }

                // Handle perYear view for summary
                if (filterType === "perYear") {
                    const yearMonthSummary = {};

                    filteredTickets.forEach(ticket => {
                        const d = new Date(ticket.created_at);
                        const year = d.getFullYear();
                        const month = d.getMonth();
                        const dept = userDeptMap[ticket.pmsticket_for];
                        if (!dept) return;

                        // Initialize year
                        if (!yearMonthSummary[year]) {
                            yearMonthSummary[year] = {
                                months: {},
                                yearTotal: 0,
                                departments: new Set()
                            };
                        }

                        // Initialize month
                        if (!yearMonthSummary[year].months[month]) {
                            yearMonthSummary[year].months[month] = {
                                deptCount: {},
                                deptStatusCount: {},
                                grandTotal: 0
                            };
                        }

                        // Add department to year's department set
                        yearMonthSummary[year].departments.add(dept);

                        // Total tickets count for month
                        yearMonthSummary[year].months[month].deptCount[dept] =
                            (yearMonthSummary[year].months[month].deptCount[dept] || 0) + 1;

                        // Status-wise count for month
                        if (!yearMonthSummary[year].months[month].deptStatusCount[dept]) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept] = {
                                open: 0,
                                inprogress: 0,
                                assigned: 0,
                                resolved: 0,
                                closed: 0
                            };
                        }

                        const status = ticket.pms_status?.toLowerCase() || '';
                        if (status.includes('open')) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept].open++;
                        } else if (status.includes('progress')) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept].inprogress++;
                        } else if (status.includes('assigned')) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept].assigned++;
                        } else if (status.includes('resolved')) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept].resolved++;
                        } else if (status.includes('closed') || status.includes('close')) {
                            yearMonthSummary[year].months[month].deptStatusCount[dept].closed++;
                        }

                        yearMonthSummary[year].months[month].grandTotal++;
                        yearMonthSummary[year].yearTotal++;
                    });

                    // Transform the data for display
                    const transformedYearlyData = {};

                    Object.keys(yearMonthSummary).sort((a, b) => b - a).forEach(year => {
                        const yearData = yearMonthSummary[year];
                        const departmentsArray = [...yearData.departments].sort();

                        transformedYearlyData[year] = {
                            departments: departmentsArray,
                            yearTotal: yearData.yearTotal,
                            months: monthLabels.map((label, monthIdx) => {
                                const monthData = yearData.months[monthIdx] || {
                                    deptCount: {},
                                    deptStatusCount: {},
                                    grandTotal: 0
                                };

                                // Only include departments that have data for this month
                                const departmentsWithData = Object.keys(monthData.deptCount);

                                return {
                                    month: label,
                                    departments: departmentsWithData,
                                    deptCount: monthData.deptCount,
                                    deptStatusCount: monthData.deptStatusCount,
                                    grandTotal: monthData.grandTotal
                                };
                            })
                        };
                    });

                    setYearlyData(transformedYearlyData);
                }

                onDataReady &&
                    onDataReady({
                        departments: Object.keys(deptCountTemp),
                        deptCount: deptCountTemp,
                        deptStatusCount: deptStatusCountTemp,
                        grandTotal: total,
                    });

            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };

        fetch();
    }, [filterType, location, onDataReady, selectedYear, selectedYearForMonth]);

    // Apply filters to detailed view
    useEffect(() => {
        applyDetailedFilters();
        // Reset pagination when filters change
        setCurrentPage(1);
        setExpandedDepartments({});
    }, [selectedCategory, selectedDepartment, selectedYearForMonth, selectedMonth, ticketsByDept, assetsMap]);

    // Helper function to get asset category by tag_id
    const getAssetCategory = (tagId) => {
        if (assetsMap[tagId]) {
            return assetsMap[tagId].pms_category || '-';
        }
        return '-';
    };

    // Apply filters to detailed view only
    const applyDetailedFilters = () => {
        let filteredTickets = {};

        // Determine which departments to process
        const deptsToProcess = selectedDepartment !== "all"
            ? [selectedDepartment]
            : Object.keys(ticketsByDept);

        deptsToProcess.forEach(dept => {
            const deptTickets = ticketsByDept[dept] || [];

            // Apply filters
            const filtered = deptTickets.filter(ticket => {
                // Category filter
                if (selectedCategory !== "all") {
                    const category = getAssetCategory(ticket.tag_id);
                    if (category !== selectedCategory) return false;
                }

                // Month filter (for perMonth view only)
                if (filterType === "perMonth" && selectedMonth !== "all") {
                    const ticketMonth = new Date(ticket.created_at).getMonth();
                    if (ticketMonth !== selectedMonth) return false;
                }

                return true;
            });

            if (filtered.length > 0) {
                filteredTickets[dept] = filtered;
            }
        });

        setFilteredTicketsByDept(filteredTickets);
    };

    // Reset filters
    const resetFilters = () => {
        setSelectedCategory("all");
        setSelectedDepartment("all");
        setSelectedMonth("all");
        setCurrentPage(1);
    };

    // Calculate status totals for footer
    const calculateStatusTotals = (statusData) => {
        let openTotal = 0, inprogressTotal = 0, assignedTotal = 0, resolvedTotal = 0, closedTotal = 0;

        Object.values(statusData).forEach(deptStatus => {
            openTotal += deptStatus.open || 0;
            inprogressTotal += deptStatus.inprogress || 0;
            assignedTotal += deptStatus.assigned || 0;
            resolvedTotal += deptStatus.resolved || 0;
            closedTotal += deptStatus.closed || 0;
        });

        return { openTotal, inprogressTotal, assignedTotal, resolvedTotal, closedTotal };
    };

    // Pagination helper functions
    const getPaginatedData = (data, page) => {
        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return data.slice(startIndex, endIndex);
    };

    const toggleDepartment = (deptKey) => {
        setExpandedDepartments(prev => ({
            ...prev,
            [deptKey]: !prev[deptKey]
        }));
        // Reset to page 1 when expanding/collapsing
        setCurrentPage(1);
    };

    // Render pagination component
    const renderPagination = (totalItems, deptKey) => {
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

    // Render summary for perMonth view
    const renderPerMonthSummary = () => {
        const hasAnyData = monthlyData.some(month => month.departments.length > 0);

        if (!hasAnyData) {
            return (
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <p>No data available for the selected year</p>
                </div>
            );
        }

        return (
            <div style={{ width: "100%", maxWidth: "100vw", overflowX: "auto" }}>
                {monthlyData.map((month, idx) => {
                    if (month.departments.length === 0) return null;

                    const totals = calculateStatusTotals(month.deptStatusCount);

                    return (
                        <div key={idx} style={{ marginBottom: "30px" }}>
                            <h6 style={{ marginBottom: "10px", fontWeight: "bold" }}>{month.month}</h6>
                            <Table
                                striped
                                bordered
                                hover

                                responsive
                                className="summary-table"
                                style={{ tableLayout: "fixed", width: "100%" }}
                            >
                                <thead>
                                    <tr>
                                        <th style={{ width: "20%", wordWrap: "break-word" }}>Department</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Open</th>
                                        <th style={{ width: "12%", textAlign: "center" }}>In Progress</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Assigned</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Resolved</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Closed</th>
                                        <th style={{ width: "10%", textAlign: "center" }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {month.departments.map(dept => (
                                        <tr key={dept}>
                                            <td>{dept}</td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptStatusCount[dept]?.open || 0}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptStatusCount[dept]?.inprogress || 0}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptStatusCount[dept]?.assigned || 0}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptStatusCount[dept]?.resolved || 0}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptStatusCount[dept]?.closed || 0}
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                {month.deptCount[dept] || 0}
                                            </td>
                                        </tr>
                                    ))}
                                    {month.grandTotal > 0 && (
                                        <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                                            <td>Total</td>
                                            <td style={{ textAlign: "center" }}>{totals.openTotal}</td>
                                            <td style={{ textAlign: "center" }}>{totals.inprogressTotal}</td>
                                            <td style={{ textAlign: "center" }}>{totals.assignedTotal}</td>
                                            <td style={{ textAlign: "center" }}>{totals.resolvedTotal}</td>
                                            <td style={{ textAlign: "center" }}>{totals.closedTotal}</td>
                                            <td style={{ textAlign: "center" }}>{month.grandTotal}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render summary for perYear view - FIXED VERSION
    const renderPerYearSummary = () => {
        const yearsWithData = Object.keys(yearlyData).sort((a, b) => b - a); // Sort descending (newest first)

        if (yearsWithData.length === 0) {
            return (
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <p>No data available for any year</p>
                </div>
            );
        }

        return (
            <div style={{ width: "100%", maxWidth: "100vw", overflowX: "auto" }}>
                {yearsWithData.map(year => {
                    const yearData = yearlyData[year];
                    const yearTotals = calculateYearTotals(yearData);

                    return (
                        <div key={year} style={{ marginBottom: "40px" }}>
                            <h5 style={{
                                marginBottom: "15px",
                                fontWeight: "bold",
                                color: "#0066cc",
                                borderBottom: "2px solid #0066cc",
                                paddingBottom: "5px"
                            }}>
                                Year {year} - Total Tickets: {yearData.yearTotal}
                            </h5>

                            {yearData.months.map((month, monthIdx) => {
                                if (month.departments.length === 0) return null;

                                const monthTotals = calculateStatusTotals(month.deptStatusCount);

                                return (
                                    <div key={monthIdx} style={{ marginBottom: "25px", marginLeft: "20px" }}>
                                        <h6 style={{ marginBottom: "8px", fontWeight: "bold", color: "#555" }}>
                                            {month.month} (Total: {month.grandTotal})
                                        </h6>
                                        <Table
                                            striped
                                            bordered
                                            hover

                                            responsive
                                            className="summary-table"
                                            style={{ tableLayout: "fixed", width: "100%", marginBottom: "15px" }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "20%", wordWrap: "break-word" }}>Department</th>
                                                    <th style={{ width: "10%", textAlign: "center" }}>Open</th>
                                                    <th style={{ width: "12%", textAlign: "center" }}>In Progress</th>
                                                    <th style={{ width: "10%", textAlign: "center" }}>Assigned</th>
                                                    <th style={{ width: "10%", textAlign: "center" }}>Resolved</th>
                                                    <th style={{ width: "10%", textAlign: "center" }}>Closed</th>
                                                    <th style={{ width: "10%", textAlign: "center" }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {month.departments.map(dept => (
                                                    <tr key={dept}>
                                                        <td>{dept}</td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptStatusCount[dept]?.open || 0}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptStatusCount[dept]?.inprogress || 0}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptStatusCount[dept]?.assigned || 0}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptStatusCount[dept]?.resolved || 0}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptStatusCount[dept]?.closed || 0}
                                                        </td>
                                                        <td style={{ textAlign: "center" }}>
                                                            {month.deptCount[dept] || 0}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                                                    <td>Monthly Total</td>
                                                    <td style={{ textAlign: "center" }}>{monthTotals.openTotal}</td>
                                                    <td style={{ textAlign: "center" }}>{monthTotals.inprogressTotal}</td>
                                                    <td style={{ textAlign: "center" }}>{monthTotals.assignedTotal}</td>
                                                    <td style={{ textAlign: "center" }}>{monthTotals.resolvedTotal}</td>
                                                    <td style={{ textAlign: "center" }}>{monthTotals.closedTotal}</td>
                                                    <td style={{ textAlign: "center" }}>{month.grandTotal}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                );
                            })}

                            {/* Yearly Summary for each year */}
                            <div style={{
                                marginTop: "15px",
                                marginLeft: "20px",
                                backgroundColor: "#f8f9fa",
                                padding: "15px",
                                borderRadius: "5px",
                                borderLeft: "4px solid #0066cc"
                            }}>
                                <h6 style={{ fontWeight: "bold", color: "#000" }}>Year {year} - Yearly Summary</h6>
                                <Table striped bordered style={{ width: "auto", minWidth: "50%", marginTop: "10px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#e9ecef" }}>
                                            <th>Status</th>
                                            <th style={{ textAlign: "center" }}>Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Open</td><td style={{ textAlign: "center" }}>{yearTotals.open}</td></tr>
                                        <tr><td>In Progress</td><td style={{ textAlign: "center" }}>{yearTotals.inprogress}</td></tr>
                                        <tr><td>Assigned</td><td style={{ textAlign: "center" }}>{yearTotals.assigned}</td></tr>
                                        <tr><td>Resolved</td><td style={{ textAlign: "center" }}>{yearTotals.resolved}</td></tr>
                                        <tr><td>Closed</td><td style={{ textAlign: "center" }}>{yearTotals.closed}</td></tr>
                                        <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                                            <td>Total</td>
                                            <td style={{ textAlign: "center" }}>{yearTotals.total}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Calculate yearly totals
    const calculateYearTotals = (yearData) => {
        let openTotal = 0, inprogressTotal = 0, assignedTotal = 0, resolvedTotal = 0, closedTotal = 0;

        yearData.months.forEach(month => {
            Object.values(month.deptStatusCount).forEach(deptStatus => {
                openTotal += deptStatus.open || 0;
                inprogressTotal += deptStatus.inprogress || 0;
                assignedTotal += deptStatus.assigned || 0;
                resolvedTotal += deptStatus.resolved || 0;
                closedTotal += deptStatus.closed || 0;
            });
        });

        return {
            open: openTotal,
            inprogress: inprogressTotal,
            assigned: assignedTotal,
            resolved: resolvedTotal,
            closed: closedTotal,
            total: yearData.yearTotal
        };
    };

    // Main render
    const totals = calculateStatusTotals(deptStatusCount);

    return (
        <div style={{ width: "100%", maxWidth: "100vw", overflowX: "auto", height: "100%", overflowY: "auto" }}>

            {/* Show Summary based on filter type */}
            {showChart && (
                <>
                    {filterType === "perMonth" && (
                        <>
                            {/* Year Filter Dropdown for perMonth view */}

                            {renderPerMonthSummary()}
                        </>
                    )}
                    {filterType === "perYear" && renderPerYearSummary()}
                    {filterType !== "perMonth" && filterType !== "perYear" && (
                        <Table
                            striped
                            bordered
                            hover

                            responsive
                            className="summary-table"
                            style={{ tableLayout: "fixed", width: "100%", height: "100%" }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ width: "20%", wordWrap: "break-word" }}>Department</th>
                                    <th style={{ width: "10%", textAlign: "center" }}>Open</th>
                                    <th style={{ width: "12%", textAlign: "center" }}>In Progress</th>
                                    <th style={{ width: "10%", textAlign: "center" }}>Assigned</th>
                                    <th style={{ width: "10%", textAlign: "center" }}>Resolved</th>
                                    <th style={{ width: "10%", textAlign: "center" }}>Closed</th>
                                    <th style={{ width: "10%", textAlign: "center" }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departments.map(dept => (
                                    <tr key={dept}>
                                        <td>{dept}</td>
                                        <td style={{ textAlign: "center" }}>
                                            {deptStatusCount[dept]?.open || 0}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {deptStatusCount[dept]?.inprogress || 0}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {deptStatusCount[dept]?.assigned || 0}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {deptStatusCount[dept]?.resolved || 0}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {deptStatusCount[dept]?.closed || 0}
                                        </td>
                                        <td style={{ textAlign: "center" }}>{deptCount[dept]}</td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
                                    <td>Total</td>
                                    <td style={{ textAlign: "center" }}>{totals.openTotal}</td>
                                    <td style={{ textAlign: "center" }}>{totals.inprogressTotal}</td>
                                    <td style={{ textAlign: "center" }}>{totals.assignedTotal}</td>
                                    <td style={{ textAlign: "center" }}>{totals.resolvedTotal}</td>
                                    <td style={{ textAlign: "center" }}>{totals.closedTotal}</td>
                                    <td style={{ textAlign: "center" }}>{grandTotal}</td>
                                </tr>
                            </tbody>
                        </Table>
                    )}
                </>
            )}

            {/* Show Detailed Tables per Department with Asset Category Column and Filters */}
            {!showChart && (
                <>
                    {/* Filter Section - Only shown for detailed view */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
                        <div className="d-flex flex-wrap align-items-end gap-3 w-100 w-md-auto">
                            {/* Category Filter Dropdown */}
                            <Form.Group className="flex-grow-1" style={{ minWidth: "180px", maxWidth: "300px" }}>
                                <Form.Label>Filter by Category</Form.Label>
                                <Form.Select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {uniqueCategories.map(category => (
                                        <option key={category} value={category}>
                                            {category === "all" ? "All Categories" : category}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            {/* Department Filter Dropdown */}
                            <Form.Group className="flex-grow-1" style={{ minWidth: "180px", maxWidth: "300px" }}>
                                <Form.Label>Select by Department</Form.Label>
                                <Form.Select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                >
                                    <option value="all">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            {/* Year Filter Dropdown for perMonth view in detailed mode */}
                            {filterType === "perMonth" && availableYears.length > 0 && (
                                <Form.Group className="flex-grow-1" style={{ minWidth: "150px", maxWidth: "200px" }}>
                                    <Form.Label>Select Year</Form.Label>
                                    <Form.Select
                                        value={selectedYearForMonth}
                                        onChange={(e) => setSelectedYearForMonth(parseInt(e.target.value))}
                                    >
                                        {availableYears.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            )}

                            {/* Month Filter Dropdown for perMonth view in detailed mode */}
                            {filterType === "perMonth" && availableMonths.length > 0 && (
                                <Form.Group className="flex-grow-1" style={{ minWidth: "150px", maxWidth: "200px" }}>
                                    <Form.Label>Select Month</Form.Label>
                                    <Form.Select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                                    >
                                        <option value="all">All Months</option>
                                        {availableMonths.map(monthIndex => (
                                            <option key={monthIndex} value={monthIndex}>
                                                {monthLabels[monthIndex]}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            )}

                            {/* Download Excel Button */}
                            <Button
                                variant="success"
                                onClick={downloadExcel}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    marginTop: filterType === "perMonth" ? "24px" : "0"
                                }}
                            >
                                Download Excel
                            </Button>

                        </div>
                    </div>

                    {/* Department Tickets Tables - Grouped by Year for perYear view */}
                    {filterType === "perYear" ? (
                        // Group tickets by year for perYear view
                        Object.keys(yearlyData).sort((a, b) => b - a).map(year => {
                            const yearData = yearlyData[year];

                            // Get departments that have data for this year and apply filters
                            const departmentsToShow = selectedDepartment !== "all"
                                ? [selectedDepartment]
                                : yearData.departments;

                            return (
                                <div key={year} style={{ marginTop: "40px" }}>
                                    <h4 style={{
                                        color: "#0066cc",
                                        borderBottom: "2px solid #0066cc",
                                        paddingBottom: "5px",
                                        marginBottom: "20px"
                                    }}>
                                        Year {year} - Total Tickets: {yearData.yearTotal}
                                    </h4>

                                    {departmentsToShow.map(dept => {
                                        // Get tickets for this department and year, then apply category filter
                                        const deptTickets = ticketsByDept[dept] || [];
                                        const yearDeptTickets = deptTickets.filter(ticket => {
                                            const ticketYear = new Date(ticket.created_at).getFullYear();
                                            return ticketYear === parseInt(year);
                                        });

                                        // Apply category filter
                                        const filteredTickets = yearDeptTickets.filter(ticket => {
                                            if (selectedCategory === "all") return true;
                                            const category = getAssetCategory(ticket.tag_id);
                                            return category === selectedCategory;
                                        });

                                        if (filteredTickets.length === 0) return null;

                                        // Create a unique key for this department/year combination
                                        const deptKey = `${year}-${dept}`;

                                        // Get paginated data
                                        const paginatedTickets = getPaginatedData(filteredTickets, currentPage);

                                        return (
                                            <div key={deptKey} style={{ marginLeft: "20px", marginBottom: "30px" }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        cursor: "pointer",
                                                        marginBottom: "10px"
                                                    }}
                                                    onClick={() => toggleDepartment(deptKey)}
                                                >
                                                    <h5 style={{
                                                        fontWeight: "bold",
                                                        marginBottom: "0",
                                                        color: "#333"
                                                    }}>
                                                        {dept} Department
                                                        <span style={{ marginLeft: "10px", color: "#666", fontSize: "0.9em" }}>
                                                            ({filteredTickets.length} tickets)
                                                        </span>
                                                    </h5>
                                                    <span style={{ marginLeft: "10px", fontSize: "1.2em" }}>
                                                        {expandedDepartments[deptKey] ? <FeatherIcon icon="chevron-down" /> : <FeatherIcon icon="chevron-right" />}
                                                    </span>
                                                </div>

                                                {expandedDepartments[deptKey] && (
                                                    <>
                                                        <Table
                                                            border="1"
                                                            cellPadding="8"
                                                            style={{
                                                                borderCollapse: "collapse",
                                                                width: "100%",
                                                                height: "100%",
                                                                border: '1px solid #ddd'
                                                            }}>
                                                            <thead style={{
                                                                background: '#053b00ff',
                                                                color: 'white !important',
                                                                position: 'sticky',
                                                                top: 0,
                                                                zIndex: 1
                                                            }}>
                                                                <tr>
                                                                    <th style={{ color: 'white' }}>Tag ID</th>
                                                                    <th style={{ color: 'white' }}>Asset Category</th>
                                                                    <th style={{ color: 'white' }}>PMS Ticket ID</th>
                                                                    <th style={{ color: 'white' }}>Status</th>
                                                                    <th style={{ color: 'white' }}>Assigned To</th>
                                                                    <th style={{ color: 'white' }}>Created At</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {paginatedTickets.map((ticket, index) => (
                                                                    <tr key={index}
                                                                        style={{ cursor: "pointer" }}
                                                                        onClick={() => window.open(`/ticketsystem/view-pms-hd-ticket?id=${ticket.pmsticket_id}`)}>
                                                                        <td >{ticket.tag_id}</td>
                                                                        <td>{getAssetCategory(ticket.tag_id)}</td>
                                                                        <td>{ticket.pmsticket_id}</td>
                                                                        <td>{ticket.pms_status}</td>
                                                                        <td>{ticket.assigned_to}</td>
                                                                        <td>{new Date(ticket.created_at).toLocaleString()}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                        {renderPagination(filteredTickets.length, deptKey)}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })
                    ) : (
                        // Regular view for non-perYear filters
                        Object.keys(filteredTicketsByDept).length > 0 ? (
                            Object.keys(filteredTicketsByDept).map(dept => {
                                const deptTickets = filteredTicketsByDept[dept];

                                // Create a unique key for this department
                                const deptKey = dept;

                                // Get paginated data
                                const paginatedTickets = getPaginatedData(deptTickets, currentPage);

                                return (
                                    <div key={dept} style={{ marginTop: "40px" }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                cursor: "pointer",
                                                marginBottom: "10px"
                                            }}
                                            onClick={() => toggleDepartment(deptKey)}
                                        >
                                            <h6 style={{ fontWeight: "bold", marginBottom: "0" }}>
                                                {dept} Department Tickets
                                                <span style={{ marginLeft: "10px", color: "#666", fontSize: "0.9em" }}>
                                                    ({deptTickets.length} tickets)
                                                </span>
                                                {filterType === "perMonth" && selectedMonth !== "all" && (
                                                    <span style={{ marginLeft: "10px", color: "#0066cc", fontSize: "0.9em" }}>
                                                        - {monthLabels[selectedMonth]} {selectedYearForMonth}
                                                    </span>
                                                )}
                                            </h6>
                                            <span style={{ marginLeft: "10px", fontSize: "1.2em" }}>
                                                {expandedDepartments[deptKey] ? <FeatherIcon icon="chevron-down" /> : <FeatherIcon icon="chevron-right" />}
                                            </span>
                                        </div>

                                        {expandedDepartments[deptKey] && (
                                            <>
                                                <Table
                                                    border="1"
                                                    cellPadding="8"
                                                    style={{
                                                        borderCollapse: "collapse",
                                                        width: "100%",
                                                        height: "100%",
                                                        border: '1px solid #ddd'
                                                    }}
                                                >
                                                    <thead style={{
                                                        background: '#053b00ff',
                                                        color: 'white !important',
                                                        position: 'sticky',
                                                        top: 0,
                                                        zIndex: 1
                                                    }}>

                                                        <tr >
                                                            <th style={{ color: 'white' }}>Tag ID</th>
                                                            <th style={{ color: 'white' }}>Asset Category</th>
                                                            <th style={{ color: 'white' }}>PMS Ticket ID</th>
                                                            <th style={{ color: 'white' }}>Status</th>
                                                            <th style={{ color: 'white' }}>Assigned To</th>
                                                            <th style={{ color: 'white' }}>Requestsdfsdfed By</th>
                                                            <th style={{ color: 'white' }}>Created At</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedTickets.map((ticket, index) => (
                                                            <tr key={index}
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => window.open(`/ticketsystem/view-pms-hd-ticket?id=${ticket.pmsticket_id}`)}>
                                                                <td>{ticket.tag_id}</td>
                                                                <td>{getAssetCategory(ticket.tag_id)}</td>
                                                                <td>{ticket.pmsticket_id}</td>
                                                                <td>{ticket.pms_status}</td>
                                                                <td>{ticket.assigned_to}</td>
                                                                <td>{ticket.pmsticket_for}</td>
                                                                <td>{new Date(ticket.created_at).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                                {renderPagination(deptTickets.length, deptKey)}
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                                <h5>No tickets match the selected filters</h5>
                                <Button variant="outline-primary" onClick={resetFilters} style={{ marginTop: "10px" }}>
                                    Reset Filters
                                </Button>
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
};

export default PMSbyDept;