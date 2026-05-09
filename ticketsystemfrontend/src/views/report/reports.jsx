import { Container, Row, Col, Form, Modal, Button, Pagination } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "config";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import SubCatDepartment from "./subcat_department";
import SubCatDepartmentTable from "./subcat_departmentTable";
import "./bento-layout-new.css";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import GetAllByCategory from "./getallbycategory";
import LocationTicketsChart from "./allticketbysite";
import AllTicketbyType from "./allticketbytype";
import AllTicketsByUser from "./allticketsbyuser";
import FeatherIcon from "feather-icons-react";
import { useNavigate } from 'react-router';
import TatPerCategorySummary from "./tatpercategory";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Report() {
    const [filterType, setFilterType] = useState("all");
    const [stats, setStats] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const navigate = useNavigate();
    const [location, setLocation] = useState('')

    const [tatSummary, setTatSummary] = useState(null);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    const [open, setOpen] = useState('');
    const [notReviewed, setNotReviewed] = useState('');
    const [closed, setClosed] = useState('');

    const [chartdata, setChartData] = useState(null);
    const [subcatSummary, setSubcatSummary] = useState(null);
    const [ticketTypeSummary, setTicketTypeSummary] = useState(null);
    const [ticketCategorySummary, setTicketCategorySummary] = useState(null);
    const [ticketUsersSummary, setTicketUsersSummary] = useState(null);
    const [locationFilteredTickets, setLocationFilteredTickets] = useState([]);

    //Settting modal content
    const openModal = (title, content) => {
        setModalTitle(title);
        setModalContent(content);
        setShowModal(true);
    };

    // Function to calculate Turnaround Time (TAT) between two dates
    const calcTAT = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { diffMs, text: `${diffDays}d ${diffHours}h ${diffMinutes}m` };
    };

    //Render Tablet
    const TicketsTable = ({ tickets }) => {
        const [currentPage, setCurrentPage] = useState(1);
        const itemsPerPage = 10;

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentTickets = tickets.slice(indexOfFirstItem, indexOfLastItem);

        const totalPages = Math.ceil(tickets.length / itemsPerPage);

        return (
            <div style={{ overflowX: "auto" }}>
                <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead style={{ background: '#053b00ff', color: 'white' }}>
                        <tr>
                            <th>ID</th>
                            <th>Problem/Issue</th>
                            <th>Status</th>
                            {/* <th>Type</th> */}
                            <th>Assigned To</th>
                            <th>For</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTickets.length > 0 ? (
                            currentTickets.map(ticket => (
                                <tr key={ticket.ticket_id}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => navigate(`/view-hd-ticket?id=${ticket.ticket_id}`)}>
                                    <td>{ticket.ticket_id}</td>
                                    <td>{ticket.ticket_subject}</td>
                                    <td>{ticket.ticket_status}</td>
                                    {/* <td>{ticket.ticket_type}</td> */}
                                    <td>{ticket.assigned_to}</td>
                                    <td>{ticket.ticket_for}</td>
                                    <td>{new Date(ticket.created_at).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center" }}>No Tickets Found</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination controls */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                        <Pagination className="tickets-pagination" style={{ "--bs-pagination-active-bg": "#053b00ff", "--bs-pagination-active-border-color": "#053b00ff", "--bs-pagination-color": "#053b00ff" }}>
                            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />

                            {Array.from({ length: totalPages }, (_, i) => (
                                <Pagination.Item
                                    key={i + 1}
                                    active={i + 1 === currentPage}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </Pagination.Item>
                            ))}

                            <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                    </div>
                )}
            </div>
        );
    };

    // Fetch tickets once
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                const data = res.data || [];
                const activetickets = data.filter(t => t.is_active === true)
                setAllTickets(activetickets);
            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, []);

    //Setting tickets per site
    useEffect(() => {
        let filetered = [...allTickets];
        if (location === 'lmd') {
            filetered = allTickets.filter(t => t.assigned_location === 'lmd');
        } else if (location === 'corp') {
            filetered = allTickets.filter(t => t.assigned_location === 'corp');
        } else {
            filetered = allTickets;
        }
        setLocationFilteredTickets(filetered);
    }, [location, allTickets])

    // Apply filter + sorting whenever filterType or allTickets changes
    useEffect(() => {
        if (!locationFilteredTickets.length) {
            setFilteredTickets([])
            return;
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let filtered = [...locationFilteredTickets];

        switch (filterType) {
            case "today":
                filtered = filtered.filter(t => new Date(t.created_at) >= startOfToday);
                break;
            case "thisWeek":
                filtered = filtered.filter(t => new Date(t.created_at) >= startOfWeek);
                break;
            case "lastWeek":
                filtered = filtered.filter(t => {
                    const created = new Date(t.created_at);
                    return created >= startOfLastWeek && created < endOfLastWeek;
                });
                break;
            case "thisMonth":
                filtered = filtered.filter(t => new Date(t.created_at) >= startOfMonth);
                break;
            case "perMonth":
            case "perYear":
                // No additional filtering - we want all tickets for the grouping
                break;
            default:
                break;
        }

        // Sort by created_at (newest first)
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // save filtered tickets for modal usage
        setFilteredTickets(filtered);

        // Counters
        if (filterType === "perMonth" || filterType === "perYear") {
            setOpen(0);
            setNotReviewed(0);
            setClosed(0);
        } else {
            setOpen(filtered.filter(ticket => ticket.ticket_status === 'open').length);
            setNotReviewed(filtered.filter(ticket => ticket.is_reviewed === false && ticket.ticket_status === 'closed').length);
            setClosed(filtered.filter(ticket => ticket.is_reviewed === true && ticket.ticket_status === 'closed').length);
        }


        // Group by time period for perMonth and perYear filters, otherwise group by subcategory
        let grouped;

        if (filterType === "perMonth") {
            // Group by month
            grouped = filtered.reduce((acc, ticket) => {
                const date = new Date(ticket.created_at);
                const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                const monthIndex = date.getMonth();
                const status = ticket.ticket_status?.toLowerCase() || "unknown";

                if (!acc[monthYear]) {
                    acc[monthYear] = {
                        period: monthYear,
                        monthIndex: monthIndex,
                        total: 0,
                        resolved: 0,
                        closed: 0,
                        open: 0,
                        tatTimes: []
                    };
                }

                acc[monthYear].total += 1;

                if (status === "resolved") acc[monthYear].resolved += 1;
                else if (status === "closed") acc[monthYear].closed += 1;
                else if (status === "open") acc[monthYear].open += 1;

                if (ticket.created_at && ticket.resolved_at) {
                    const tat = calcTAT(ticket.created_at, ticket.resolved_at);
                    acc[monthYear].tatTimes.push(tat.diffMs);
                }

                return acc;
            }, {});

            // Convert to array and sort by month index
            let result = Object.values(grouped).map(item => {
                if (item.tatTimes.length > 0) {
                    const avgMs = item.tatTimes.reduce((a, b) => a + b, 0) / item.tatTimes.length;
                    const diffDays = Math.floor(avgMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor((avgMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const diffMinutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
                    item.avgTAT = `${diffDays}d ${diffHours}h ${diffMinutes}m`;
                } else {
                    item.avgTAT = "N/A";
                }
                return item;
            });

            // Sort by month index
            result.sort((a, b) => a.monthIndex - b.monthIndex);
            setStats(result);

        } else if (filterType === "perYear") {
            // Group by year
            grouped = filtered.reduce((acc, ticket) => {
                const date = new Date(ticket.created_at);
                const year = date.getFullYear().toString();
                const status = ticket.ticket_status?.toLowerCase() || "unknown";

                if (!acc[year]) {
                    acc[year] = {
                        period: year,
                        year: year,
                        total: 0,
                        resolved: 0,
                        closed: 0,
                        open: 0,
                        tatTimes: []
                    };
                }

                acc[year].total += 1;

                if (status === "resolved") acc[year].resolved += 1;
                else if (status === "closed") acc[year].closed += 1;
                else if (status === "open") acc[year].open += 1;

                if (ticket.created_at && ticket.resolved_at) {
                    const tat = calcTAT(ticket.created_at, ticket.resolved_at);
                    acc[year].tatTimes.push(tat.diffMs);
                }

                return acc;
            }, {});

            // Convert to array and sort by year
            let result = Object.values(grouped).map(item => {
                if (item.tatTimes.length > 0) {
                    const avgMs = item.tatTimes.reduce((a, b) => a + b, 0) / item.tatTimes.length;
                    const diffDays = Math.floor(avgMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor((avgMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const diffMinutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
                    item.avgTAT = `${diffDays}d ${diffHours}h ${diffMinutes}m`;
                } else {
                    item.avgTAT = "N/A";
                }
                return item;
            });

            // Sort by year
            result.sort((a, b) => parseInt(a.year) - parseInt(b.year));
            setStats(result);

        } else {
            // Group by subcategory (original behavior)
            grouped = filtered.reduce((acc, ticket) => {
                const subCat = ticket.ticket_SubCategory || "Unknown";
                const status = ticket.ticket_status?.toLowerCase() || "unknown";

                if (!acc[subCat]) {
                    acc[subCat] = {
                        subcategory: subCat,
                        total: 0,
                        resolved: 0,
                        closed: 0,
                        open: 0,
                        tatTimes: []
                    };
                }

                acc[subCat].total += 1;

                if (status === "resolved") acc[subCat].resolved += 1;
                else if (status === "closed") acc[subCat].closed += 1;
                else if (status === "open") acc[subCat].open += 1;

                if (ticket.created_at && ticket.resolved_at) {
                    const tat = calcTAT(ticket.created_at, ticket.resolved_at);
                    acc[subCat].tatTimes.push(tat.diffMs);
                }

                return acc;
            }, {});

            const result = Object.values(grouped).map(item => {
                if (item.tatTimes.length > 0) {
                    const avgMs = item.tatTimes.reduce((a, b) => a + b, 0) / item.tatTimes.length;
                    const diffDays = Math.floor(avgMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor((avgMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const diffMinutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
                    item.avgTAT = `${diffDays}d ${diffHours}h ${diffMinutes}m`;
                } else {
                    item.avgTAT = "N/A";
                }
                return item;
            });

            setStats(result);
        }

        // Chart counts
        const incidentCount = filtered.filter(i => i.ticket_type === 'incident').length;
        const requestCount = filtered.filter(r => r.ticket_type === 'request').length;
        const inquiryCount = filtered.filter(q => q.ticket_type === 'inquiry').length;

        setChartData({
            labels: ['Incident', 'Request', 'Inquiry'],
            datasets: [
                {
                    label: 'Number of Tickets',
                    data: [incidentCount, requestCount, inquiryCount],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
                }
            ]
        });
    }, [filterType, locationFilteredTickets]);

    // Calculate overall totals by summing up all values from the "stats" array
    const totalRow = stats.reduce(
        (totals, row) => {
            totals.total += row.total;
            totals.resolved += row.resolved;
            totals.closed += row.closed;
            totals.open += row.open;
            return totals;
        },
        { total: 0, resolved: 0, closed: 0, open: 0 }
    );

    //Download Excel
    // const handleDownloadExcel = async () => {
    //     const workbook = new ExcelJS.Workbook();

    //     try {
    //         // Show loading indicator if you have one
    //         // setLoading(true);

    //         // ============= 1. TICKETS BY STATUS SHEET =============
    //         const ticketsSheet = workbook.addWorksheet("Tickets by Status");
    //         await addTicketsByStatusSheet(ticketsSheet);

    //         // ============= 2. DEPARTMENT SUMMARY SHEET =============
    //         const deptSheet = workbook.addWorksheet("Department Summary");
    //         await addDepartmentSummarySheet(deptSheet);

    //         // ============= 3. CATEGORY ANALYSIS SHEET =============
    //         if (ticketCategorySummary) {
    //             const categorySheet = workbook.addWorksheet("Category Analysis");
    //             await addCategoryAnalysisSheet(categorySheet);
    //         }

    //         // ============= 4. USER ANALYSIS SHEET =============
    //         if (ticketUsersSummary) {
    //             const userSheet = workbook.addWorksheet("User Analysis");
    //             await addUserAnalysisSheet(userSheet);
    //         }

    //         // ============= 5. TICKET TYPE ANALYSIS SHEET =============
    //         if (ticketTypeSummary) {
    //             const typeSheet = workbook.addWorksheet("Ticket Type Analysis");
    //             await addTicketTypeSheet(typeSheet);
    //         }

    //         // ============= 6. TAT ANALYSIS SHEET =============
    //         const tatSheet = workbook.addWorksheet("TAT Analysis");
    //         await addTATAnalysisSheet(tatSheet);

    //         // ============= 7. SUMMARY DASHBOARD SHEET =============
    //         const summarySheet = workbook.addWorksheet("Dashboard");
    //         await addDashboardSheet(summarySheet);

    //         // ============= SAVE FILE =============
    //         const buffer = await workbook.xlsx.writeBuffer();
    //         const fileName = `Ticket_Report_${new Date().toISOString().split('T')[0]}_${filterType}_${location || 'all'}.xlsx`;
    //         saveAs(new Blob([buffer]), fileName);

    //     } catch (error) {
    //         console.error("Error generating Excel file:", error);
    //         alert("Error generating Excel file. Please check the console for details.");
    //     } finally {
    //         // setLoading(false);
    //     }

    //     // ============= HELPER FUNCTIONS =============

    //     async function addTicketsByStatusSheet(worksheet) {
    //         // Set column widths
    //         worksheet.columns = [
    //             { width: 15 }, // Ticket ID
    //             { width: 40 }, // Subject
    //             { width: 20 }, // Status
    //             { width: 20 }, // Assigned To
    //             { width: 20 }, // Requestor
    //             { width: 15 }, // Location
    //             { width: 20 }, // Date
    //             { width: 15 }  // Department
    //         ];

    //         addTitle(worksheet, "TICKETS BY STATUS REPORT", 16, 8);
    //         addFilterInfo(worksheet, filterType, location);

    //         // 1. OPEN TICKETS
    //         const openTickets = filteredTickets.filter(t => t.ticket_status?.toLowerCase() === 'open');
    //         if (openTickets.length > 0) {
    //             addTitle(worksheet, `OPEN TICKETS (${openTickets.length})`, 12, 8);
    //             await addTicketsTable(worksheet, openTickets, "Open");
    //         }

    //         // 2. NOT REVIEWED TICKETS
    //         const notReviewedTickets = filteredTickets.filter(t =>
    //             t.is_reviewed === false && t.ticket_status?.toLowerCase() === 'closed'
    //         );
    //         if (notReviewedTickets.length > 0) {
    //             addTitle(worksheet, `NOT REVIEWED TICKETS (${notReviewedTickets.length})`, 12, 8);
    //             await addTicketsTable(worksheet, notReviewedTickets, "Not Reviewed");
    //         }

    //         // 3. CLOSED TICKETS (REVIEWED)
    //         const closedTickets = filteredTickets.filter(t =>
    //             t.is_reviewed === true && t.ticket_status?.toLowerCase() === 'closed'
    //         );
    //         if (closedTickets.length > 0) {
    //             addTitle(worksheet, `CLOSED & REVIEWED TICKETS (${closedTickets.length})`, 12, 8);
    //             await addTicketsTable(worksheet, closedTickets, "Closed");
    //         }

    //         // Summary stats
    //         worksheet.addRow([]);
    //         worksheet.addRow([]);
    //         addTitle(worksheet, "SUMMARY STATISTICS", 12, 8);

    //         const summaryRows = [
    //             ["Total Open Tickets", openTickets.length],
    //             ["Total Not Reviewed Tickets", notReviewedTickets.length],
    //             ["Total Closed & Reviewed Tickets", closedTickets.length],
    //             ["Total Tickets", filteredTickets.length]
    //         ];

    //         addSimpleTable(worksheet, ["Status", "Count"], summaryRows);
    //     }

    //     async function addDepartmentSummarySheet(worksheet) {
    //         worksheet.columns = [
    //             { width: 25 }, // Year/Month/Department
    //             { width: 12 }, // Open
    //             { width: 15 }, // In Progress
    //             { width: 12 }, // Assigned
    //             { width: 12 }, // Resolved
    //             { width: 12 }, // Closed
    //             { width: 15 }, // Not Reviewed
    //             { width: 12 }  // Total
    //         ];

    //         addTitle(worksheet, "DEPARTMENT SUMMARY REPORT", 16, 8);
    //         addFilterInfo(worksheet, filterType, location);

    //         // Get department data
    //         const departmentSummary = await buildDepartmentSummary();

    //         if (filterType === "perMonth") {
    //             // Handle monthly breakdown
    //             addTitle(worksheet, "Monthly Department Breakdown", 12, 8);

    //             for (const [month, monthData] of Object.entries(departmentSummary)) {
    //                 worksheet.addRow([]);
    //                 worksheet.addRow([`${month}`]).font = { bold: true, size: 11, color: { argb: 'FF0066CC' } };
    //                 worksheet.addRow([]);

    //                 const deptRows = [];
    //                 let monthTotals = {
    //                     open: 0, in_progress: 0, assigned: 0,
    //                     resolved: 0, closed: 0, not_reviewed: 0, total: 0
    //                 };

    //                 // Sort departments alphabetically
    //                 const sortedDepts = Object.keys(monthData.departments).sort();

    //                 sortedDepts.forEach(dept => {
    //                     const data = monthData.departments[dept];
    //                     deptRows.push([
    //                         dept,
    //                         data.open || 0,
    //                         data.in_progress || 0,
    //                         data.assigned || 0,
    //                         data.resolved || 0,
    //                         data.closed || 0,
    //                         data.not_reviewed || 0,
    //                         data.total || 0
    //                     ]);

    //                     monthTotals.open += data.open || 0;
    //                     monthTotals.in_progress += data.in_progress || 0;
    //                     monthTotals.assigned += data.assigned || 0;
    //                     monthTotals.resolved += data.resolved || 0;
    //                     monthTotals.closed += data.closed || 0;
    //                     monthTotals.not_reviewed += data.not_reviewed || 0;
    //                     monthTotals.total += data.total || 0;
    //                 });

    //                 // Add total row for the month
    //                 deptRows.push([
    //                     "MONTH TOTAL",
    //                     monthTotals.open,
    //                     monthTotals.in_progress,
    //                     monthTotals.assigned,
    //                     monthTotals.resolved,
    //                     monthTotals.closed,
    //                     monthTotals.not_reviewed,
    //                     monthTotals.total
    //                 ]);

    //                 addStyledTable(
    //                     worksheet,
    //                     ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
    //                     deptRows,
    //                     true // has total row
    //                 );
    //             }

    //             // Add overall summary for all months
    //             worksheet.addRow([]);
    //             worksheet.addRow([]);
    //             addTitle(worksheet, "OVERALL SUMMARY - ALL MONTHS", 12, 8);

    //             const overallSummary = {};
    //             let grandTotals = {
    //                 open: 0, in_progress: 0, assigned: 0,
    //                 resolved: 0, closed: 0, not_reviewed: 0, total: 0
    //             };

    //             // Aggregate all months
    //             for (const monthData of Object.values(departmentSummary)) {
    //                 for (const [dept, data] of Object.entries(monthData.departments)) {
    //                     if (!overallSummary[dept]) {
    //                         overallSummary[dept] = {
    //                             open: 0, in_progress: 0, assigned: 0,
    //                             resolved: 0, closed: 0, not_reviewed: 0, total: 0
    //                         };
    //                     }

    //                     overallSummary[dept].open += data.open || 0;
    //                     overallSummary[dept].in_progress += data.in_progress || 0;
    //                     overallSummary[dept].assigned += data.assigned || 0;
    //                     overallSummary[dept].resolved += data.resolved || 0;
    //                     overallSummary[dept].closed += data.closed || 0;
    //                     overallSummary[dept].not_reviewed += data.not_reviewed || 0;
    //                     overallSummary[dept].total += data.total || 0;
    //                 }
    //             }

    //             // Create overall summary rows
    //             const overallRows = [];
    //             Object.keys(overallSummary).sort().forEach(dept => {
    //                 const data = overallSummary[dept];
    //                 overallRows.push([
    //                     dept,
    //                     data.open,
    //                     data.in_progress,
    //                     data.assigned,
    //                     data.resolved,
    //                     data.closed,
    //                     data.not_reviewed,
    //                     data.total
    //                 ]);

    //                 grandTotals.open += data.open;
    //                 grandTotals.in_progress += data.in_progress;
    //                 grandTotals.assigned += data.assigned;
    //                 grandTotals.resolved += data.resolved;
    //                 grandTotals.closed += data.closed;
    //                 grandTotals.not_reviewed += data.not_reviewed;
    //                 grandTotals.total += data.total;
    //             });

    //             overallRows.push([
    //                 "GRAND TOTAL",
    //                 grandTotals.open,
    //                 grandTotals.in_progress,
    //                 grandTotals.assigned,
    //                 grandTotals.resolved,
    //                 grandTotals.closed,
    //                 grandTotals.not_reviewed,
    //                 grandTotals.total
    //             ]);

    //             addStyledTable(
    //                 worksheet,
    //                 ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
    //                 overallRows,
    //                 true
    //             );

    //         }
    //         else if (filterType === "perYear") {
    //             // Handle yearly breakdown
    //             addTitle(worksheet, "Yearly Department Breakdown", 12, 8);

    //             // Sort years in ascending order
    //             const sortedYears = Object.keys(departmentSummary).sort((a, b) => parseInt(a) - parseInt(b));

    //             for (const year of sortedYears) {
    //                 const yearData = departmentSummary[year];

    //                 worksheet.addRow([]);
    //                 worksheet.addRow([`YEAR ${year} - Total Tickets: ${yearData.yearTotal}`])
    //                     .font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };
    //                 worksheet.addRow([]);

    //                 // Monthly breakdown for this year
    //                 yearData.months.forEach(monthData => {
    //                     if (Object.keys(monthData.departments).length === 0) return;

    //                     worksheet.addRow([`  ${monthData.month} (Month Total: ${monthData.monthTotal})`])
    //                         .font = { bold: true, size: 10, color: { argb: 'FF555555' } };
    //                     worksheet.addRow([]);

    //                     const deptRows = [];
    //                     let monthTotals = {
    //                         open: 0, in_progress: 0, assigned: 0,
    //                         resolved: 0, closed: 0, not_reviewed: 0, total: 0
    //                     };

    //                     // Sort departments alphabetically
    //                     const sortedDepts = Object.keys(monthData.departments).sort();

    //                     sortedDepts.forEach(dept => {
    //                         const data = monthData.departments[dept];
    //                         deptRows.push([
    //                             `    ${dept}`,
    //                             data.open || 0,
    //                             data.in_progress || 0,
    //                             data.assigned || 0,
    //                             data.resolved || 0,
    //                             data.closed || 0,
    //                             data.not_reviewed || 0,
    //                             data.total || 0
    //                         ]);

    //                         monthTotals.open += data.open || 0;
    //                         monthTotals.in_progress += data.in_progress || 0;
    //                         monthTotals.assigned += data.assigned || 0;
    //                         monthTotals.resolved += data.resolved || 0;
    //                         monthTotals.closed += data.closed || 0;
    //                         monthTotals.not_reviewed += data.not_reviewed || 0;
    //                         monthTotals.total += data.total || 0;
    //                     });

    //                     // Add total row for the month
    //                     deptRows.push([
    //                         "    MONTH TOTAL",
    //                         monthTotals.open,
    //                         monthTotals.in_progress,
    //                         monthTotals.assigned,
    //                         monthTotals.resolved,
    //                         monthTotals.closed,
    //                         monthTotals.not_reviewed,
    //                         monthTotals.total
    //                     ]);

    //                     addStyledTable(
    //                         worksheet,
    //                         ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
    //                         deptRows,
    //                         true
    //                     );

    //                     worksheet.addRow([]);
    //                 });

    //                 // Yearly summary for this year
    //                 worksheet.addRow([]);
    //                 worksheet.addRow([`YEAR ${year} - SUMMARY`])
    //                     .font = { bold: true, size: 11, color: { argb: 'FF008000' } };
    //                 worksheet.addRow([]);

    //                 // Aggregate yearly totals by department
    //                 const yearlyDeptSummary = {};
    //                 let yearlyTotals = {
    //                     open: 0, in_progress: 0, assigned: 0,
    //                     resolved: 0, closed: 0, not_reviewed: 0, total: 0
    //                 };

    //                 yearData.months.forEach(monthData => {
    //                     Object.entries(monthData.departments).forEach(([dept, data]) => {
    //                         if (!yearlyDeptSummary[dept]) {
    //                             yearlyDeptSummary[dept] = {
    //                                 open: 0, in_progress: 0, assigned: 0,
    //                                 resolved: 0, closed: 0, not_reviewed: 0, total: 0
    //                             };
    //                         }

    //                         yearlyDeptSummary[dept].open += data.open || 0;
    //                         yearlyDeptSummary[dept].in_progress += data.in_progress || 0;
    //                         yearlyDeptSummary[dept].assigned += data.assigned || 0;
    //                         yearlyDeptSummary[dept].resolved += data.resolved || 0;
    //                         yearlyDeptSummary[dept].closed += data.closed || 0;
    //                         yearlyDeptSummary[dept].not_reviewed += data.not_reviewed || 0;
    //                         yearlyDeptSummary[dept].total += data.total || 0;
    //                     });
    //                 });

    //                 const yearlyRows = [];
    //                 Object.keys(yearlyDeptSummary).sort().forEach(dept => {
    //                     const data = yearlyDeptSummary[dept];
    //                     yearlyRows.push([
    //                         dept,
    //                         data.open,
    //                         data.in_progress,
    //                         data.assigned,
    //                         data.resolved,
    //                         data.closed,
    //                         data.not_reviewed,
    //                         data.total
    //                     ]);

    //                     yearlyTotals.open += data.open;
    //                     yearlyTotals.in_progress += data.in_progress;
    //                     yearlyTotals.assigned += data.assigned;
    //                     yearlyTotals.resolved += data.resolved;
    //                     yearlyTotals.closed += data.closed;
    //                     yearlyTotals.not_reviewed += data.not_reviewed;
    //                     yearlyTotals.total += data.total;
    //                 });

    //                 yearlyRows.push([
    //                     "YEAR TOTAL",
    //                     yearlyTotals.open,
    //                     yearlyTotals.in_progress,
    //                     yearlyTotals.assigned,
    //                     yearlyTotals.resolved,
    //                     yearlyTotals.closed,
    //                     yearlyTotals.not_reviewed,
    //                     yearlyTotals.total
    //                 ]);

    //                 addStyledTable(
    //                     worksheet,
    //                     ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
    //                     yearlyRows,
    //                     true
    //                 );

    //                 worksheet.addRow([]);
    //                 worksheet.addRow([]);
    //             }

    //             // Add overall summary for all years
    //             worksheet.addRow([]);
    //             worksheet.addRow([]);
    //             addTitle(worksheet, "OVERALL SUMMARY - ALL YEARS", 12, 8);

    //             const overallSummary = {};
    //             let grandTotals = {
    //                 open: 0, in_progress: 0, assigned: 0,
    //                 resolved: 0, closed: 0, not_reviewed: 0, total: 0
    //             };

    //             // Aggregate all years
    //             for (const yearData of Object.values(departmentSummary)) {
    //                 yearData.months.forEach(monthData => {
    //                     Object.entries(monthData.departments).forEach(([dept, data]) => {
    //                         if (!overallSummary[dept]) {
    //                             overallSummary[dept] = {
    //                                 open: 0, in_progress: 0, assigned: 0,
    //                                 resolved: 0, closed: 0, not_reviewed: 0, total: 0
    //                             };
    //                         }

    //                         overallSummary[dept].open += data.open || 0;
    //                         overallSummary[dept].in_progress += data.in_progress || 0;
    //                         overallSummary[dept].assigned += data.assigned || 0;
    //                         overallSummary[dept].resolved += data.resolved || 0;
    //                         overallSummary[dept].closed += data.closed || 0;
    //                         overallSummary[dept].not_reviewed += data.not_reviewed || 0;
    //                         overallSummary[dept].total += data.total || 0;
    //                     });
    //                 });
    //             }

    //             // Create overall summary rows
    //             const overallRows = [];
    //             Object.keys(overallSummary).sort().forEach(dept => {
    //                 const data = overallSummary[dept];
    //                 overallRows.push([
    //                     dept,
    //                     data.open,
    //                     data.in_progress,
    //                     data.assigned,
    //                     data.resolved,
    //                     data.closed,
    //                     data.not_reviewed,
    //                     data.total
    //                 ]);

    //                 grandTotals.open += data.open;
    //                 grandTotals.in_progress += data.in_progress;
    //                 grandTotals.assigned += data.assigned;
    //                 grandTotals.resolved += data.resolved;
    //                 grandTotals.closed += data.closed;
    //                 grandTotals.not_reviewed += data.not_reviewed;
    //                 grandTotals.total += data.total;
    //             });

    //             overallRows.push([
    //                 "GRAND TOTAL",
    //                 grandTotals.open,
    //                 grandTotals.in_progress,
    //                 grandTotals.assigned,
    //                 grandTotals.resolved,
    //                 grandTotals.closed,
    //                 grandTotals.not_reviewed,
    //                 grandTotals.total
    //             ]);

    //             addStyledTable(
    //                 worksheet,
    //                 ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
    //                 overallRows,
    //                 true
    //             );

    //         } else {
    //             // Regular department summary (non-monthly, non-yearly)
    //             // Sort departments alphabetically
    //             const sortedDepartments = Object.keys(departmentSummary).sort();

    //             // Prepare rows
    //             const deptRows = [];
    //             sortedDepartments.forEach(dept => {
    //                 const data = departmentSummary[dept];
    //                 deptRows.push([
    //                     dept,
    //                     data.open || 0,
    //                     data.in_progress || 0,
    //                     data.assigned || 0,
    //                     data.resolved || 0,
    //                     data.closed || 0,
    //                     data.not_reviewed || 0,
    //                     data.total || 0
    //                 ]);
    //             });

    //             // Calculate totals
    //             const totals = {
    //                 open: 0, in_progress: 0, assigned: 0,
    //                 resolved: 0, closed: 0, not_reviewed: 0, total: 0
    //             };

    //             sortedDepartments.forEach(dept => {
    //                 const data = departmentSummary[dept];
    //                 totals.open += data.open || 0;
    //                 totals.in_progress += data.in_progress || 0;
    //                 totals.assigned += data.assigned || 0;
    //                 totals.resolved += data.resolved || 0;
    //                 totals.closed += data.closed || 0;
    //                 totals.not_reviewed += data.not_reviewed || 0;
    //                 totals.total += data.total || 0;
    //             });

    //             // Add total row
    //             deptRows.push([
    //                 "TOTAL",
    //                 totals.open,
    //                 totals.in_progress,
    //                 totals.assigned,
    //                 totals.resolved,
    //                 totals.closed,
    //                 totals.not_reviewed,
    //                 totals.total
    //             ]);

    //             addStyledTable(
    //                 worksheet,
    //                 ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
    //                 deptRows,
    //                 true // has total row
    //             );
    //         }

    //         // Add department performance summary (common for all views)
    //         worksheet.addRow([]);
    //         worksheet.addRow([]);
    //         addTitle(worksheet, "DEPARTMENT PERFORMANCE SUMMARY", 12, 8);

    //         let performanceRows;

    //         if (filterType === "perMonth") {
    //             // Aggregate performance data from monthly summary
    //             const perfSummary = {};
    //             for (const monthData of Object.values(departmentSummary)) {
    //                 for (const [dept, data] of Object.entries(monthData.departments)) {
    //                     if (!perfSummary[dept]) {
    //                         perfSummary[dept] = { total: 0, resolved: 0, closed: 0, not_reviewed: 0, open: 0 };
    //                     }
    //                     perfSummary[dept].total += data.total || 0;
    //                     perfSummary[dept].resolved += data.resolved || 0;
    //                     perfSummary[dept].closed += data.closed || 0;
    //                     perfSummary[dept].not_reviewed += data.not_reviewed || 0;
    //                     perfSummary[dept].open += data.open || 0;
    //                 }
    //             }

    //             performanceRows = Object.keys(perfSummary).sort().map(dept => {
    //                 const data = perfSummary[dept];
    //                 const resolutionRate = data.total > 0
    //                     ? (((data.resolved + data.closed) / data.total) * 100).toFixed(1) + '%'
    //                     : '0%';
    //                 const reviewRate = (data.closed + data.not_reviewed) > 0
    //                     ? ((data.closed / (data.closed + data.not_reviewed)) * 100).toFixed(1) + '%'
    //                     : '0%';

    //                 return [
    //                     dept,
    //                     resolutionRate,
    //                     reviewRate,
    //                     data.open,
    //                     data.not_reviewed
    //                 ];
    //             });
    //         }
    //         else if (filterType === "perYear") {
    //             // Aggregate performance data from yearly summary
    //             const perfSummary = {};
    //             for (const yearData of Object.values(departmentSummary)) {
    //                 yearData.months.forEach(monthData => {
    //                     Object.entries(monthData.departments).forEach(([dept, data]) => {
    //                         if (!perfSummary[dept]) {
    //                             perfSummary[dept] = { total: 0, resolved: 0, closed: 0, not_reviewed: 0, open: 0 };
    //                         }
    //                         perfSummary[dept].total += data.total || 0;
    //                         perfSummary[dept].resolved += data.resolved || 0;
    //                         perfSummary[dept].closed += data.closed || 0;
    //                         perfSummary[dept].not_reviewed += data.not_reviewed || 0;
    //                         perfSummary[dept].open += data.open || 0;
    //                     });
    //                 });
    //             }

    //             performanceRows = Object.keys(perfSummary).sort().map(dept => {
    //                 const data = perfSummary[dept];
    //                 const resolutionRate = data.total > 0
    //                     ? (((data.resolved + data.closed) / data.total) * 100).toFixed(1) + '%'
    //                     : '0%';
    //                 const reviewRate = (data.closed + data.not_reviewed) > 0
    //                     ? ((data.closed / (data.closed + data.not_reviewed)) * 100).toFixed(1) + '%'
    //                     : '0%';

    //                 return [
    //                     dept,
    //                     resolutionRate,
    //                     reviewRate,
    //                     data.open,
    //                     data.not_reviewed
    //                 ];
    //             });
    //         } else {
    //             performanceRows = Object.keys(departmentSummary).sort().map(dept => {
    //                 const data = departmentSummary[dept];
    //                 const resolutionRate = data.total > 0
    //                     ? (((data.resolved + data.closed) / data.total) * 100).toFixed(1) + '%'
    //                     : '0%';
    //                 const reviewRate = (data.closed + data.not_reviewed) > 0
    //                     ? ((data.closed / (data.closed + data.not_reviewed)) * 100).toFixed(1) + '%'
    //                     : '0%';

    //                 return [
    //                     dept,
    //                     resolutionRate,
    //                     reviewRate,
    //                     data.open,
    //                     data.not_reviewed
    //                 ];
    //             });
    //         }

    //         addStyledTable(
    //             worksheet,
    //             ["Department", "Resolution Rate", "Review Rate", "Pending Open", "Pending Review"],
    //             performanceRows
    //         );
    //     }

    //     async function addCategoryAnalysisSheet(worksheet) {
    //         worksheet.columns = [
    //             { width: 20 }, // Category/Period
    //             { width: 12 }, // Hardware
    //             { width: 12 }, // Network
    //             { width: 12 }, // Software
    //             { width: 12 }, // System
    //             { width: 12 }  // Total
    //         ];

    //         addTitle(worksheet, "CATEGORY ANALYSIS REPORT", 16, 6);
    //         addFilterInfo(worksheet, filterType, location);

    //         let summaryData = ticketCategorySummary;
    //         if (!Array.isArray(summaryData)) {
    //             summaryData = [summaryData];
    //         }

    //         if (filterType === "perMonth" && summaryData[0]?.month) {
    //             // ============= MONTHLY CATEGORY BREAKDOWN =============
    //             addTitle(worksheet, `Monthly Category Breakdown - Current Year`, 12, 6);

    //             // Create monthly breakdown table
    //             const rows = summaryData.map(item => [
    //                 item.month,
    //                 item.hardware || 0,
    //                 item.network || 0,
    //                 item.software || 0,
    //                 item.system || 0,
    //                 item.total || 0
    //             ]);

    //             // Calculate monthly totals
    //             const monthlyTotals = summaryData.reduce((acc, item) => {
    //                 acc.hardware += item.hardware || 0;
    //                 acc.network += item.network || 0;
    //                 acc.software += item.software || 0;
    //                 acc.system += item.system || 0;
    //                 acc.total += item.total || 0;
    //                 return acc;
    //             }, { hardware: 0, network: 0, software: 0, system: 0, total: 0 });

    //             rows.push([
    //                 "TOTAL",
    //                 monthlyTotals.hardware,
    //                 monthlyTotals.network,
    //                 monthlyTotals.software,
    //                 monthlyTotals.system,
    //                 monthlyTotals.total
    //             ]);

    //             addStyledTable(
    //                 worksheet,
    //                 ["Month", "Hardware", "Network", "Software", "System", "Total"],
    //                 rows,
    //                 true // has total row
    //             );

    //             // ============= MONTHLY PERCENTAGE ANALYSIS =============
    //             worksheet.addRow([]);
    //             worksheet.addRow([]);
    //             addTitle(worksheet, "Monthly Category Percentage Distribution", 12, 6);

    //             const percentageRows = summaryData.map(item => {
    //                 const total = item.total || 1;
    //                 return [
    //                     item.month,
    //                     `${((item.hardware || 0) / total * 100).toFixed(1)}%`,
    //                     `${((item.network || 0) / total * 100).toFixed(1)}%`,
    //                     `${((item.software || 0) / total * 100).toFixed(1)}%`,
    //                     `${((item.system || 0) / total * 100).toFixed(1)}%`,
    //                     item.total || 0
    //                 ];
    //             });

    //             addStyledTable(
    //                 worksheet,
    //                 ["Month", "Hardware %", "Network %", "Software %", "System %", "Total Tickets"],
    //                 percentageRows
    //             );

    //             // ============= MONTHLY TREND ANALYSIS =============
    //             worksheet.addRow([]);
    //             worksheet.addRow([]);
    //             addTitle(worksheet, "Monthly Trend Analysis", 12, 6);

    //             // Calculate month-over-month growth
    //             const trendRows = [];
    //             for (let i = 1; i < summaryData.length; i++) {
    //                 const current = summaryData[i];
    //                 const previous = summaryData[i - 1];

    //                 const hardwareGrowth = previous.hardware > 0
    //                     ? (((current.hardware || 0) - (previous.hardware || 0)) / previous.hardware * 100).toFixed(1)
    //                     : (current.hardware > 0 ? '+100.0' : '0.0');
    //                 const networkGrowth = previous.network > 0
    //                     ? (((current.network || 0) - (previous.network || 0)) / previous.network * 100).toFixed(1)
    //                     : (current.network > 0 ? '+100.0' : '0.0');
    //                 const softwareGrowth = previous.software > 0
    //                     ? (((current.software || 0) - (previous.software || 0)) / previous.software * 100).toFixed(1)
    //                     : (current.software > 0 ? '+100.0' : '0.0');
    //                 const systemGrowth = previous.system > 0
    //                     ? (((current.system || 0) - (previous.system || 0)) / previous.system * 100).toFixed(1)
    //                     : (current.system > 0 ? '+100.0' : '0.0');
    //                 const totalGrowth = previous.total > 0
    //                     ? (((current.total || 0) - (previous.total || 0)) / previous.total * 100).toFixed(1)
    //                     : (current.total > 0 ? '+100.0' : '0.0');

    //                 trendRows.push([
    //                     `${previous.month} → ${current.month}`,
    //                     `${hardwareGrowth}%`,
    //                     `${networkGrowth}%`,
    //                     `${softwareGrowth}%`,
    //                     `${systemGrowth}%`,
    //                     `${totalGrowth}%`
    //                 ]);
    //             }

    //             if (trendRows.length > 0) {
    //                 addStyledTable(
    //                     worksheet,
    //                     ["Period", "Hardware Growth", "Network Growth", "Software Growth", "System Growth", "Total Growth"],
    //                     trendRows
    //                 );
    //             }

    //             // ============= DETAILED TICKETS PER CATEGORY BY MONTH =============
    //             worksheet.addRow([]);
    //             worksheet.addRow([]);
    //             addTitle(worksheet, "DETAILED TICKETS BY CATEGORY AND MONTH", 12, 6);

    //             const categories = ["hardware", "network", "software", "system"];
    //             for (const category of categories) {
    //                 // Get tickets for this category
    //                 const categoryTickets = filteredTickets.filter(
    //                     t => t.ticket_category?.toLowerCase() === category
    //                 );

    //                 if (categoryTickets.length > 0) {
    //                     worksheet.addRow([]);
    //                     addTitle(worksheet, `${category.toUpperCase()} TICKETS - MONTHLY BREAKDOWN`, 11, 8);

    //                     // Group tickets by month
    //                     const monthNames = [
    //                         "January", "February", "March", "April", "May", "June",
    //                         "July", "August", "September", "October", "November", "December"
    //                     ];

    //                     const ticketsByMonth = {};
    //                     categoryTickets.forEach(ticket => {
    //                         const date = new Date(ticket.created_at);
    //                         const month = monthNames[date.getMonth()];
    //                         if (!ticketsByMonth[month]) {
    //                             ticketsByMonth[month] = [];
    //                         }
    //                         ticketsByMonth[month].push(ticket);
    //                     });

    //                     // Display tickets by month
    //                     for (const [month, tickets] of Object.entries(ticketsByMonth)) {
    //                         worksheet.addRow([`${month} (${tickets.length} tickets)`])
    //                             .font = { bold: true, color: { argb: 'FF555555' } };
    //                         await addTicketsTable(worksheet, tickets.slice(0, 50), category);
    //                         worksheet.addRow([]);
    //                     }
    //                 }
    //             }

    //         } else if (filterType === "perYear" && summaryData[0]?.year) {
    //             // ============= YEARLY CATEGORY BREAKDOWN =============
    //             addTitle(worksheet, "Yearly Category Breakdown - All Years", 12, 6);

    //             // Sort years in ascending order
    //             const sortedSummaryData = [...summaryData].sort((a, b) => a.year - b.year);

    //             const rows = sortedSummaryData.map(item => [
    //                 item.year,
    //                 item.hardware || 0,
    //                 item.network || 0,
    //                 item.software || 0,
    //                 item.system || 0,
    //                 item.total || 0
    //             ]);

    //             // Calculate yearly totals
    //             const yearlyTotals = sortedSummaryData.reduce((acc, item) => {
    //                 acc.hardware += item.hardware || 0;
    //                 acc.network += item.network || 0;
    //                 acc.software += item.software || 0;
    //                 acc.system += item.system || 0;
    //                 acc.total += item.total || 0;
    //                 return acc;
    //             }, { hardware: 0, network: 0, software: 0, system: 0, total: 0 });

    //             rows.push([
    //                 "TOTAL ALL YEARS",
    //                 yearlyTotals.hardware,
    //                 yearlyTotals.network,
    //                 yearlyTotals.software,
    //                 yearlyTotals.system,
    //                 yearlyTotals.total
    //             ]);

    //             addStyledTable(
    //                 worksheet,
    //                 ["Year", "Hardware", "Network", "Software", "System", "Total"],
    //                 rows,
    //                 true
    //             );

    //             // ============= YEARLY PERCENTAGE ANALYSIS =============
    //             worksheet.addRow([]);
    //             worksheet.addRow([]);
    //             addTitle(worksheet, "Yearly Category Percentage Distribution", 12, 6);

    //             const percentageRows = sortedSummaryData.map(item => {
    //                 const total = item.total || 1;
    //                 return [
    //                     item.year,
    //                     `${((item.hardware || 0) / total * 100).toFixed(1)}%`,
    //                     `${((item.network || 0) / total * 100).toFixed(1)}%`,
    //                     `${((item.software || 0) / total * 100).toFixed(1)}%`,
    //                     `${((item.system || 0) / total * 100).toFixed(1)}%`,
    //                     item.total || 0
    //                 ];
    //             });

    //             addStyledTable(
    //                 worksheet,
    //                 ["Year", "Hardware %", "Network %", "Software %", "System %", "Total Tickets"],
    //                 percentageRows
    //             );

    //             // ============= YEAR-OVER-YEAR GROWTH ANALYSIS =============
    //             if (sortedSummaryData.length > 1) {
    //                 worksheet.addRow([]);
    //                 worksheet.addRow([]);
    //                 addTitle(worksheet, "Year-over-Year Growth Analysis", 12, 6);

    //                 const yoyRows = [];
    //                 for (let i = 1; i < sortedSummaryData.length; i++) {
    //                     const current = sortedSummaryData[i];
    //                     const previous = sortedSummaryData[i - 1];

    //                     const hardwareGrowth = previous.hardware > 0
    //                         ? (((current.hardware || 0) - (previous.hardware || 0)) / previous.hardware * 100).toFixed(1)
    //                         : (current.hardware > 0 ? '+100.0' : '0.0');
    //                     const networkGrowth = previous.network > 0
    //                         ? (((current.network || 0) - (previous.network || 0)) / previous.network * 100).toFixed(1)
    //                         : (current.network > 0 ? '+100.0' : '0.0');
    //                     const softwareGrowth = previous.software > 0
    //                         ? (((current.software || 0) - (previous.software || 0)) / previous.software * 100).toFixed(1)
    //                         : (current.software > 0 ? '+100.0' : '0.0');
    //                     const systemGrowth = previous.system > 0
    //                         ? (((current.system || 0) - (previous.system || 0)) / previous.system * 100).toFixed(1)
    //                         : (current.system > 0 ? '+100.0' : '0.0');
    //                     const totalGrowth = previous.total > 0
    //                         ? (((current.total || 0) - (previous.total || 0)) / previous.total * 100).toFixed(1)
    //                         : (current.total > 0 ? '+100.0' : '0.0');

    //                     yoyRows.push([
    //                         `${previous.year} → ${current.year}`,
    //                         `${hardwareGrowth}%`,
    //                         `${networkGrowth}%`,
    //                         `${softwareGrowth}%`,
    //                         `${systemGrowth}%`,
    //                         `${totalGrowth}%`
    //                     ]);
    //                 }

    //                 addStyledTable(
    //                     worksheet,
    //                     ["Period", "Hardware Growth", "Network Growth", "Software Growth", "System Growth", "Total Growth"],
    //                     yoyRows
    //                 );
    //             }

    //             // ============= DETAILED TICKETS PER CATEGORY BY YEAR =============
    //             worksheet.addRow([]);
    //             worksheet.addRow([]);
    //             addTitle(worksheet, "DETAILED TICKETS BY CATEGORY AND YEAR", 12, 6);

    //             const categories = ["hardware", "network", "software", "system"];
    //             for (const category of categories) {
    //                 const categoryTickets = filteredTickets.filter(
    //                     t => t.ticket_category?.toLowerCase() === category
    //                 );

    //                 if (categoryTickets.length > 0) {
    //                     worksheet.addRow([]);
    //                     addTitle(worksheet, `${category.toUpperCase()} TICKETS - YEARLY BREAKDOWN`, 11, 8);

    //                     // Group tickets by year
    //                     const ticketsByYear = {};
    //                     categoryTickets.forEach(ticket => {
    //                         const year = new Date(ticket.created_at).getFullYear();
    //                         if (!ticketsByYear[year]) {
    //                             ticketsByYear[year] = [];
    //                         }
    //                         ticketsByYear[year].push(ticket);
    //                     });

    //                     // Display tickets by year (descending order - newest first)
    //                     const sortedYears = Object.keys(ticketsByYear).sort((a, b) => b - a);
    //                     for (const year of sortedYears) {
    //                         const tickets = ticketsByYear[year];
    //                         worksheet.addRow([`Year ${year} (${tickets.length} tickets)`])
    //                             .font = { bold: true, color: { argb: 'FF555555' } };
    //                         await addTicketsTable(worksheet, tickets.slice(0, 100), category);
    //                         worksheet.addRow([]);
    //                     }
    //                 }
    //             }

    //         } else {
    //             // ============= REGULAR CATEGORY SUMMARY (NON-TIME BASED) =============
    //             addTitle(worksheet, "Category Summary", 12, 6);

    //             const rows = summaryData.map(item => [
    //                 item.category || "Unknown",
    //                 item.count || 0,
    //                 `${(((item.count || 0) / filteredTickets.length) * 100).toFixed(1)}%`
    //             ]);

    //             // Sort by count descending
    //             rows.sort((a, b) => b[1] - a[1]);

    //             // Add total row
    //             const totalCount = summaryData.reduce((sum, item) => sum + (item.count || 0), 0);
    //             rows.push([
    //                 "TOTAL",
    //                 totalCount,
    //                 "100%"
    //             ]);

    //             addStyledTable(
    //                 worksheet,
    //                 ["Category", "Count", "Percentage"],
    //                 rows,
    //                 true
    //             );

    //             // ============= DETAILED TICKETS PER CATEGORY =============
    //             worksheet.addRow([]);
    //             worksheet.addRow([]);
    //             addTitle(worksheet, "DETAILED TICKETS BY CATEGORY", 12, 6);

    //             const categories = ["hardware", "network", "software", "system"];
    //             for (const category of categories) {
    //                 const categoryTickets = filteredTickets.filter(
    //                     t => t.ticket_category?.toLowerCase() === category
    //                 );

    //                 if (categoryTickets.length > 0) {
    //                     worksheet.addRow([]);
    //                     addTitle(worksheet, `${category.toUpperCase()} TICKETS (${categoryTickets.length})`, 11, 8);
    //                     await addTicketsTable(worksheet, categoryTickets.slice(0, 100), category);
    //                 }
    //             }
    //         }
    //     }

    //     async function addUserAnalysisSheet(worksheet) {
    //         worksheet.columns = [
    //             { width: 25 }, // User/Period
    //             { width: 15 }, // Ticket Count
    //             { width: 15 }  // Percentage
    //         ];

    //         addTitle(worksheet, "HELPDESK USER ANALYSIS", 16, 6);
    //         addFilterInfo(worksheet, filterType, location);

    //         let userData = ticketUsersSummary;
    //         if (!Array.isArray(userData)) {
    //             userData = [userData];
    //         }

    //         if (filterType === "perMonth" && userData[0]?.month) {
    //             // Monthly user breakdown
    //             worksheet.columns = [
    //                 { width: 20 }, // Month
    //                 ...Object.keys(userData[0] || {})
    //                     .filter(k => k !== 'month' && k !== 'total')
    //                     .map(() => ({ width: 15 })),
    //                 { width: 12 } // Total
    //             ];

    //             const users = Object.keys(userData[0] || {}).filter(k => k !== 'month' && k !== 'total');
    //             const headers = ["Month", ...users, "Total"];

    //             const rows = userData.map(item => {
    //                 const row = [item.month];
    //                 users.forEach(user => row.push(item[user] || 0));
    //                 row.push(item.total || 0);
    //                 return row;
    //             });

    //             addStyledTable(worksheet, headers, rows);
    //         } else {
    //             // Summary view
    //             const rows = userData.map(item => [
    //                 item.user || "Unknown",
    //                 item.total || 0,
    //                 `${(((item.total || 0) / filteredTickets.length) * 100).toFixed(1)}%`
    //             ]);

    //             // Sort by total descending
    //             rows.sort((a, b) => b[1] - a[1]);

    //             addStyledTable(
    //                 worksheet,
    //                 ["Helpdesk User", "Tickets Handled", "Percentage"],
    //                 rows
    //             );
    //         }
    //     }

    //     async function addTicketTypeSheet(worksheet) {
    //         worksheet.columns = [
    //             { width: 20 }, // Period/Type
    //             { width: 12 }, // Incident
    //             { width: 12 }, // Request
    //             { width: 12 }, // Inquiry
    //             { width: 12 }  // Total
    //         ];

    //         addTitle(worksheet, "TICKET TYPE ANALYSIS", 16, 5);
    //         addFilterInfo(worksheet, filterType, location);

    //         let typeData = ticketTypeSummary;
    //         if (!Array.isArray(typeData)) {
    //             typeData = [typeData];
    //         }

    //         if (filterType === "perMonth" && typeData[0]?.month) {
    //             // Monthly breakdown
    //             addTitle(worksheet, `Monthly Type Breakdown - ${new Date().getFullYear()}`, 12, 5);

    //             const rows = typeData.map(item => [
    //                 item.month,
    //                 item.incident || 0,
    //                 item.request || 0,
    //                 item.inquiry || 0,
    //                 (item.incident || 0) + (item.request || 0) + (item.inquiry || 0)
    //             ]);

    //             // Calculate totals
    //             const totals = typeData.reduce((acc, item) => {
    //                 acc.incident += item.incident || 0;
    //                 acc.request += item.request || 0;
    //                 acc.inquiry += item.inquiry || 0;
    //                 return acc;
    //             }, { incident: 0, request: 0, inquiry: 0 });

    //             rows.push([
    //                 "TOTAL",
    //                 totals.incident,
    //                 totals.request,
    //                 totals.inquiry,
    //                 totals.incident + totals.request + totals.inquiry
    //             ]);

    //             addStyledTable(
    //                 worksheet,
    //                 ["Month", "Incident", "Request", "Inquiry", "Total"],
    //                 rows,
    //                 true
    //             );
    //         } else {
    //             // Summary view
    //             addTitle(worksheet, "Ticket Type Summary", 12, 5);

    //             const rows = typeData.map(item => [
    //                 item.Type || "Unknown",
    //                 item.Total || 0,
    //                 `${(((item.Total || 0) / filteredTickets.length) * 100).toFixed(1)}%`
    //             ]);

    //             addStyledTable(
    //                 worksheet,
    //                 ["Ticket Type", "Count", "Percentage"],
    //                 rows
    //             );

    //             // Add detailed tickets per type
    //             const types = ["incident", "request", "inquiry"];
    //             for (const type of types) {
    //                 const typeTickets = filteredTickets.filter(
    //                     t => t.ticket_type?.toLowerCase() === type
    //                 );

    //                 if (typeTickets.length > 0) {
    //                     worksheet.addRow([]);
    //                     addTitle(worksheet, `${type.toUpperCase()} TICKETS (${typeTickets.length})`, 11, 8);
    //                     await addTicketsTable(worksheet, typeTickets.slice(0, 100), type);
    //                 }
    //             }
    //         }
    //     }

    //     async function addTATAnalysisSheet(worksheet) {
    //         worksheet.columns = [
    //             { width: 25 }, // Category/Year/Month
    //             { width: 15 }, // 30m
    //             { width: 15 }, // 1h
    //             { width: 15 }, // 2h
    //             { width: 15 }, // 1d
    //             { width: 15 }, // 2d
    //             { width: 15 }, // 3d
    //             { width: 15 }  // Total
    //         ];

    //         addTitle(worksheet, "TURNAROUND TIME (TAT) ANALYSIS", 16, 8);
    //         addFilterInfo(worksheet, filterType, location);

    //         // Check if tatSummary is available
    //         if (!tatSummary) {
    //             worksheet.addRow(["TAT data is not available. Please wait for the chart to load or try again."]);
    //             worksheet.addRow([]);
    //             worksheet.addRow(["Current Status: TAT data is still loading or no data matches the current filter."]);
    //             return;
    //         }

    //         if (tatSummary.type === 'error') {
    //             worksheet.addRow(["Error loading TAT data:"]);
    //             worksheet.addRow([tatSummary.error || "Unknown error"]);
    //             return;
    //         }

    //         try {
    //             const tatTypes = ["30m", "1h", "2h", "1d", "2d", "3d"];

    //             if (filterType === "perYear" && tatSummary.type === 'yearly') {
    //                 // ============= YEARLY TAT SUMMARY =============
    //                 addTitle(worksheet, "Yearly TAT Summary - All Years", 14, 8);

    //                 // Main yearly summary table
    //                 const yearlyRows = tatSummary.summary.map(year => [
    //                     year.year,
    //                     year['30m'] || 0,
    //                     year['1h'] || 0,
    //                     year['2h'] || 0,
    //                     year['1d'] || 0,
    //                     year['2d'] || 0,
    //                     year['3d'] || 0,
    //                     year.total || 0
    //                 ]);

    //                 // Calculate totals across all years
    //                 const yearlyTotals = tatSummary.summary.reduce((acc, year) => {
    //                     tatTypes.forEach(t => acc[t] = (acc[t] || 0) + (year[t] || 0));
    //                     acc.total = (acc.total || 0) + (year.total || 0);
    //                     return acc;
    //                 }, {});

    //                 yearlyRows.push([
    //                     "TOTAL ALL YEARS",
    //                     yearlyTotals['30m'] || 0,
    //                     yearlyTotals['1h'] || 0,
    //                     yearlyTotals['2h'] || 0,
    //                     yearlyTotals['1d'] || 0,
    //                     yearlyTotals['2d'] || 0,
    //                     yearlyTotals['3d'] || 0,
    //                     yearlyTotals.total || 0
    //                 ]);

    //                 addStyledTable(
    //                     worksheet,
    //                     ["Year", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
    //                     yearlyRows,
    //                     true
    //                 );

    //                 // ============= YEAR-OVER-YEAR GROWTH =============
    //                 if (tatSummary.summary.length > 1) {
    //                     worksheet.addRow([]);
    //                     worksheet.addRow([]);
    //                     addTitle(worksheet, "Year-over-Year Growth Analysis", 14, 8);

    //                     const yoyRows = [];
    //                     for (let i = 1; i < tatSummary.summary.length; i++) {
    //                         const current = tatSummary.summary[i];
    //                         const previous = tatSummary.summary[i - 1];

    //                         const totalGrowth = previous.total > 0
    //                             ? (((current.total || 0) - (previous.total || 0)) / previous.total * 100).toFixed(1)
    //                             : (current.total > 0 ? '+100.0' : '0.0');

    //                         yoyRows.push([
    //                             `${previous.year} → ${current.year}`,
    //                             `${totalGrowth}%`
    //                         ]);
    //                     }

    //                     addStyledTable(
    //                         worksheet,
    //                         ["Period", "Total Tickets Growth"],
    //                         yoyRows
    //                     );
    //                 }

    //                 // ============= MONTHLY DETAILS BY YEAR =============
    //                 if (tatSummary.data && tatSummary.data.length > 0) {
    //                     worksheet.addRow([]);
    //                     worksheet.addRow([]);
    //                     addTitle(worksheet, "Monthly TAT Details by Year", 14, 8);

    //                     const monthOrder = [
    //                         "January", "February", "March", "April", "May", "June",
    //                         "July", "August", "September", "October", "November", "December"
    //                     ];

    //                     tatSummary.data.forEach(yearData => {
    //                         worksheet.addRow([]);
    //                         worksheet.addRow([`YEAR ${yearData.year} - Monthly Breakdown`])
    //                             .font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };
    //                         worksheet.addRow([]);

    //                         const monthlyRows = [];
    //                         let yearTotal = 0;

    //                         monthOrder.forEach(month => {
    //                             const monthData = yearData.months[month];
    //                             if (monthData && getTotal(monthData.tat) > 0) {
    //                                 const monthTotal = getTotal(monthData.tat);
    //                                 yearTotal += monthTotal;

    //                                 monthlyRows.push([
    //                                     month,
    //                                     monthData.tat['30m']?.length || 0,
    //                                     monthData.tat['1h']?.length || 0,
    //                                     monthData.tat['2h']?.length || 0,
    //                                     monthData.tat['1d']?.length || 0,
    //                                     monthData.tat['2d']?.length || 0,
    //                                     monthData.tat['3d']?.length || 0,
    //                                     monthTotal
    //                                 ]);
    //                             }
    //                         });

    //                         if (monthlyRows.length > 0) {
    //                             // Add month rows
    //                             addStyledTable(
    //                                 worksheet,
    //                                 ["Month", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
    //                                 monthlyRows
    //                             );

    //                             // Add year total
    //                             worksheet.addRow([`YEAR ${yearData.year} TOTAL`, "", "", "", "", "", "", yearTotal])
    //                                 .font = { bold: true };
    //                         }
    //                     });
    //                 }

    //                 // ============= CATEGORY BREAKDOWN BY YEAR =============
    //                 worksheet.addRow([]);
    //                 worksheet.addRow([]);
    //                 addTitle(worksheet, "TAT by Category - Yearly Breakdown", 14, 8);

    //                 const categories = ["hardware", "network", "software", "system", "uncategorized"];

    //                 tatSummary.data.forEach(yearData => {
    //                     worksheet.addRow([]);
    //                     worksheet.addRow([`${yearData.year} - Category Breakdown`])
    //                         .font = { bold: true, size: 11, color: { argb: 'FF008000' } };
    //                     worksheet.addRow([]);

    //                     const categoryRows = [];
    //                     let yearCategoryTotal = 0;

    //                     categories.forEach(category => {
    //                         let categoryTotal = 0;
    //                         const categoryTat = {
    //                             '30m': 0, '1h': 0, '2h': 0, '1d': 0, '2d': 0, '3d': 0
    //                         };

    //                         // Aggregate category data across all months in the year
    //                         Object.values(yearData.months).forEach(month => {
    //                             const catData = month.categories[category];
    //                             if (catData) {
    //                                 tatTypes.forEach(t => {
    //                                     const count = catData.tat[t]?.length || 0;
    //                                     categoryTat[t] += count;
    //                                     categoryTotal += count;
    //                                 });
    //                             }
    //                         });

    //                         if (categoryTotal > 0) {
    //                             categoryRows.push([
    //                                 category,
    //                                 categoryTat['30m'],
    //                                 categoryTat['1h'],
    //                                 categoryTat['2h'],
    //                                 categoryTat['1d'],
    //                                 categoryTat['2d'],
    //                                 categoryTat['3d'],
    //                                 categoryTotal
    //                             ]);
    //                             yearCategoryTotal += categoryTotal;
    //                         }
    //                     });

    //                     if (categoryRows.length > 0) {
    //                         addStyledTable(
    //                             worksheet,
    //                             ["Category", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
    //                             categoryRows
    //                         );

    //                         worksheet.addRow([`${yearData.year} TOTAL`, "", "", "", "", "", "", yearCategoryTotal])
    //                             .font = { bold: true };
    //                     }
    //                 });

    //                 // ============= TAT DISTRIBUTION SUMMARY =============
    //                 worksheet.addRow([]);
    //                 worksheet.addRow([]);
    //                 addTitle(worksheet, "TAT Distribution Summary - All Years", 14, 8);

    //                 const distributionRows = tatTypes.map(t => [
    //                     t,
    //                     yearlyTotals[t] || 0,
    //                     yearlyTotals.total > 0 ?
    //                         `${(((yearlyTotals[t] || 0) / yearlyTotals.total) * 100).toFixed(1)}%` : "0%"
    //                 ]);

    //                 addStyledTable(
    //                     worksheet,
    //                     ["TAT Range", "Count", "Percentage"],
    //                     distributionRows
    //                 );

    //                 // ============= SLA COMPLIANCE =============
    //                 worksheet.addRow([]);
    //                 addTitle(worksheet, "SLA Compliance Summary", 14, 8);

    //                 const within1Day = (yearlyTotals['30m'] || 0) + (yearlyTotals['1h'] || 0) +
    //                     (yearlyTotals['2h'] || 0) + (yearlyTotals['1d'] || 0);

    //                 const slaRows = [
    //                     ["Total Tickets with TAT", yearlyTotals.total || 0],
    //                     ["Within 30 Minutes", yearlyTotals['30m'] || 0],
    //                     ["Within 1 Hour", (yearlyTotals['30m'] || 0) + (yearlyTotals['1h'] || 0)],
    //                     ["Within 2 Hours", (yearlyTotals['30m'] || 0) + (yearlyTotals['1h'] || 0) + (yearlyTotals['2h'] || 0)],
    //                     ["Within 1 Day", within1Day],
    //                     ["SLA Compliance (1 Day)", yearlyTotals.total > 0 ?
    //                         `${((within1Day / yearlyTotals.total) * 100).toFixed(1)}%` : "0%"
    //                     ]
    //                 ];

    //                 addSimpleTable(worksheet, ["Metric", "Value"], slaRows);

    //             } else if (filterType === "perMonth" && tatSummary.type === 'monthly') {
    //                 // ============= MONTHLY TAT SUMMARY =============
    //                 addTitle(worksheet, `Monthly TAT Summary - ${new Date().getFullYear()}`, 14, 8);

    //                 const monthlyRows = tatSummary.summary.map(month => [
    //                     month.month,
    //                     month['30m'] || 0,
    //                     month['1h'] || 0,
    //                     month['2h'] || 0,
    //                     month['1d'] || 0,
    //                     month['2d'] || 0,
    //                     month['3d'] || 0,
    //                     month.total || 0
    //                 ]);

    //                 // Calculate monthly totals
    //                 const monthlyTotals = tatSummary.summary.reduce((acc, month) => {
    //                     tatTypes.forEach(t => acc[t] = (acc[t] || 0) + (month[t] || 0));
    //                     acc.total = (acc.total || 0) + (month.total || 0);
    //                     return acc;
    //                 }, {});

    //                 monthlyRows.push([
    //                     "TOTAL",
    //                     monthlyTotals['30m'] || 0,
    //                     monthlyTotals['1h'] || 0,
    //                     monthlyTotals['2h'] || 0,
    //                     monthlyTotals['1d'] || 0,
    //                     monthlyTotals['2d'] || 0,
    //                     monthlyTotals['3d'] || 0,
    //                     monthlyTotals.total || 0
    //                 ]);

    //                 addStyledTable(
    //                     worksheet,
    //                     ["Month", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
    //                     monthlyRows,
    //                     true
    //                 );

    //                 // Add category breakdown for each month
    //                 worksheet.addRow([]);
    //                 worksheet.addRow([]);
    //                 addTitle(worksheet, "Monthly Category Breakdown", 14, 8);

    //                 tatSummary.data.forEach(monthData => {
    //                     worksheet.addRow([]);
    //                     worksheet.addRow([`${monthData.month} - Category Breakdown`])
    //                         .font = { bold: true, size: 11, color: { argb: 'FF008000' } };
    //                     worksheet.addRow([]);

    //                     const categoryRows = [];
    //                     const categories = ["hardware", "network", "software", "system", "uncategorized"];

    //                     categories.forEach(category => {
    //                         const catData = monthData.categories[category];
    //                         if (catData && getTotal(catData.tat) > 0) {
    //                             categoryRows.push([
    //                                 category,
    //                                 catData.tat['30m']?.length || 0,
    //                                 catData.tat['1h']?.length || 0,
    //                                 catData.tat['2h']?.length || 0,
    //                                 catData.tat['1d']?.length || 0,
    //                                 catData.tat['2d']?.length || 0,
    //                                 catData.tat['3d']?.length || 0,
    //                                 getTotal(catData.tat)
    //                             ]);
    //                         }
    //                     });

    //                     if (categoryRows.length > 0) {
    //                         addStyledTable(
    //                             worksheet,
    //                             ["Category", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
    //                             categoryRows
    //                         );
    //                     }
    //                 });

    //             } else if (tatSummary.type === 'regular') {
    //                 // ============= REGULAR CATEGORY/SUBCATEGORY VIEW =============
    //                 addTitle(worksheet, "TAT by Category and Subcategory", 14, 8);

    //                 const categoryRows = [];

    //                 tatSummary.summary.forEach(cat => {
    //                     // Category row
    //                     categoryRows.push([
    //                         cat.category.toUpperCase(),
    //                         cat['30m'] || 0,
    //                         cat['1h'] || 0,
    //                         cat['2h'] || 0,
    //                         cat['1d'] || 0,
    //                         cat['2d'] || 0,
    //                         cat['3d'] || 0,
    //                         cat.total || 0
    //                     ]);

    //                     // Subcategory rows
    //                     (cat.subcategories || []).forEach(sub => {
    //                         categoryRows.push([
    //                             `  └─ ${sub.name}`,
    //                             sub['30m'] || 0,
    //                             sub['1h'] || 0,
    //                             sub['2h'] || 0,
    //                             sub['1d'] || 0,
    //                             sub['2d'] || 0,
    //                             sub['3d'] || 0,
    //                             sub.total || 0
    //                         ]);
    //                     });

    //                     categoryRows.push([]);
    //                 });

    //                 // Calculate grand totals
    //                 const grandTotals = tatSummary.summary.reduce((acc, cat) => {
    //                     tatTypes.forEach(t => acc[t] = (acc[t] || 0) + (cat[t] || 0));
    //                     acc.total = (acc.total || 0) + (cat.total || 0);
    //                     return acc;
    //                 }, {});

    //                 categoryRows.push([
    //                     "GRAND TOTAL",
    //                     grandTotals['30m'] || 0,
    //                     grandTotals['1h'] || 0,
    //                     grandTotals['2h'] || 0,
    //                     grandTotals['1d'] || 0,
    //                     grandTotals['2d'] || 0,
    //                     grandTotals['3d'] || 0,
    //                     grandTotals.total || 0
    //                 ]);

    //                 addStyledTable(
    //                     worksheet,
    //                     ["Category/Subcategory", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
    //                     categoryRows.filter(row => row.length > 0),
    //                     true
    //                 );
    //             }

    //         } catch (err) {
    //             console.error("Error processing TAT data:", err);
    //             worksheet.addRow(["ERROR: Unable to process TAT data"]);
    //             worksheet.addRow([err.message]);
    //         }
    //     }

    //     // Helper function for getting total from tat object (add this outside addTATAnalysisSheet)
    //     function getTotal(tat) {
    //         if (!tat) return 0;
    //         return Object.values(tat).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    //     }

    //     async function addDashboardSheet(worksheet) {
    //         worksheet.columns = [
    //             { width: 30 },
    //             { width: 20 },
    //             { width: 20 }
    //         ];

    //         addTitle(worksheet, "TICKET REPORT DASHBOARD", 18, 3);
    //         addFilterInfo(worksheet, filterType, location);

    //         worksheet.addRow([]);
    //         worksheet.addRow(["REPORT GENERATED", new Date().toLocaleString()]);
    //         worksheet.addRow([]);

    //         // Key Metrics
    //         addTitle(worksheet, "KEY METRICS", 14, 3);

    //         const openTickets = filteredTickets.filter(t => t.ticket_status?.toLowerCase() === 'open').length;
    //         const notReviewedTickets = filteredTickets.filter(t =>
    //             t.is_reviewed === false && t.ticket_status?.toLowerCase() === 'closed'
    //         ).length;
    //         const closedTickets = filteredTickets.filter(t =>
    //             t.is_reviewed === true && t.ticket_status?.toLowerCase() === 'closed'
    //         ).length;

    //         const metrics = [
    //             ["Total Tickets", filteredTickets.length, "100%"],
    //             ["Open Tickets", openTickets, `${((openTickets / filteredTickets.length) * 100).toFixed(1)}%`],
    //             ["Not Reviewed", notReviewedTickets, `${((notReviewedTickets / filteredTickets.length) * 100).toFixed(1)}%`],
    //             ["Closed & Reviewed", closedTickets, `${((closedTickets / filteredTickets.length) * 100).toFixed(1)}%`],
    //             ["Resolution Rate", `${((closedTickets + notReviewedTickets) / filteredTickets.length * 100).toFixed(1)}%`, ""],
    //             ["Review Rate", closedTickets > 0 ? `${((closedTickets / (closedTickets + notReviewedTickets)) * 100).toFixed(1)}%` : "0%", ""]
    //         ];

    //         addSimpleTable(worksheet, ["Metric", "Count", "Percentage"], metrics);

    //         // Category breakdown
    //         worksheet.addRow([]);
    //         addTitle(worksheet, "CATEGORY BREAKDOWN", 14, 3);

    //         const categories = ["hardware", "network", "software", "system"];
    //         const categoryCounts = categories.map(cat => ({
    //             category: cat,
    //             count: filteredTickets.filter(t => t.ticket_category?.toLowerCase() === cat).length
    //         }));

    //         const categoryRows = categoryCounts.map(c => [
    //             c.category,
    //             c.count,
    //             `${((c.count / filteredTickets.length) * 100).toFixed(1)}%`
    //         ]);

    //         addSimpleTable(worksheet, ["Category", "Count", "Percentage"], categoryRows);

    //         // Type breakdown
    //         worksheet.addRow([]);
    //         addTitle(worksheet, "TYPE BREAKDOWN", 14, 3);

    //         const types = ["incident", "request", "inquiry"];
    //         const typeCounts = types.map(type => ({
    //             type: type,
    //             count: filteredTickets.filter(t => t.ticket_type?.toLowerCase() === type).length
    //         }));

    //         const typeRows = typeCounts.map(t => [
    //             t.type,
    //             t.count,
    //             `${((t.count / filteredTickets.length) * 100).toFixed(1)}%`
    //         ]);

    //         addSimpleTable(worksheet, ["Type", "Count", "Percentage"], typeRows);
    //     }

    //     // ============= UTILITY FUNCTIONS =============

    //     function addTitle(worksheet, title, fontSize = 14, mergeColumns = 8) {
    //         const row = worksheet.addRow([title]);
    //         row.font = { bold: true, size: fontSize };
    //         row.alignment = { vertical: "middle", horizontal: "center" };
    //         worksheet.mergeCells(`A${row.number}:${String.fromCharCode(64 + mergeColumns)}${row.number}`);
    //         worksheet.addRow([]);
    //     }

    //     function addFilterInfo(worksheet, filterType, location) {
    //         const filterDisplay = {
    //             'today': 'Today',
    //             'thisWeek': 'This Week',
    //             'lastWeek': 'Last Week',
    //             'thisMonth': 'This Month',
    //             'perMonth': 'Per Month (Current Year)',
    //             'perYear': 'Per Year (All Years)',
    //             'all': 'All Time'
    //         };

    //         const locationDisplay = {
    //             'lmd': 'LMD Only',
    //             'corp': 'CORP Only',
    //             'all': 'LMD & CORP'
    //         };

    //         const row = worksheet.addRow([
    //             `Filter: ${filterDisplay[filterType] || filterType} | Location: ${locationDisplay[location] || location}`
    //         ]);
    //         row.font = { italic: true, color: { argb: 'FF666666' } };
    //         worksheet.addRow([]);
    //     }

    //     async function addTicketsTable(worksheet, tickets, statusType) {
    //         const rows = await Promise.all(tickets.map(async t => {
    //             let department = t.emp_department || "Unknown";

    //             // Try to fetch department if not available
    //             if (!t.emp_department && t.ticket_for) {
    //                 try {
    //                     const res = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
    //                         params: { user_name: t.ticket_for },
    //                         timeout: 2000
    //                     });
    //                     if (res.data && res.data.emp_department) {
    //                         department = res.data.emp_department;
    //                     }
    //                 } catch (err) {
    //                     // Silently fail, use Unknown
    //                 }
    //             }

    //             return [
    //                 t.ticket_id,
    //                 t.ticket_subject?.substring(0, 100) || "-",
    //                 statusType || t.ticket_status || "-",
    //                 t.assigned_to || "Unassigned",
    //                 t.ticket_for || "-",
    //                 t.assigned_location?.toUpperCase() || "-",
    //                 new Date(t.created_at).toLocaleString(),
    //                 department
    //             ];
    //         }));

    //         addStyledTable(
    //             worksheet,
    //             ["Ticket ID", "Subject", "Status", "Assigned To", "Requestor", "Location", "Date", "Department"],
    //             rows
    //         );
    //     }

    //     function addStyledTable(worksheet, headers, rows, hasTotalRow = false) {
    //         // Add header row
    //         const headerRow = worksheet.addRow(headers);
    //         headerRow.font = { bold: true, size: 11 };
    //         headerRow.alignment = { vertical: "middle", horizontal: "center" };
    //         headerRow.height = 25;
    //         headerRow.eachCell({ includeEmpty: true }, cell => {
    //             cell.fill = {
    //                 type: 'pattern',
    //                 pattern: 'solid',
    //                 fgColor: { argb: 'FF053B00' }
    //             };
    //             cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    //             cell.border = {
    //                 top: { style: "thin" },
    //                 left: { style: "thin" },
    //                 bottom: { style: "thin" },
    //                 right: { style: "thin" },
    //             };
    //         });

    //         // Add data rows
    //         const dataRows = [];
    //         rows.forEach((r, index) => {
    //             const row = worksheet.addRow(r);
    //             row.height = 20;

    //             // Apply different background for total row
    //             if (hasTotalRow && index === rows.length - 1) {
    //                 row.eachCell({ includeEmpty: true }, cell => {
    //                     cell.fill = {
    //                         type: 'pattern',
    //                         pattern: 'solid',
    //                         fgColor: { argb: 'FFF2F2F2' }
    //                     };
    //                     cell.font = { bold: true };
    //                 });
    //             }

    //             dataRows.push(row);
    //         });

    //         // Apply borders to all rows
    //         [headerRow, ...dataRows].forEach(row => {
    //             row.eachCell({ includeEmpty: true }, cell => {
    //                 cell.border = {
    //                     top: { style: "thin" },
    //                     left: { style: "thin" },
    //                     bottom: { style: "thin" },
    //                     right: { style: "thin" },
    //                 };
    //                 cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    //             });
    //         });

    //         worksheet.addRow([]);
    //     }

    //     function addSimpleTable(worksheet, headers, rows) {
    //         const headerRow = worksheet.addRow(headers);
    //         headerRow.font = { bold: true };

    //         rows.forEach(r => {
    //             worksheet.addRow(r);
    //         });

    //         worksheet.addRow([]);
    //     }

    //     async function buildDepartmentSummary() {
    //         const departmentSummary = {};
    //         const uniqueUsernames = [...new Set(filteredTickets.map(t => t.ticket_for).filter(Boolean))];
    //         const userDeptMap = {};

    //         // Batch fetch user departments (limit concurrent requests)
    //         const batchSize = 10;
    //         for (let i = 0; i < uniqueUsernames.length; i += batchSize) {
    //             const batch = uniqueUsernames.slice(i, i + batchSize);
    //             await Promise.all(batch.map(async (username) => {
    //                 try {
    //                     const res = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
    //                         params: { user_name: username },
    //                         timeout: 3000
    //                     });
    //                     if (res.data && res.data.emp_department) {
    //                         userDeptMap[username] = res.data.emp_department;
    //                     }
    //                 } catch (err) {
    //                     // Silently fail, will use fallback
    //                 }
    //             }));
    //         }

    //         // If filterType is perMonth, group by month
    //         if (filterType === "perMonth") {
    //             const monthNames = [
    //                 "January", "February", "March", "April", "May", "June",
    //                 "July", "August", "September", "October", "November", "December"
    //             ];

    //             const monthlyDepartmentSummary = {};

    //             filteredTickets.forEach(ticket => {
    //                 const ticketDate = new Date(ticket.created_at);
    //                 const month = monthNames[ticketDate.getMonth()];
    //                 const year = ticketDate.getFullYear();
    //                 const monthYear = `${month} ${year}`;

    //                 let dept = userDeptMap[ticket.ticket_for] ||
    //                     ticket.emp_department ||
    //                     ticket.department ||
    //                     "Unknown";

    //                 // Initialize month if not exists
    //                 if (!monthlyDepartmentSummary[monthYear]) {
    //                     monthlyDepartmentSummary[monthYear] = {
    //                         month: monthYear,
    //                         monthIndex: ticketDate.getMonth(),
    //                         year: year,
    //                         departments: {}
    //                     };
    //                 }

    //                 // Initialize department in month if not exists
    //                 if (!monthlyDepartmentSummary[monthYear].departments[dept]) {
    //                     monthlyDepartmentSummary[monthYear].departments[dept] = {
    //                         department: dept,
    //                         open: 0,
    //                         in_progress: 0,
    //                         assigned: 0,
    //                         resolved: 0,
    //                         closed: 0,
    //                         not_reviewed: 0,
    //                         total: 0
    //                     };
    //                 }

    //                 const deptData = monthlyDepartmentSummary[monthYear].departments[dept];
    //                 const status = ticket.ticket_status?.toLowerCase() || '';

    //                 // Count by status
    //                 if (status === 'open') {
    //                     deptData.open++;
    //                 } else if (status.includes('progress')) {
    //                     deptData.in_progress++;
    //                 } else if (status === 'assigned') {
    //                     deptData.assigned++;
    //                 } else if (status === 'resolved') {
    //                     deptData.resolved++;
    //                 } else if (status === 'closed') {
    //                     if (ticket.is_reviewed === false) {
    //                         deptData.not_reviewed++;
    //                     } else {
    //                         deptData.closed++;
    //                     }
    //                 }

    //                 deptData.total++;
    //             });

    //             // Sort months chronologically
    //             const sortedMonths = Object.values(monthlyDepartmentSummary)
    //                 .sort((a, b) => {
    //                     if (a.year !== b.year) return a.year - b.year;
    //                     return a.monthIndex - b.monthIndex;
    //                 });

    //             // Transform to include month information
    //             const result = {};
    //             sortedMonths.forEach(monthData => {
    //                 result[monthData.month] = {
    //                     departments: monthData.departments,
    //                     year: monthData.year,
    //                     monthIndex: monthData.monthIndex
    //                 };
    //             });

    //             return result;
    //         }
    //         // If filterType is perYear, group by year and month
    //         else if (filterType === "perYear") {
    //             const monthNames = [
    //                 "January", "February", "March", "April", "May", "June",
    //                 "July", "August", "September", "October", "November", "December"
    //             ];

    //             const yearlyDepartmentSummary = {};

    //             filteredTickets.forEach(ticket => {
    //                 const ticketDate = new Date(ticket.created_at);
    //                 const year = ticketDate.getFullYear().toString();
    //                 const month = monthNames[ticketDate.getMonth()];
    //                 const monthIndex = ticketDate.getMonth();

    //                 let dept = userDeptMap[ticket.ticket_for] ||
    //                     ticket.emp_department ||
    //                     ticket.department ||
    //                     "Unknown";

    //                 // Initialize year if not exists
    //                 if (!yearlyDepartmentSummary[year]) {
    //                     yearlyDepartmentSummary[year] = {
    //                         year: year,
    //                         months: {},
    //                         departments: new Set(),
    //                         yearTotal: 0
    //                     };
    //                 }

    //                 // Initialize month in year if not exists
    //                 if (!yearlyDepartmentSummary[year].months[month]) {
    //                     yearlyDepartmentSummary[year].months[month] = {
    //                         month: month,
    //                         monthIndex: monthIndex,
    //                         departments: {},
    //                         monthTotal: 0
    //                     };
    //                 }

    //                 // Initialize department in month if not exists
    //                 if (!yearlyDepartmentSummary[year].months[month].departments[dept]) {
    //                     yearlyDepartmentSummary[year].months[month].departments[dept] = {
    //                         department: dept,
    //                         open: 0,
    //                         in_progress: 0,
    //                         assigned: 0,
    //                         resolved: 0,
    //                         closed: 0,
    //                         not_reviewed: 0,
    //                         total: 0
    //                     };

    //                     // Add department to year's department set
    //                     yearlyDepartmentSummary[year].departments.add(dept);
    //                 }

    //                 const deptData = yearlyDepartmentSummary[year].months[month].departments[dept];
    //                 const status = ticket.ticket_status?.toLowerCase() || '';

    //                 // Count by status
    //                 if (status === 'open') {
    //                     deptData.open++;
    //                 } else if (status.includes('progress')) {
    //                     deptData.in_progress++;
    //                 } else if (status === 'assigned') {
    //                     deptData.assigned++;
    //                 } else if (status === 'resolved') {
    //                     deptData.resolved++;
    //                 } else if (status === 'closed') {
    //                     if (ticket.is_reviewed === false) {
    //                         deptData.not_reviewed++;
    //                     } else {
    //                         deptData.closed++;
    //                     }
    //                 }

    //                 deptData.total++;
    //                 yearlyDepartmentSummary[year].months[month].monthTotal++;
    //                 yearlyDepartmentSummary[year].yearTotal++;
    //             });

    //             // Sort years in ascending order (oldest first)
    //             const sortedYears = Object.keys(yearlyDepartmentSummary)
    //                 .sort((a, b) => parseInt(a) - parseInt(b));

    //             // Sort months within each year chronologically
    //             const result = {};
    //             sortedYears.forEach(year => {
    //                 result[year] = {
    //                     year: year,
    //                     yearTotal: yearlyDepartmentSummary[year].yearTotal,
    //                     departments: [...yearlyDepartmentSummary[year].departments].sort(),
    //                     months: Object.values(yearlyDepartmentSummary[year].months)
    //                         .sort((a, b) => a.monthIndex - b.monthIndex)
    //                 };
    //             });

    //             return result;
    //         }
    //         // Regular department summary (non-monthly, non-yearly)
    //         else {
    //             filteredTickets.forEach(ticket => {
    //                 let dept = userDeptMap[ticket.ticket_for] ||
    //                     ticket.emp_department ||
    //                     ticket.department ||
    //                     "Unknown";

    //                 if (!departmentSummary[dept]) {
    //                     departmentSummary[dept] = {
    //                         department: dept,
    //                         open: 0,
    //                         in_progress: 0,
    //                         assigned: 0,
    //                         resolved: 0,
    //                         closed: 0,
    //                         not_reviewed: 0,
    //                         total: 0
    //                     };
    //                 }

    //                 const status = ticket.ticket_status?.toLowerCase() || '';

    //                 if (status === 'open') {
    //                     departmentSummary[dept].open++;
    //                 } else if (status.includes('progress')) {
    //                     departmentSummary[dept].in_progress++;
    //                 } else if (status === 'assigned') {
    //                     departmentSummary[dept].assigned++;
    //                 } else if (status === 'resolved') {
    //                     departmentSummary[dept].resolved++;
    //                 } else if (status === 'closed') {
    //                     if (ticket.is_reviewed === false) {
    //                         departmentSummary[dept].not_reviewed++;
    //                     } else {
    //                         departmentSummary[dept].closed++;
    //                     }
    //                 }

    //                 departmentSummary[dept].total++;
    //             });

    //             return departmentSummary;
    //         }
    //     }
    // };

    //Download Excel
    const handleDownloadExcel = async () => {
        const workbook = new ExcelJS.Workbook();

        try {
            // Show loading indicator if you have one
            // setLoading(true);

            // ============= 1. TICKETS BY STATUS SHEET =============
            const ticketsSheet = workbook.addWorksheet("Tickets by Status");
            await addTicketsByStatusSheet(ticketsSheet);

            // ============= 2. TICKET STATUS BY SUBCATEGORY SHEET =============
            const tableSubcatSheet = workbook.addWorksheet("Ticket Status by Subcategory");
            await addTableSubcategorySheet(tableSubcatSheet);

            // ============= 3. DEPARTMENT SUMMARY SHEET =============
            const deptSheet = workbook.addWorksheet("Department Summary");
            await addDepartmentSummarySheet(deptSheet);

            // ============= 4. CATEGORY ANALYSIS SHEET =============
            if (ticketCategorySummary) {
                const categorySheet = workbook.addWorksheet("Category Analysis");
                await addCategoryAnalysisSheet(categorySheet);
            }

            // ============= 5. USER ANALYSIS SHEET =============
            if (ticketUsersSummary) {
                const userSheet = workbook.addWorksheet("User Analysis");
                await addUserAnalysisSheet(userSheet);
            }

            // ============= 6. TICKET TYPE ANALYSIS SHEET =============
            if (ticketTypeSummary) {
                const typeSheet = workbook.addWorksheet("Ticket Type Analysis");
                await addTicketTypeSheet(typeSheet);
            }

            // ============= 7. TAT ANALYSIS SHEET =============
            const tatSheet = workbook.addWorksheet("TAT Analysis");
            await addTATAnalysisSheet(tatSheet);

            // ============= SAVE FILE =============
            const buffer = await workbook.xlsx.writeBuffer();
            const fileName = `Ticket_Report_${new Date().toISOString().split('T')[0]}_${filterType}_${location || 'all'}.xlsx`;
            saveAs(new Blob([buffer]), fileName);

        } catch (error) {
            console.error("Error generating Excel file:", error);
            alert("Error generating Excel file. Please check the console for details.");
        } finally {
            // setLoading(false);
        }

        // ============= HELPER FUNCTIONS =============

        async function addTicketsByStatusSheet(worksheet) {
            // Set column widths
            worksheet.columns = [
                { width: 15 }, // Ticket ID
                { width: 40 }, // Subject
                { width: 20 }, // Status
                { width: 20 }, // Assigned To
                { width: 20 }, // Requestor
                { width: 15 }, // Location
                { width: 20 }, // Date
                { width: 15 }  // Department
            ];

            addTitle(worksheet, "TICKETS BY STATUS REPORT", 16, 8);
            addFilterInfo(worksheet, filterType, location);

            // ============= SUMMARY STATISTICS AT THE TOP =============
            worksheet.addRow([]);
            addTitle(worksheet, "SUMMARY STATISTICS", 14, 8);

            const openTickets = filteredTickets.filter(t => t.ticket_status?.toLowerCase() === 'open');
            const notReviewedTickets = filteredTickets.filter(t =>
                t.is_reviewed === false && t.ticket_status?.toLowerCase() === 'closed'
            );
            const closedTickets = filteredTickets.filter(t =>
                t.is_reviewed === true && t.ticket_status?.toLowerCase() === 'closed'
            );

            const summaryRows = [
                ["Total Open Tickets", openTickets.length],
                ["Total Not Reviewed Tickets", notReviewedTickets.length],
                ["Total Closed & Reviewed Tickets", closedTickets.length],
                ["Total Tickets", filteredTickets.length]
            ];

            addSimpleTable(worksheet, ["Status", "Count"], summaryRows);

            // Add a blank row after summary
            worksheet.addRow([]);
            worksheet.addRow([]);

            // ============= DETAILED TICKETS BY STATUS =============

            // 1. OPEN TICKETS
            if (openTickets.length > 0) {
                addTitle(worksheet, `OPEN TICKETS (${openTickets.length})`, 12, 8);
                await addTicketsTable(worksheet, openTickets, "Open");
                worksheet.addRow([]);
            }

            // 2. NOT REVIEWED TICKETS
            if (notReviewedTickets.length > 0) {
                addTitle(worksheet, `NOT REVIEWED TICKETS (${notReviewedTickets.length})`, 12, 8);
                await addTicketsTable(worksheet, notReviewedTickets, "Not Reviewed");
                worksheet.addRow([]);
            }

            // 3. CLOSED TICKETS (REVIEWED)
            if (closedTickets.length > 0) {
                addTitle(worksheet, `CLOSED & REVIEWED TICKETS (${closedTickets.length})`, 12, 8);
                await addTicketsTable(worksheet, closedTickets, "Closed");
            }
        }

        // ============= TICKET STATUS BY SUBCATEGORY SHEET =============
        async function addTableSubcategorySheet(worksheet) {
            // Set column widths
            worksheet.columns = [
                { width: 25 }, // Period/Subcategory
                { width: 12 }, // Total
                { width: 12 }, // Resolved
                { width: 12 }, // Closed
                { width: 12 }, // Open
            ];

            addTitle(worksheet, "TICKET STATUS BY SUBCATEGORY", 16, 6);
            addFilterInfo(worksheet, filterType, location);

            // ============= TICKET STATUS TABLE =============
            addTitle(worksheet, "Ticket Status Breakdown", 14, 6);

            // Prepare headers based on filter type
            let headers;
            if (filterType === "perMonth") {
                headers = ["Month", "Total", "Resolved", "Closed", "Open"];
            } else if (filterType === "perYear") {
                headers = ["Year", "Total", "Resolved", "Closed", "Open"];
            } else {
                headers = ["Subcategory", "Total", "Resolved", "Closed", "Open"];
            }

            // Prepare rows from stats data
            const tableRows = stats.map(row => {
                if (filterType === "perMonth") {
                    return [
                        row.period,
                        row.total || 0,
                        row.resolved || 0,
                        row.closed || 0,
                        row.open || 0,
                    ];
                } else if (filterType === "perYear") {
                    return [
                        row.period,
                        row.total || 0,
                        row.resolved || 0,
                        row.closed || 0,
                        row.open || 0,
                    ];
                } else {
                    return [
                        row.subcategory,
                        row.total || 0,
                        row.resolved || 0,
                        row.closed || 0,
                        row.open || 0,
                    ];
                }
            });

            // Add total row
            const totalRow = stats.reduce(
                (totals, row) => {
                    totals.total += row.total || 0;
                    totals.resolved += row.resolved || 0;
                    totals.closed += row.closed || 0;
                    totals.open += row.open || 0;
                    return totals;
                },
                { total: 0, resolved: 0, closed: 0, open: 0 }
            );

            tableRows.push([
                filterType === "perMonth" ? "TOTAL ALL MONTHS" :
                    filterType === "perYear" ? "TOTAL ALL YEARS" : "TOTAL ALL SUBCATEGORIES",
                totalRow.total,
                totalRow.resolved,
                totalRow.closed,
                totalRow.open,
            ]);

            addStyledTable(worksheet, headers, tableRows, true);

            // ============= QUICK STATISTICS =============
            worksheet.addRow([]);
            worksheet.addRow([]);
            addTitle(worksheet, "QUICK STATISTICS", 14, 6);

            const openCount = filteredTickets.filter(t => t.ticket_status?.toLowerCase() === 'open').length;
            const notReviewedCount = filteredTickets.filter(t => t.is_reviewed === false && t.ticket_status?.toLowerCase() === 'closed').length;
            const closedCount = filteredTickets.filter(t => t.is_reviewed === true && t.ticket_status?.toLowerCase() === 'closed').length;
            const resolvedCount = filteredTickets.filter(t => t.ticket_status?.toLowerCase() === 'resolved').length;
            const inProgressCount = filteredTickets.filter(t => t.ticket_status?.toLowerCase().includes('progress')).length;
            const assignedCount = filteredTickets.filter(t => t.ticket_status?.toLowerCase() === 'assigned').length;

            const quickStats = [
                ["Total Tickets", filteredTickets.length],
                ["Open Tickets", openCount],
                ["In Progress", inProgressCount],
                ["Assigned", assignedCount],
                ["Resolved", resolvedCount],
                ["Not Reviewed (Closed but not reviewed)", notReviewedCount],
                ["Closed & Reviewed", closedCount],
            ];

            addSimpleTable(worksheet, ["Metric", "Value"], quickStats);
        }

        async function addDepartmentSummarySheet(worksheet) {
            worksheet.columns = [
                { width: 25 }, // Year/Month/Department
                { width: 12 }, // Open
                { width: 15 }, // In Progress
                { width: 12 }, // Assigned
                { width: 12 }, // Resolved
                { width: 12 }, // Closed
                { width: 15 }, // Not Reviewed
                { width: 12 }  // Total
            ];

            addTitle(worksheet, "DEPARTMENT SUMMARY REPORT", 16, 8);
            addFilterInfo(worksheet, filterType, location);

            // Get department data
            const departmentSummary = await buildDepartmentSummary();

            if (filterType === "perMonth") {
                // Handle monthly breakdown
                addTitle(worksheet, "Monthly Department Breakdown", 12, 8);

                for (const [month, monthData] of Object.entries(departmentSummary)) {
                    worksheet.addRow([]);
                    worksheet.addRow([`${month}`]).font = { bold: true, size: 11, color: { argb: 'FF0066CC' } };
                    worksheet.addRow([]);

                    const deptRows = [];
                    let monthTotals = {
                        open: 0, in_progress: 0, assigned: 0,
                        resolved: 0, closed: 0, not_reviewed: 0, total: 0
                    };

                    // Sort departments alphabetically
                    const sortedDepts = Object.keys(monthData.departments).sort();

                    sortedDepts.forEach(dept => {
                        const data = monthData.departments[dept];
                        deptRows.push([
                            dept,
                            data.open || 0,
                            data.in_progress || 0,
                            data.assigned || 0,
                            data.resolved || 0,
                            data.closed || 0,
                            data.not_reviewed || 0,
                            data.total || 0
                        ]);

                        monthTotals.open += data.open || 0;
                        monthTotals.in_progress += data.in_progress || 0;
                        monthTotals.assigned += data.assigned || 0;
                        monthTotals.resolved += data.resolved || 0;
                        monthTotals.closed += data.closed || 0;
                        monthTotals.not_reviewed += data.not_reviewed || 0;
                        monthTotals.total += data.total || 0;
                    });

                    // Add total row for the month
                    deptRows.push([
                        "MONTH TOTAL",
                        monthTotals.open,
                        monthTotals.in_progress,
                        monthTotals.assigned,
                        monthTotals.resolved,
                        monthTotals.closed,
                        monthTotals.not_reviewed,
                        monthTotals.total
                    ]);

                    addStyledTable(
                        worksheet,
                        ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
                        deptRows,
                        true // has total row
                    );
                }

                // Note: OVERALL SUMMARY - ALL MONTHS section has been removed as requested

            }
            else if (filterType === "perYear") {
                // Handle yearly breakdown
                addTitle(worksheet, "Yearly Department Breakdown", 12, 8);

                // Sort years in ascending order
                const sortedYears = Object.keys(departmentSummary).sort((a, b) => parseInt(a) - parseInt(b));

                for (const year of sortedYears) {
                    const yearData = departmentSummary[year];

                    worksheet.addRow([]);
                    worksheet.addRow([`YEAR ${year} - Total Tickets: ${yearData.yearTotal}`])
                        .font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };
                    worksheet.addRow([]);

                    // Monthly breakdown for this year
                    yearData.months.forEach(monthData => {
                        if (Object.keys(monthData.departments).length === 0) return;

                        worksheet.addRow([`  ${monthData.month} (Month Total: ${monthData.monthTotal})`])
                            .font = { bold: true, size: 10, color: { argb: 'FF555555' } };
                        worksheet.addRow([]);

                        const deptRows = [];
                        let monthTotals = {
                            open: 0, in_progress: 0, assigned: 0,
                            resolved: 0, closed: 0, not_reviewed: 0, total: 0
                        };

                        // Sort departments alphabetically
                        const sortedDepts = Object.keys(monthData.departments).sort();

                        sortedDepts.forEach(dept => {
                            const data = monthData.departments[dept];
                            deptRows.push([
                                `    ${dept}`,
                                data.open || 0,
                                data.in_progress || 0,
                                data.assigned || 0,
                                data.resolved || 0,
                                data.closed || 0,
                                data.not_reviewed || 0,
                                data.total || 0
                            ]);

                            monthTotals.open += data.open || 0;
                            monthTotals.in_progress += data.in_progress || 0;
                            monthTotals.assigned += data.assigned || 0;
                            monthTotals.resolved += data.resolved || 0;
                            monthTotals.closed += data.closed || 0;
                            monthTotals.not_reviewed += data.not_reviewed || 0;
                            monthTotals.total += data.total || 0;
                        });

                        // Add total row for the month
                        deptRows.push([
                            "    MONTH TOTAL",
                            monthTotals.open,
                            monthTotals.in_progress,
                            monthTotals.assigned,
                            monthTotals.resolved,
                            monthTotals.closed,
                            monthTotals.not_reviewed,
                            monthTotals.total
                        ]);

                        addStyledTable(
                            worksheet,
                            ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
                            deptRows,
                            true
                        );

                        worksheet.addRow([]);
                    });

                    // Yearly summary for this year
                    worksheet.addRow([]);
                    worksheet.addRow([`YEAR ${year} - SUMMARY`])
                        .font = { bold: true, size: 11, color: { argb: 'FF008000' } };
                    worksheet.addRow([]);

                    // Aggregate yearly totals by department
                    const yearlyDeptSummary = {};
                    let yearlyTotals = {
                        open: 0, in_progress: 0, assigned: 0,
                        resolved: 0, closed: 0, not_reviewed: 0, total: 0
                    };

                    yearData.months.forEach(monthData => {
                        Object.entries(monthData.departments).forEach(([dept, data]) => {
                            if (!yearlyDeptSummary[dept]) {
                                yearlyDeptSummary[dept] = {
                                    open: 0, in_progress: 0, assigned: 0,
                                    resolved: 0, closed: 0, not_reviewed: 0, total: 0
                                };
                            }

                            yearlyDeptSummary[dept].open += data.open || 0;
                            yearlyDeptSummary[dept].in_progress += data.in_progress || 0;
                            yearlyDeptSummary[dept].assigned += data.assigned || 0;
                            yearlyDeptSummary[dept].resolved += data.resolved || 0;
                            yearlyDeptSummary[dept].closed += data.closed || 0;
                            yearlyDeptSummary[dept].not_reviewed += data.not_reviewed || 0;
                            yearlyDeptSummary[dept].total += data.total || 0;
                        });
                    });

                    const yearlyRows = [];
                    Object.keys(yearlyDeptSummary).sort().forEach(dept => {
                        const data = yearlyDeptSummary[dept];
                        yearlyRows.push([
                            dept,
                            data.open,
                            data.in_progress,
                            data.assigned,
                            data.resolved,
                            data.closed,
                            data.not_reviewed,
                            data.total
                        ]);

                        yearlyTotals.open += data.open;
                        yearlyTotals.in_progress += data.in_progress;
                        yearlyTotals.assigned += data.assigned;
                        yearlyTotals.resolved += data.resolved;
                        yearlyTotals.closed += data.closed;
                        yearlyTotals.not_reviewed += data.not_reviewed;
                        yearlyTotals.total += data.total;
                    });

                    yearlyRows.push([
                        "YEAR TOTAL",
                        yearlyTotals.open,
                        yearlyTotals.in_progress,
                        yearlyTotals.assigned,
                        yearlyTotals.resolved,
                        yearlyTotals.closed,
                        yearlyTotals.not_reviewed,
                        yearlyTotals.total
                    ]);

                    addStyledTable(
                        worksheet,
                        ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
                        yearlyRows,
                        true
                    );

                    worksheet.addRow([]);
                    worksheet.addRow([]);
                }

                // Add overall summary for all years
                worksheet.addRow([]);
                worksheet.addRow([]);
                addTitle(worksheet, "OVERALL SUMMARY - ALL YEARS", 12, 8);

                const overallSummary = {};
                let grandTotals = {
                    open: 0, in_progress: 0, assigned: 0,
                    resolved: 0, closed: 0, not_reviewed: 0, total: 0
                };

                // Aggregate all years
                for (const yearData of Object.values(departmentSummary)) {
                    yearData.months.forEach(monthData => {
                        Object.entries(monthData.departments).forEach(([dept, data]) => {
                            if (!overallSummary[dept]) {
                                overallSummary[dept] = {
                                    open: 0, in_progress: 0, assigned: 0,
                                    resolved: 0, closed: 0, not_reviewed: 0, total: 0
                                };
                            }

                            overallSummary[dept].open += data.open || 0;
                            overallSummary[dept].in_progress += data.in_progress || 0;
                            overallSummary[dept].assigned += data.assigned || 0;
                            overallSummary[dept].resolved += data.resolved || 0;
                            overallSummary[dept].closed += data.closed || 0;
                            overallSummary[dept].not_reviewed += data.not_reviewed || 0;
                            overallSummary[dept].total += data.total || 0;
                        });
                    });
                }

                // Create overall summary rows
                const overallRows = [];
                Object.keys(overallSummary).sort().forEach(dept => {
                    const data = overallSummary[dept];
                    overallRows.push([
                        dept,
                        data.open,
                        data.in_progress,
                        data.assigned,
                        data.resolved,
                        data.closed,
                        data.not_reviewed,
                        data.total
                    ]);

                    grandTotals.open += data.open;
                    grandTotals.in_progress += data.in_progress;
                    grandTotals.assigned += data.assigned;
                    grandTotals.resolved += data.resolved;
                    grandTotals.closed += data.closed;
                    grandTotals.not_reviewed += data.not_reviewed;
                    grandTotals.total += data.total;
                });

                overallRows.push([
                    "GRAND TOTAL",
                    grandTotals.open,
                    grandTotals.in_progress,
                    grandTotals.assigned,
                    grandTotals.resolved,
                    grandTotals.closed,
                    grandTotals.not_reviewed,
                    grandTotals.total
                ]);

                addStyledTable(
                    worksheet,
                    ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
                    overallRows,
                    true
                );

            } else {
                // Regular department summary (non-monthly, non-yearly)
                // Sort departments alphabetically
                const sortedDepartments = Object.keys(departmentSummary).sort();

                // Prepare rows
                const deptRows = [];
                sortedDepartments.forEach(dept => {
                    const data = departmentSummary[dept];
                    deptRows.push([
                        dept,
                        data.open || 0,
                        data.in_progress || 0,
                        data.assigned || 0,
                        data.resolved || 0,
                        data.closed || 0,
                        data.not_reviewed || 0,
                        data.total || 0
                    ]);
                });

                // Calculate totals
                const totals = {
                    open: 0, in_progress: 0, assigned: 0,
                    resolved: 0, closed: 0, not_reviewed: 0, total: 0
                };

                sortedDepartments.forEach(dept => {
                    const data = departmentSummary[dept];
                    totals.open += data.open || 0;
                    totals.in_progress += data.in_progress || 0;
                    totals.assigned += data.assigned || 0;
                    totals.resolved += data.resolved || 0;
                    totals.closed += data.closed || 0;
                    totals.not_reviewed += data.not_reviewed || 0;
                    totals.total += data.total || 0;
                });

                // Add total row
                deptRows.push([
                    "TOTAL",
                    totals.open,
                    totals.in_progress,
                    totals.assigned,
                    totals.resolved,
                    totals.closed,
                    totals.not_reviewed,
                    totals.total
                ]);

                addStyledTable(
                    worksheet,
                    ["Department", "Open", "In Progress", "Assigned", "Resolved", "Closed", "Not Reviewed", "Total"],
                    deptRows,
                    true // has total row
                );
            }
        }

        async function addCategoryAnalysisSheet(worksheet) {
            worksheet.columns = [
                { width: 20 }, // Category/Period
                { width: 12 }, // Hardware
                { width: 12 }, // Network
                { width: 12 }, // application
                { width: 12 }, // System
                { width: 12 }  // Total
            ];

            addTitle(worksheet, "CATEGORY ANALYSIS REPORT", 16, 6);
            addFilterInfo(worksheet, filterType, location);

            let summaryData = ticketCategorySummary;
            if (!Array.isArray(summaryData)) {
                summaryData = [summaryData];
            }

            if (filterType === "perMonth" && summaryData[0]?.month) {
                // ============= MONTHLY CATEGORY BREAKDOWN =============
                addTitle(worksheet, `Monthly Category Breakdown - Current Year`, 12, 6);

                // Create monthly breakdown table
                const rows = summaryData.map(item => [
                    item.month,
                    item.hardware || 0,
                    item.network || 0,
                    item.application || 0,
                    item.system || 0,
                    item.total || 0
                ]);

                // Calculate monthly totals
                const monthlyTotals = summaryData.reduce((acc, item) => {
                    acc.hardware += item.hardware || 0;
                    acc.network += item.network || 0;
                    acc.application += item.application || 0;
                    acc.system += item.system || 0;
                    acc.total += item.total || 0;
                    return acc;
                }, { hardware: 0, network: 0, application: 0, system: 0, total: 0 });

                rows.push([
                    "TOTAL",
                    monthlyTotals.hardware,
                    monthlyTotals.network,
                    monthlyTotals.application,
                    monthlyTotals.system,
                    monthlyTotals.total
                ]);

                addStyledTable(
                    worksheet,
                    ["Month", "Hardware", "Network", "Application", "System", "Total"],
                    rows,
                    true // has total row
                );

                // ============= DETAILED TICKETS PER CATEGORY BY MONTH =============
                worksheet.addRow([]);
                worksheet.addRow([]);
                addTitle(worksheet, "DETAILED TICKETS BY CATEGORY AND MONTH", 12, 6);

                const categories = ["hardware", "network", "application", "system"];
                for (const category of categories) {
                    // Get tickets for this category
                    const categoryTickets = filteredTickets.filter(
                        t => t.ticket_category?.toLowerCase() === category
                    );

                    if (categoryTickets.length > 0) {
                        worksheet.addRow([]);
                        addTitle(worksheet, `${category.toUpperCase()} TICKETS - MONTHLY BREAKDOWN`, 11, 8);

                        // Group tickets by month
                        const monthNames = [
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                        ];

                        const ticketsByMonth = {};
                        categoryTickets.forEach(ticket => {
                            const date = new Date(ticket.created_at);
                            const month = monthNames[date.getMonth()];
                            if (!ticketsByMonth[month]) {
                                ticketsByMonth[month] = [];
                            }
                            ticketsByMonth[month].push(ticket);
                        });

                        // Display tickets by month
                        for (const [month, tickets] of Object.entries(ticketsByMonth)) {
                            worksheet.addRow([`${month} (${tickets.length} tickets)`])
                                .font = { bold: true, color: { argb: 'FF555555' } };
                            await addTicketsTable(worksheet, tickets.slice(0, 50), category);
                            worksheet.addRow([]);
                        }
                    }
                }

            } else if (filterType === "perYear" && summaryData[0]?.year) {
                // ============= YEARLY CATEGORY BREAKDOWN =============
                addTitle(worksheet, "Yearly Category Breakdown - All Years", 12, 6);

                // Sort years in ascending order
                const sortedSummaryData = [...summaryData].sort((a, b) => a.year - b.year);

                const rows = sortedSummaryData.map(item => [
                    item.year,
                    item.hardware || 0,
                    item.network || 0,
                    item.application || 0,
                    item.system || 0,
                    item.total || 0
                ]);

                // Calculate yearly totals
                const yearlyTotals = sortedSummaryData.reduce((acc, item) => {
                    acc.hardware += item.hardware || 0;
                    acc.network += item.network || 0;
                    acc.application += item.application || 0;
                    acc.system += item.system || 0;
                    acc.total += item.total || 0;
                    return acc;
                }, { hardware: 0, network: 0, application: 0, system: 0, total: 0 });

                rows.push([
                    "TOTAL ALL YEARS",
                    yearlyTotals.hardware,
                    yearlyTotals.network,
                    yearlyTotals.application,
                    yearlyTotals.system,
                    yearlyTotals.total
                ]);

                addStyledTable(
                    worksheet,
                    ["Year", "Hardware", "Network", "Application", "System", "Total"],
                    rows,
                    true
                );

                // ============= DETAILED TICKETS PER CATEGORY BY YEAR =============
                worksheet.addRow([]);
                worksheet.addRow([]);
                addTitle(worksheet, "DETAILED TICKETS BY CATEGORY AND YEAR", 12, 6);

                const categories = ["hardware", "network", "softapplicationware", "system"];
                for (const category of categories) {
                    const categoryTickets = filteredTickets.filter(
                        t => t.ticket_category?.toLowerCase() === category
                    );

                    if (categoryTickets.length > 0) {
                        worksheet.addRow([]);
                        addTitle(worksheet, `${category.toUpperCase()} TICKETS - YEARLY BREAKDOWN`, 11, 8);

                        // Group tickets by year
                        const ticketsByYear = {};
                        categoryTickets.forEach(ticket => {
                            const year = new Date(ticket.created_at).getFullYear();
                            if (!ticketsByYear[year]) {
                                ticketsByYear[year] = [];
                            }
                            ticketsByYear[year].push(ticket);
                        });

                        // Display tickets by year (descending order - newest first)
                        const sortedYears = Object.keys(ticketsByYear).sort((a, b) => b - a);
                        for (const year of sortedYears) {
                            const tickets = ticketsByYear[year];
                            worksheet.addRow([`Year ${year} (${tickets.length} tickets)`])
                                .font = { bold: true, color: { argb: 'FF555555' } };
                            await addTicketsTable(worksheet, tickets.slice(0, 100), category);
                            worksheet.addRow([]);
                        }
                    }
                }

            } else {
                // ============= REGULAR CATEGORY SUMMARY (NON-TIME BASED) =============
                addTitle(worksheet, "Category Summary", 12, 6);

                const rows = summaryData.map(item => [
                    item.category || "Unknown",
                    item.count || 0,
                    `${(((item.count || 0) / filteredTickets.length) * 100).toFixed(1)}%`
                ]);

                // Sort by count descending
                rows.sort((a, b) => b[1] - a[1]);

                // Add total row
                const totalCount = summaryData.reduce((sum, item) => sum + (item.count || 0), 0);
                rows.push([
                    "TOTAL",
                    totalCount,
                    "100%"
                ]);

                addStyledTable(
                    worksheet,
                    ["Category", "Count", "Percentage"],
                    rows,
                    true
                );

                // ============= DETAILED TICKETS PER CATEGORY =============
                worksheet.addRow([]);
                worksheet.addRow([]);
                addTitle(worksheet, "DETAILED TICKETS BY CATEGORY", 12, 6);

                const categories = ["hardware", "network", "application", "system"];
                for (const category of categories) {
                    const categoryTickets = filteredTickets.filter(
                        t => t.ticket_category?.toLowerCase() === category
                    );

                    if (categoryTickets.length > 0) {
                        worksheet.addRow([]);
                        addTitle(worksheet, `${category.toUpperCase()} TICKETS (${categoryTickets.length})`, 11, 8);
                        await addTicketsTable(worksheet, categoryTickets.slice(0, 100), category);
                    }
                }
            }
        }

        async function addUserAnalysisSheet(worksheet) {
            worksheet.columns = [
                { width: 25 }, // User/Period
                { width: 15 }, // Ticket Count
                { width: 15 }  // Percentage
            ];

            addTitle(worksheet, "HELPDESK USER ANALYSIS", 16, 6);
            addFilterInfo(worksheet, filterType, location);

            let userData = ticketUsersSummary;
            if (!Array.isArray(userData)) {
                userData = [userData];
            }

            if (filterType === "perMonth" && userData[0]?.month) {
                // Monthly user breakdown
                worksheet.columns = [
                    { width: 20 }, // Month
                    ...Object.keys(userData[0] || {})
                        .filter(k => k !== 'month' && k !== 'total')
                        .map(() => ({ width: 15 })),
                    { width: 12 } // Total
                ];

                const users = Object.keys(userData[0] || {}).filter(k => k !== 'month' && k !== 'total');
                const headers = ["Month", ...users, "Total"];

                const rows = userData.map(item => {
                    const row = [item.month];
                    users.forEach(user => row.push(item[user] || 0));
                    row.push(item.total || 0);
                    return row;
                });

                addStyledTable(worksheet, headers, rows);
            } else {
                // Summary view
                const rows = userData.map(item => [
                    item.user || "Unknown",
                    item.total || 0,
                    `${(((item.total || 0) / filteredTickets.length) * 100).toFixed(1)}%`
                ]);

                // Sort by total descending
                rows.sort((a, b) => b[1] - a[1]);

                addStyledTable(
                    worksheet,
                    ["Helpdesk User", "Tickets Handled", "Percentage"],
                    rows
                );
            }
        }

        async function addTicketTypeSheet(worksheet) {
            worksheet.columns = [
                { width: 20 }, // Period/Type
                { width: 12 }, // Incident
                { width: 12 }, // Request
                { width: 12 }, // Inquiry
                { width: 12 }  // Total
            ];

            addTitle(worksheet, "TICKET TYPE ANALYSIS", 16, 5);
            addFilterInfo(worksheet, filterType, location);

            let typeData = ticketTypeSummary;
            if (!Array.isArray(typeData)) {
                typeData = [typeData];
            }

            if (filterType === "perMonth" && typeData[0]?.month) {
                // Monthly breakdown
                addTitle(worksheet, `Monthly Type Breakdown - ${new Date().getFullYear()}`, 12, 5);

                const rows = typeData.map(item => [
                    item.month,
                    item.incident || 0,
                    item.request || 0,
                    item.inquiry || 0,
                    (item.incident || 0) + (item.request || 0) + (item.inquiry || 0)
                ]);

                // Calculate totals
                const totals = typeData.reduce((acc, item) => {
                    acc.incident += item.incident || 0;
                    acc.request += item.request || 0;
                    acc.inquiry += item.inquiry || 0;
                    return acc;
                }, { incident: 0, request: 0, inquiry: 0 });

                rows.push([
                    "TOTAL",
                    totals.incident,
                    totals.request,
                    totals.inquiry,
                    totals.incident + totals.request + totals.inquiry
                ]);

                addStyledTable(
                    worksheet,
                    ["Month", "Incident", "Request", "Inquiry", "Total"],
                    rows,
                    true
                );
            } else {
                // Summary view
                addTitle(worksheet, "Ticket Type Summary", 12, 5);

                const rows = typeData.map(item => [
                    item.Type || "Unknown",
                    item.Total || 0,
                    `${(((item.Total || 0) / filteredTickets.length) * 100).toFixed(1)}%`
                ]);

                addStyledTable(
                    worksheet,
                    ["Ticket Type", "Count", "Percentage"],
                    rows
                );

                // Add detailed tickets per type
                const types = ["incident", "request", "inquiry"];
                for (const type of types) {
                    const typeTickets = filteredTickets.filter(
                        t => t.ticket_type?.toLowerCase() === type
                    );

                    if (typeTickets.length > 0) {
                        worksheet.addRow([]);
                        addTitle(worksheet, `${type.toUpperCase()} TICKETS (${typeTickets.length})`, 11, 8);
                        await addTicketsTable(worksheet, typeTickets.slice(0, 100), type);
                    }
                }
            }
        }

        async function addTATAnalysisSheet(worksheet) {
            worksheet.columns = [
                { width: 25 }, // Category/Year/Month
                { width: 15 }, // 30m
                { width: 15 }, // 1h
                { width: 15 }, // 2h
                { width: 15 }, // 1d
                { width: 15 }, // 2d
                { width: 15 }, // 3d
                { width: 15 }  // Total
            ];

            addTitle(worksheet, "TURNAROUND TIME (TAT) ANALYSIS", 16, 8);
            addFilterInfo(worksheet, filterType, location);

            // Check if tatSummary is available
            if (!tatSummary) {
                worksheet.addRow(["TAT data is not available. Please wait for the chart to load or try again."]);
                worksheet.addRow([]);
                worksheet.addRow(["Current Status: TAT data is still loading or no data matches the current filter."]);
                return;
            }

            if (tatSummary.type === 'error') {
                worksheet.addRow(["Error loading TAT data:"]);
                worksheet.addRow([tatSummary.error || "Unknown error"]);
                return;
            }

            try {
                const tatTypes = ["30m", "1h", "2h", "1d", "2d", "3d"];

                if (filterType === "perYear" && tatSummary.type === 'yearly') {
                    // ============= YEARLY TAT SUMMARY =============
                    addTitle(worksheet, "Yearly TAT Summary - All Years", 14, 8);

                    // Main yearly summary table
                    const yearlyRows = tatSummary.summary.map(year => [
                        year.year,
                        year['30m'] || 0,
                        year['1h'] || 0,
                        year['2h'] || 0,
                        year['1d'] || 0,
                        year['2d'] || 0,
                        year['3d'] || 0,
                        year.total || 0
                    ]);

                    // Calculate totals across all years
                    const yearlyTotals = tatSummary.summary.reduce((acc, year) => {
                        tatTypes.forEach(t => acc[t] = (acc[t] || 0) + (year[t] || 0));
                        acc.total = (acc.total || 0) + (year.total || 0);
                        return acc;
                    }, {});

                    yearlyRows.push([
                        "TOTAL ALL YEARS",
                        yearlyTotals['30m'] || 0,
                        yearlyTotals['1h'] || 0,
                        yearlyTotals['2h'] || 0,
                        yearlyTotals['1d'] || 0,
                        yearlyTotals['2d'] || 0,
                        yearlyTotals['3d'] || 0,
                        yearlyTotals.total || 0
                    ]);

                    addStyledTable(
                        worksheet,
                        ["Year", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
                        yearlyRows,
                        true
                    );

                    // ============= YEAR-OVER-YEAR GROWTH =============
                    if (tatSummary.summary.length > 1) {
                        worksheet.addRow([]);
                        worksheet.addRow([]);
                        addTitle(worksheet, "Year-over-Year Growth Analysis", 14, 8);

                        const yoyRows = [];
                        for (let i = 1; i < tatSummary.summary.length; i++) {
                            const current = tatSummary.summary[i];
                            const previous = tatSummary.summary[i - 1];

                            const totalGrowth = previous.total > 0
                                ? (((current.total || 0) - (previous.total || 0)) / previous.total * 100).toFixed(1)
                                : (current.total > 0 ? '+100.0' : '0.0');

                            yoyRows.push([
                                `${previous.year} → ${current.year}`,
                                `${totalGrowth}%`
                            ]);
                        }

                        addStyledTable(
                            worksheet,
                            ["Period", "Total Tickets Growth"],
                            yoyRows
                        );
                    }

                    // ============= MONTHLY DETAILS BY YEAR =============
                    if (tatSummary.data && tatSummary.data.length > 0) {
                        worksheet.addRow([]);
                        worksheet.addRow([]);
                        addTitle(worksheet, "Monthly TAT Details by Year", 14, 8);

                        const monthOrder = [
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                        ];

                        tatSummary.data.forEach(yearData => {
                            worksheet.addRow([]);
                            worksheet.addRow([`YEAR ${yearData.year} - Monthly Breakdown`])
                                .font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };
                            worksheet.addRow([]);

                            const monthlyRows = [];
                            let yearTotal = 0;

                            monthOrder.forEach(month => {
                                const monthData = yearData.months[month];
                                if (monthData && getTotal(monthData.tat) > 0) {
                                    const monthTotal = getTotal(monthData.tat);
                                    yearTotal += monthTotal;

                                    monthlyRows.push([
                                        month,
                                        monthData.tat['30m']?.length || 0,
                                        monthData.tat['1h']?.length || 0,
                                        monthData.tat['2h']?.length || 0,
                                        monthData.tat['1d']?.length || 0,
                                        monthData.tat['2d']?.length || 0,
                                        monthData.tat['3d']?.length || 0,
                                        monthTotal
                                    ]);
                                }
                            });

                            if (monthlyRows.length > 0) {
                                // Add month rows
                                addStyledTable(
                                    worksheet,
                                    ["Month", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
                                    monthlyRows
                                );

                                // Add year total
                                worksheet.addRow([`YEAR ${yearData.year} TOTAL`, "", "", "", "", "", "", yearTotal])
                                    .font = { bold: true };
                            }
                        });
                    }

                    // ============= CATEGORY BREAKDOWN BY YEAR =============
                    worksheet.addRow([]);
                    worksheet.addRow([]);
                    addTitle(worksheet, "TAT by Category - Yearly Breakdown", 14, 8);

                    const categories = ["hardware", "network", "application", "system", "uncategorized"];

                    tatSummary.data.forEach(yearData => {
                        worksheet.addRow([]);
                        worksheet.addRow([`${yearData.year} - Category Breakdown`])
                            .font = { bold: true, size: 11, color: { argb: 'FF008000' } };
                        worksheet.addRow([]);

                        const categoryRows = [];
                        let yearCategoryTotal = 0;

                        categories.forEach(category => {
                            let categoryTotal = 0;
                            const categoryTat = {
                                '30m': 0, '1h': 0, '2h': 0, '1d': 0, '2d': 0, '3d': 0
                            };

                            // Aggregate category data across all months in the year
                            Object.values(yearData.months).forEach(month => {
                                const catData = month.categories[category];
                                if (catData) {
                                    tatTypes.forEach(t => {
                                        const count = catData.tat[t]?.length || 0;
                                        categoryTat[t] += count;
                                        categoryTotal += count;
                                    });
                                }
                            });

                            if (categoryTotal > 0) {
                                categoryRows.push([
                                    category,
                                    categoryTat['30m'],
                                    categoryTat['1h'],
                                    categoryTat['2h'],
                                    categoryTat['1d'],
                                    categoryTat['2d'],
                                    categoryTat['3d'],
                                    categoryTotal
                                ]);
                                yearCategoryTotal += categoryTotal;
                            }
                        });

                        if (categoryRows.length > 0) {
                            addStyledTable(
                                worksheet,
                                ["Category", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
                                categoryRows
                            );

                            worksheet.addRow([`${yearData.year} TOTAL`, "", "", "", "", "", "", yearCategoryTotal])
                                .font = { bold: true };
                        }
                    });

                    // ============= TAT DISTRIBUTION SUMMARY =============
                    worksheet.addRow([]);
                    worksheet.addRow([]);
                    addTitle(worksheet, "TAT Distribution Summary - All Years", 14, 8);

                    const distributionRows = tatTypes.map(t => [
                        t,
                        yearlyTotals[t] || 0,
                        yearlyTotals.total > 0 ?
                            `${(((yearlyTotals[t] || 0) / yearlyTotals.total) * 100).toFixed(1)}%` : "0%"
                    ]);

                    addStyledTable(
                        worksheet,
                        ["TAT Range", "Count", "Percentage"],
                        distributionRows
                    );

                    // ============= SLA COMPLIANCE =============
                    worksheet.addRow([]);
                    addTitle(worksheet, "SLA Compliance Summary", 14, 8);

                    const within1Day = (yearlyTotals['30m'] || 0) + (yearlyTotals['1h'] || 0) +
                        (yearlyTotals['2h'] || 0) + (yearlyTotals['1d'] || 0);

                    const slaRows = [
                        ["Total Tickets with TAT", yearlyTotals.total || 0],
                        ["Within 30 Minutes", yearlyTotals['30m'] || 0],
                        ["Within 1 Hour", (yearlyTotals['30m'] || 0) + (yearlyTotals['1h'] || 0)],
                        ["Within 2 Hours", (yearlyTotals['30m'] || 0) + (yearlyTotals['1h'] || 0) + (yearlyTotals['2h'] || 0)],
                        ["Within 1 Day", within1Day],
                        ["SLA Compliance (1 Day)", yearlyTotals.total > 0 ?
                            `${((within1Day / yearlyTotals.total) * 100).toFixed(1)}%` : "0%"
                        ]
                    ];

                    addSimpleTable(worksheet, ["Metric", "Value"], slaRows);

                } else if (filterType === "perMonth" && tatSummary.type === 'monthly') {
                    // ============= MONTHLY TAT SUMMARY =============
                    addTitle(worksheet, `Monthly TAT Summary - ${new Date().getFullYear()}`, 14, 8);

                    const monthlyRows = tatSummary.summary.map(month => [
                        month.month,
                        month['30m'] || 0,
                        month['1h'] || 0,
                        month['2h'] || 0,
                        month['1d'] || 0,
                        month['2d'] || 0,
                        month['3d'] || 0,
                        month.total || 0
                    ]);

                    // Calculate monthly totals
                    const monthlyTotals = tatSummary.summary.reduce((acc, month) => {
                        tatTypes.forEach(t => acc[t] = (acc[t] || 0) + (month[t] || 0));
                        acc.total = (acc.total || 0) + (month.total || 0);
                        return acc;
                    }, {});

                    monthlyRows.push([
                        "TOTAL",
                        monthlyTotals['30m'] || 0,
                        monthlyTotals['1h'] || 0,
                        monthlyTotals['2h'] || 0,
                        monthlyTotals['1d'] || 0,
                        monthlyTotals['2d'] || 0,
                        monthlyTotals['3d'] || 0,
                        monthlyTotals.total || 0
                    ]);

                    addStyledTable(
                        worksheet,
                        ["Month", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
                        monthlyRows,
                        true
                    );

                    // Add category breakdown for each month
                    worksheet.addRow([]);
                    worksheet.addRow([]);
                    addTitle(worksheet, "Monthly Category Breakdown", 14, 8);

                    tatSummary.data.forEach(monthData => {
                        worksheet.addRow([]);
                        worksheet.addRow([`${monthData.month} - Category Breakdown`])
                            .font = { bold: true, size: 11, color: { argb: 'FF008000' } };
                        worksheet.addRow([]);

                        const categoryRows = [];
                        const categories = ["hardware", "network", "application", "system", "uncategorized"];

                        categories.forEach(category => {
                            const catData = monthData.categories[category];
                            if (catData && getTotal(catData.tat) > 0) {
                                categoryRows.push([
                                    category,
                                    catData.tat['30m']?.length || 0,
                                    catData.tat['1h']?.length || 0,
                                    catData.tat['2h']?.length || 0,
                                    catData.tat['1d']?.length || 0,
                                    catData.tat['2d']?.length || 0,
                                    catData.tat['3d']?.length || 0,
                                    getTotal(catData.tat)
                                ]);
                            }
                        });

                        if (categoryRows.length > 0) {
                            addStyledTable(
                                worksheet,
                                ["Category", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
                                categoryRows
                            );
                        }
                    });

                } else if (tatSummary.type === 'regular') {
                    // ============= REGULAR CATEGORY/SUBCATEGORY VIEW =============
                    addTitle(worksheet, "TAT by Category and Subcategory", 14, 8);

                    const categoryRows = [];

                    tatSummary.summary.forEach(cat => {
                        // Category row
                        categoryRows.push([
                            cat.category.toUpperCase(),
                            cat['30m'] || 0,
                            cat['1h'] || 0,
                            cat['2h'] || 0,
                            cat['1d'] || 0,
                            cat['2d'] || 0,
                            cat['3d'] || 0,
                            cat.total || 0
                        ]);

                        // Subcategory rows
                        (cat.subcategories || []).forEach(sub => {
                            categoryRows.push([
                                `  └─ ${sub.name}`,
                                sub['30m'] || 0,
                                sub['1h'] || 0,
                                sub['2h'] || 0,
                                sub['1d'] || 0,
                                sub['2d'] || 0,
                                sub['3d'] || 0,
                                sub.total || 0
                            ]);
                        });

                        categoryRows.push([]);
                    });

                    // Calculate grand totals
                    const grandTotals = tatSummary.summary.reduce((acc, cat) => {
                        tatTypes.forEach(t => acc[t] = (acc[t] || 0) + (cat[t] || 0));
                        acc.total = (acc.total || 0) + (cat.total || 0);
                        return acc;
                    }, {});

                    categoryRows.push([
                        "GRAND TOTAL",
                        grandTotals['30m'] || 0,
                        grandTotals['1h'] || 0,
                        grandTotals['2h'] || 0,
                        grandTotals['1d'] || 0,
                        grandTotals['2d'] || 0,
                        grandTotals['3d'] || 0,
                        grandTotals.total || 0
                    ]);

                    addStyledTable(
                        worksheet,
                        ["Category/Subcategory", "30m", "1h", "2h", "1d", "2d", "3d", "Total"],
                        categoryRows.filter(row => row.length > 0),
                        true
                    );
                }

            } catch (err) {
                console.error("Error processing TAT data:", err);
                worksheet.addRow(["ERROR: Unable to process TAT data"]);
                worksheet.addRow([err.message]);
            }
        }

        // Helper function for getting total from tat object
        function getTotal(tat) {
            if (!tat) return 0;
            return Object.values(tat).reduce((sum, arr) => sum + (arr?.length || 0), 0);
        }

        // ============= UTILITY FUNCTIONS =============

        function addTitle(worksheet, title, fontSize = 14, mergeColumns = 8) {
            const row = worksheet.addRow([title]);
            row.font = { bold: true, size: fontSize };
            row.alignment = { vertical: "middle", horizontal: "center" };
            worksheet.mergeCells(`A${row.number}:${String.fromCharCode(64 + mergeColumns)}${row.number}`);
            worksheet.addRow([]);
        }

        function addFilterInfo(worksheet, filterType, location) {
            const filterDisplay = {
                'today': 'Today',
                'thisWeek': 'This Week',
                'lastWeek': 'Last Week',
                'thisMonth': 'This Month',
                'perMonth': 'Per Month (Current Year)',
                'perYear': 'Per Year (All Years)',
                'all': 'All Time'
            };

            const locationDisplay = {
                'lmd': 'LMD Only',
                'corp': 'CORP Only',
                'all': 'LMD & CORP'
            };

            const row = worksheet.addRow([
                `Filter: ${filterDisplay[filterType] || filterType} | Location: ${locationDisplay[location] || location}`
            ]);
            row.font = { italic: true, color: { argb: 'FF666666' } };
            worksheet.addRow([]);
        }

        async function addTicketsTable(worksheet, tickets, statusType) {
            const rows = await Promise.all(tickets.map(async t => {
                let department = t.emp_department || "Unknown";

                // Try to fetch department if not available
                if (!t.emp_department && t.ticket_for) {
                    try {
                        const res = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                            params: { user_name: t.ticket_for },
                            timeout: 2000
                        });
                        if (res.data && res.data.emp_department) {
                            department = res.data.emp_department;
                        }
                    } catch (err) {
                        // Silently fail, use Unknown
                    }
                }

                return [
                    t.ticket_id,
                    t.ticket_subject?.substring(0, 100) || "-",
                    statusType || t.ticket_status || "-",
                    t.assigned_to || "Unassigned",
                    t.ticket_for || "-",
                    t.assigned_location?.toUpperCase() || "-",
                    new Date(t.created_at).toLocaleString(),
                    department
                ];
            }));

            addStyledTable(
                worksheet,
                ["Ticket ID", "Subject", "Status", "Assigned To", "Requestor", "Location", "Date", "Department"],
                rows
            );
        }

        function addStyledTable(worksheet, headers, rows, hasTotalRow = false) {
            // Add header row
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true, size: 11 };
            headerRow.alignment = { vertical: "middle", horizontal: "center" };
            headerRow.height = 25;
            headerRow.eachCell({ includeEmpty: true }, cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF053B00' }
                };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            });

            // Add data rows
            const dataRows = [];
            rows.forEach((r, index) => {
                const row = worksheet.addRow(r);
                row.height = 20;

                // Apply different background for total row
                if (hasTotalRow && index === rows.length - 1) {
                    row.eachCell({ includeEmpty: true }, cell => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF2F2F2' }
                        };
                        cell.font = { bold: true };
                    });
                }

                dataRows.push(row);
            });

            // Apply borders to all rows
            [headerRow, ...dataRows].forEach(row => {
                row.eachCell({ includeEmpty: true }, cell => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
                });
            });

            worksheet.addRow([]);
        }

        function addSimpleTable(worksheet, headers, rows) {
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };

            rows.forEach(r => {
                worksheet.addRow(r);
            });

            worksheet.addRow([]);
        }

        async function buildDepartmentSummary() {
            const departmentSummary = {};
            const uniqueUsernames = [...new Set(filteredTickets.map(t => t.ticket_for).filter(Boolean))];
            const userDeptMap = {};

            // Batch fetch user departments (limit concurrent requests)
            const batchSize = 10;
            for (let i = 0; i < uniqueUsernames.length; i += batchSize) {
                const batch = uniqueUsernames.slice(i, i + batchSize);
                await Promise.all(batch.map(async (username) => {
                    try {
                        const res = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                            params: { user_name: username },
                            timeout: 3000
                        });
                        if (res.data && res.data.emp_department) {
                            userDeptMap[username] = res.data.emp_department;
                        }
                    } catch (err) {
                        // Silently fail, will use fallback
                    }
                }));
            }

            // If filterType is perMonth, group by month
            if (filterType === "perMonth") {
                const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];

                const monthlyDepartmentSummary = {};

                filteredTickets.forEach(ticket => {
                    const ticketDate = new Date(ticket.created_at);
                    const month = monthNames[ticketDate.getMonth()];
                    const year = ticketDate.getFullYear();
                    const monthYear = `${month} ${year}`;

                    let dept = userDeptMap[ticket.ticket_for] ||
                        ticket.emp_department ||
                        ticket.department ||
                        "Unknown";

                    // Initialize month if not exists
                    if (!monthlyDepartmentSummary[monthYear]) {
                        monthlyDepartmentSummary[monthYear] = {
                            month: monthYear,
                            monthIndex: ticketDate.getMonth(),
                            year: year,
                            departments: {}
                        };
                    }

                    // Initialize department in month if not exists
                    if (!monthlyDepartmentSummary[monthYear].departments[dept]) {
                        monthlyDepartmentSummary[monthYear].departments[dept] = {
                            department: dept,
                            open: 0,
                            in_progress: 0,
                            assigned: 0,
                            resolved: 0,
                            closed: 0,
                            not_reviewed: 0,
                            total: 0
                        };
                    }

                    const deptData = monthlyDepartmentSummary[monthYear].departments[dept];
                    const status = ticket.ticket_status?.toLowerCase() || '';

                    // Count by status
                    if (status === 'open') {
                        deptData.open++;
                    } else if (status.includes('progress')) {
                        deptData.in_progress++;
                    } else if (status === 'assigned') {
                        deptData.assigned++;
                    } else if (status === 'resolved') {
                        deptData.resolved++;
                    } else if (status === 'closed') {
                        if (ticket.is_reviewed === false) {
                            deptData.not_reviewed++;
                        } else {
                            deptData.closed++;
                        }
                    }

                    deptData.total++;
                });

                // Sort months chronologically
                const sortedMonths = Object.values(monthlyDepartmentSummary)
                    .sort((a, b) => {
                        if (a.year !== b.year) return a.year - b.year;
                        return a.monthIndex - b.monthIndex;
                    });

                // Transform to include month information
                const result = {};
                sortedMonths.forEach(monthData => {
                    result[monthData.month] = {
                        departments: monthData.departments,
                        year: monthData.year,
                        monthIndex: monthData.monthIndex
                    };
                });

                return result;
            }
            // If filterType is perYear, group by year and month
            else if (filterType === "perYear") {
                const monthNames = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];

                const yearlyDepartmentSummary = {};

                filteredTickets.forEach(ticket => {
                    const ticketDate = new Date(ticket.created_at);
                    const year = ticketDate.getFullYear().toString();
                    const month = monthNames[ticketDate.getMonth()];
                    const monthIndex = ticketDate.getMonth();

                    let dept = userDeptMap[ticket.ticket_for] ||
                        ticket.emp_department ||
                        ticket.department ||
                        "Unknown";

                    // Initialize year if not exists
                    if (!yearlyDepartmentSummary[year]) {
                        yearlyDepartmentSummary[year] = {
                            year: year,
                            months: {},
                            departments: new Set(),
                            yearTotal: 0
                        };
                    }

                    // Initialize month in year if not exists
                    if (!yearlyDepartmentSummary[year].months[month]) {
                        yearlyDepartmentSummary[year].months[month] = {
                            month: month,
                            monthIndex: monthIndex,
                            departments: {},
                            monthTotal: 0
                        };
                    }

                    // Initialize department in month if not exists
                    if (!yearlyDepartmentSummary[year].months[month].departments[dept]) {
                        yearlyDepartmentSummary[year].months[month].departments[dept] = {
                            department: dept,
                            open: 0,
                            in_progress: 0,
                            assigned: 0,
                            resolved: 0,
                            closed: 0,
                            not_reviewed: 0,
                            total: 0
                        };

                        // Add department to year's department set
                        yearlyDepartmentSummary[year].departments.add(dept);
                    }

                    const deptData = yearlyDepartmentSummary[year].months[month].departments[dept];
                    const status = ticket.ticket_status?.toLowerCase() || '';

                    // Count by status
                    if (status === 'open') {
                        deptData.open++;
                    } else if (status.includes('progress')) {
                        deptData.in_progress++;
                    } else if (status === 'assigned') {
                        deptData.assigned++;
                    } else if (status === 'resolved') {
                        deptData.resolved++;
                    } else if (status === 'closed') {
                        if (ticket.is_reviewed === false) {
                            deptData.not_reviewed++;
                        } else {
                            deptData.closed++;
                        }
                    }

                    deptData.total++;
                    yearlyDepartmentSummary[year].months[month].monthTotal++;
                    yearlyDepartmentSummary[year].yearTotal++;
                });

                // Sort years in ascending order (oldest first)
                const sortedYears = Object.keys(yearlyDepartmentSummary)
                    .sort((a, b) => parseInt(a) - parseInt(b));

                // Sort months within each year chronologically
                const result = {};
                sortedYears.forEach(year => {
                    result[year] = {
                        year: year,
                        yearTotal: yearlyDepartmentSummary[year].yearTotal,
                        departments: [...yearlyDepartmentSummary[year].departments].sort(),
                        months: Object.values(yearlyDepartmentSummary[year].months)
                            .sort((a, b) => a.monthIndex - b.monthIndex)
                    };
                });

                return result;
            }
            // Regular department summary (non-monthly, non-yearly)
            else {
                filteredTickets.forEach(ticket => {
                    let dept = userDeptMap[ticket.ticket_for] ||
                        ticket.emp_department ||
                        ticket.department ||
                        "Unknown";

                    if (!departmentSummary[dept]) {
                        departmentSummary[dept] = {
                            department: dept,
                            open: 0,
                            in_progress: 0,
                            assigned: 0,
                            resolved: 0,
                            closed: 0,
                            not_reviewed: 0,
                            total: 0
                        };
                    }

                    const status = ticket.ticket_status?.toLowerCase() || '';

                    if (status === 'open') {
                        departmentSummary[dept].open++;
                    } else if (status.includes('progress')) {
                        departmentSummary[dept].in_progress++;
                    } else if (status === 'assigned') {
                        departmentSummary[dept].assigned++;
                    } else if (status === 'resolved') {
                        departmentSummary[dept].resolved++;
                    } else if (status === 'closed') {
                        if (ticket.is_reviewed === false) {
                            departmentSummary[dept].not_reviewed++;
                        } else {
                            departmentSummary[dept].closed++;
                        }
                    }

                    departmentSummary[dept].total++;
                });

                return departmentSummary;
            }
        }
    };



    return (
        <Container fluid className="pt-100 px-3 px-md-5"
            style={{
                background: "linear-gradient(to bottom, #ffe798ff, #b8860b)",
                minHeight: "100vh",
                paddingTop: "100px",
                paddingBottom: "20px",
            }}>
            <Row className="align-items-center g-3 mb-4">
                {/* Left side - Title */}
                <Col xs="auto">
                    <h2 className="mb-0"><b>Support Report Tickets</b></h2>
                </Col>

                {/* Filters */}
                <Col className="d-flex justify-content-end gap-2">
                    <Form.Group controlId="status-filter-1">
                        <Form.Select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            style={{ maxWidth: "200px" }}
                        >
                            <option value="all">LMD & CORP</option>
                            <option value="lmd">LMD</option>
                            <option value="corp">CORP</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group controlId="status-filter-2">
                        <Form.Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{ maxWidth: "250px" }}
                        >
                            <option value="all">All</option>
                            <option value="today">Today</option>
                            <option value="thisWeek">This Week</option>
                            <option value="lastWeek">Last Week</option>
                            <option value="thisMonth">This Month</option>
                            <option value="perMonth">Per Month</option>
                            <option value="perYear">Per Year</option>
                        </Form.Select>
                    </Form.Group>

                    {/* Button aligned with filters */}
                    <Button variant="success" onClick={handleDownloadExcel}>
                        Excel <FeatherIcon icon="download" />
                    </Button>
                </Col>
            </Row>

            {/* Clickable Open / Not Reviewed / Closed cards */}
            <Row style={{ paddingBottom: '20px' }}>
                <Col>
                    <div
                        className="bento-item-top"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(
                            "All Open Tickets",
                            <TicketsTable tickets={filteredTickets.filter(t => t.ticket_status === 'open')} />
                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>Open Tickets</b>
                        </div>
                        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                            <h1>{open}</h1>
                        </div>
                    </div>
                </Col>
                <Col>
                    <div
                        className="bento-item-top"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(
                            "Not Reviewed Tickets",
                            <TicketsTable tickets={filteredTickets.filter(t => t.is_reviewed === false && t.ticket_status === 'closed')} />
                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>Not Reviewed</b>
                        </div>
                        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                            <h1>{notReviewed}</h1>
                        </div>
                    </div>
                </Col>
                <Col>
                    <div
                        className="bento-item-top"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(
                            "Closed Tickets",
                            <TicketsTable tickets={filteredTickets.filter(t => t.is_reviewed === true && t.ticket_status === 'closed')} />
                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>Closed Tickets</b>
                        </div>
                        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                            <h1>{closed}</h1>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Table and Subcategory Chart */}
            <Row style={{ paddingBottom: '20px' }}>
                <Col xs={6}>
                    <div className="bento-item bento-users">
                        <h4>Ticket Status Sub-Category
                            {filterType === "perMonth" && " - Monthly Breakdown"}
                            {filterType === "perYear" && " - Yearly Breakdown"}
                        </h4>
                        <div>
                            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: '100%' }}>
                                <thead style={{ background: '#053b00ff', color: 'white' }}>
                                    <tr>
                                        {filterType === "perMonth" && <th>Month</th>}
                                        {filterType === "perYear" && <th>Year</th>}
                                        {filterType !== "perMonth" && filterType !== "perYear" && <th>Subcategory</th>}
                                        <th>Total</th>
                                        <th>Resolved</th>
                                        <th>Closed</th>
                                        <th>Open</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                                        <td>Total</td>
                                        <td>{totalRow.total}</td>
                                        <td>{totalRow.resolved}</td>
                                        <td>{totalRow.closed}</td>
                                        <td>{totalRow.open}</td>
                                    </tr>
                                    {stats.map((row, index) => (
                                        <tr key={index}>
                                            <td>
                                                {filterType === "perMonth" && row.period}
                                                {filterType === "perYear" && row.period}
                                                {filterType !== "perMonth" && filterType !== "perYear" && row.subcategory}
                                            </td>
                                            <td>{row.total}</td>
                                            <td>{row.resolved}</td>
                                            <td>{row.closed}</td>
                                            <td>{row.open}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Col>
                <Col>
                    <div className="bento-item bento-users"
                        onClick={() => openModal("Ticket Summary", <SubCatDepartmentTable filterType={filterType} location={location} onDataReady={setSubcatSummary} />)}>
                        <h4>Summary</h4>
                        <div
                            className="bento-chart-wrapper"
                            style={{
                                width: "100%",
                                overflowX: "auto",
                                paddingBottom: "10px",
                            }}
                        >
                            <div style={{ width: "100%", height: "350px" }}>
                                <SubCatDepartment
                                    filterType={filterType}
                                    location={location}
                                    onDataReady={setSubcatSummary}
                                />
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Other Charts */}
            <Row className="g-2">
                <Col xs={12} md={4}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "All Tickets by Category",
                                <GetAllByCategory filterType={filterType} showChart={false} location={location} onDataReady={setTicketCategorySummary} />
                            )}>
                        <GetAllByCategory filterType={filterType} showChart={true} location={location} onDataReady={setTicketCategorySummary} />
                    </div>
                </Col>

                <Col xs={12} md={8}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "Tickets per Help Desk",
                                <TatPerCategorySummary
                                    filterType={filterType}
                                    showChart={false}
                                    location={location}
                                    onDataReady={null}  // Fixed: no need to update parent for modal
                                />
                            )
                        }
                    >
                        <FeatherIcon
                            icon="maximize-2"
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                cursor: "pointer"
                            }}
                        />

                        {/* This is the chart version - keep this one */}
                        <TatPerCategorySummary
                            filterType={filterType}
                            showChart={true}
                            location={location}
                            onDataReady={setTatSummary}
                        />
                    </div>
                </Col>
            </Row>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{modalContent}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}