import { Container, Row, Col, Form, Modal, Button, Pagination } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "config";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import SubCatDepartment from "../report/subcat_department";
import SubCatDepartmentTable from "../report/subcat_departmentTable";
import "../report/bento-layout-new.css";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import GetAllByCategory from "../report/getallbycategory";
import LocationTicketsChart from "../report/allticketbysite";
import AllTicketbyType from "../report/allticketbytype";
import AllTicketsByUser from "../report/allticketsbyuser";
import FeatherIcon from "feather-icons-react";
import PMSbyDept from "./pmsbydept";
import PMSbyHD from "./pmsbyhd";
import { useNavigate } from 'react-router';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PMSReport() {
    const [filterType, setFilterType] = useState("all");
    const [stats, setStats] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const navigate = useNavigate();
    const [location, setLocation] = useState('')

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

    //Modal content
    const openModal = (title, content) => {
        setModalTitle(title);
        setModalContent(content);
        setShowModal(true);
    };

    //Date Calculator
    const calcTAT = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { diffMs, text: `${diffDays}d ${diffHours}h ${diffMinutes}m` };
    };

    // table modal
    const TicketsTable = ({ tickets }) => {
        const [currentPage, setCurrentPage] = useState(1);
        const itemsPerPage = 10;

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentTickets = tickets.slice(indexOfFirstItem, indexOfLastItem);

        const totalPages = Math.ceil(tickets.length / itemsPerPage);
        console.log(currentTickets)
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
                                <tr key={ticket.pmsticket_id}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => navigate(`/view-pms-hd-ticket?id=${ticket.pmsticket_id}`)}>
                                    <td>{ticket.pmsticket_id}</td>
                                    <td>{ticket.tag_id}</td>
                                    <td>{ticket.pms_status}</td>
                                    {/* <td>{ticket.ticket_type}</td> */}
                                    <td>{ticket.assigned_to}</td>
                                    <td>{ticket.pmsticket_for}</td>
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
                const res = await axios.get(`${config.baseApi}/pmsticket/get-all-pmsticket`);
                const data = res.data || [];
                const activetickets = data.filter(t => t.is_active === true)
                setAllTickets(activetickets);

                console.log(data)
            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, []);

    // Fetching pms ticket per site
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
                filtered = filtered.filter(t => new Date(t.created_at) >= startOfYear);
                break;
            case "perYear":
                filtered = filtered.filter(t => new Date(t.created_at).getFullYear() === now.getFullYear());
                break;
            default:
                break;
        }

        // Sort by created_at (newest first)
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        console.log(filtered)
        // save filtered tickets for modal usage
        setFilteredTickets(filtered);

        // Counters
        setOpen(filtered.filter(ticket => ticket.pms_status === 'open').length);
        setNotReviewed(filtered.filter(ticket => ticket.is_reviewed === false && ticket.pms_status === 'closed').length);

        setClosed(filtered.filter(ticket => ticket.is_reviewed === true && ticket.pms_status === 'closed').length);

        // Group by subcategory
        const grouped = filtered.reduce((acc, ticket) => {
            const tagID = ticket.tag_id || "Unknown";
            const status = ticket.pms_status?.toLowerCase() || "unknown";

            if (!acc[tagID]) {
                acc[tagID] = {
                    subcategory: tagID,
                    total: 0,
                    resolved: 0,
                    closed: 0,
                    open: 0,
                    tatTimes: []
                };
            }

            acc[tagID].total += 1;

            if (status === "resolved") acc[tagID].resolved += 1;
            else if (status === "closed") acc[tagID].closed += 1;
            else if (status === "open") acc[tagID].open += 1;

            if (ticket.created_at && ticket.resolved_at) {
                const tat = calcTAT(ticket.created_at, ticket.resolved_at);
                acc[tagID].tatTimes.push(tat.diffMs);
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

    // Calculate total row
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

    // Excel Download function
    const handleDownloadExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("All Reports");

        // Helper: add section title
        worksheet.columns = Array.from({ length: 8 }, () => ({ width: 20 }));

        // Helper: add section title
        const addTitle = (title) => {
            const row = worksheet.addRow([title]);
            row.font = { bold: true, size: 14 };
            row.alignment = { vertical: "middle", horizontal: "center" };

            worksheet.mergeCells(`A${row.number}:H${row.number}`);
            worksheet.addRow([]);
        };

        // Helper: add a styled table
        const addTable = (title, headers, rows) => {
            addTitle(title);

            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true, size: 12 };
            headerRow.alignment = { vertical: "middle", horizontal: "center" };
            headerRow.height = 25; // taller headers

            rows.forEach(r => {
                const row = worksheet.addRow(r);
                row.height = 20; // extra space for data rows
            });

            // Apply borders & alignment
            const tableRows = [headerRow, ...worksheet.getRows(headerRow.number + 1, rows.length)];
            tableRows.forEach(row => {
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
                });
            });

            // Add extra spacing row between tables
            worksheet.addRow([]);
            worksheet.addRow([]);
        };

        if (!subcatSummary && !ticketCategorySummary && !ticketUsersSummary && !filteredTickets.length) {
            alert("No data available to download");
            return;
        }

        // ---- Subcategory Summary ----
        if (subcatSummary) {
            const summaryArray = Array.isArray(subcatSummary) ? subcatSummary : [subcatSummary];
            if (summaryArray[0]?.month) {
                const departments = summaryArray[0].departments || [];
                const headers = ["Month", ...departments, "Total"];
                const rows = summaryArray.map(r => [
                    r.month,
                    ...departments.map(d => r.deptCount?.[d] ?? 0),
                    r.grandTotal ?? 0
                ]);
                addTable("Subcategory Summary", headers, rows);
            } else {
                const departments = subcatSummary.departments || [];
                const headers = ["Department", "Tickets"];
                const rows = departments.map(d => [d, subcatSummary.deptCount?.[d] ?? 0]);
                rows.push(["Total", subcatSummary.grandTotal ?? 0]);
                addTable("Subcategory Summary", headers, rows);
            }
        }

        // ---- Tickets by Category ----
        if (ticketCategorySummary) {
            const summaryArray = Array.isArray(ticketCategorySummary) ? ticketCategorySummary : [ticketCategorySummary];
            const headers = summaryArray[0]?.month
                ? ["Month", ...Object.keys(summaryArray[0]).filter(k => k !== "month")]
                : Object.keys(summaryArray[0] || {});
            const rows = summaryArray.map(r =>
                summaryArray[0]?.month
                    ? [r.month, ...headers.slice(1).map(k => r[k] ?? 0)]
                    : headers.map(h => r[h] ?? "")
            );
            addTable("Tickets By Category Summary", headers, rows);

            addTable("Hardware Tickets", ["ID", "Problem/Issue", "Status", "Assigned To", "For", "Created At"],
                filteredTickets.filter(t => t.ticket_category === "hardware").map(t => [
                    t.ticket_id, t.ticket_subject, t.ticket_status,
                    t.assigned_to || "-", t.ticket_for || "-", new Date(t.created_at).toLocaleString()
                ])
            );
            addTable("Network Tickets", ["ID", "Problem/Issue", "Status", "Assigned To", "For", "Created At"],
                filteredTickets.filter(t => t.ticket_category === "network").map(t => [
                    t.ticket_id, t.ticket_subject, t.ticket_status,
                    t.assigned_to || "-", t.ticket_for || "-", new Date(t.created_at).toLocaleString()
                ])
            );
            addTable("Software Tickets", ["ID", "Problem/Issue", "Status", "Assigned To", "For", "Created At"],
                filteredTickets.filter(t => t.ticket_category === "software").map(t => [
                    t.ticket_id, t.ticket_subject, t.ticket_status,
                    t.assigned_to || "-", t.ticket_for || "-", new Date(t.created_at).toLocaleString()
                ])
            );
            addTable("System Tickets", ["ID", "Problem/Issue", "Status", "Assigned To", "For", "Created At"],
                filteredTickets.filter(t => t.ticket_category === "system").map(t => [
                    t.ticket_id, t.ticket_subject, t.ticket_status,
                    t.assigned_to || "-", t.ticket_for || "-", new Date(t.created_at).toLocaleString()
                ])
            );
        }

        // ---- Tickets by User ----
        if (ticketUsersSummary) {
            const summaryArray = Array.isArray(ticketUsersSummary) ? ticketUsersSummary : [ticketUsersSummary];
            const headers = summaryArray[0]?.month
                ? ["Month", ...Object.keys(summaryArray[0]).filter(k => k !== "month")]
                : Object.keys(summaryArray[0] || {});
            const rows = summaryArray.map(r =>
                summaryArray[0]?.month
                    ? [r.month, ...headers.slice(1).map(k => r[k] ?? 0)]
                    : headers.map(h => r[h] ?? "")
            );
            addTable("Tickets By User", headers, rows);
        }

        // ---- Save file ----
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), "Reports.xlsx");
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
                    <h2 className="mb-0"><b>PMS Report Tickets</b></h2>
                </Col>

                {/* Filters */}
                <Col className="d-flex justify-content-end gap-2">
                    {/* Site Filter */}
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

                    {/* Status Filter */}
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

                    {/* Download Excel Filter */}
                    <Button variant="success" onClick={handleDownloadExcel}>
                        Excel <FeatherIcon icon="download" />
                    </Button>
                </Col>
            </Row>

            {/* Clickable Open / Not Reviewed / Closed cards */}
            <Row style={{ paddingBottom: '20px' }}>
                {/* Open  */}
                <Col>
                    <div
                        className="bento-item-top"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(
                            "All Open Tickets",
                            <TicketsTable tickets={filteredTickets.filter(t => t.pms_status === 'open')} />

                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>All PMS Tickets</b>
                        </div>
                        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                            <h1>{open}</h1>
                        </div>
                    </div>
                </Col>
                {/* Not reviewed */}
                <Col>
                    <div
                        className="bento-item-top"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(
                            "Not Reviewed Tickets",
                            <TicketsTable tickets={filteredTickets.filter(t => t.is_reviewed === false && t.pms_status === 'closed')} />
                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>All Not Reviewed</b>
                        </div>
                        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                            <h1>{notReviewed}</h1>
                        </div>
                    </div>
                </Col>
                {/* Closed */}
                <Col>
                    <div
                        className="bento-item-top"
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(
                            "Closed Tickets",
                            <TicketsTable tickets={filteredTickets.filter(t => t.is_reviewed === true && t.pms_status === 'closed')} />
                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>All Closed PMS</b>
                        </div>
                        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                            <h1>{closed}</h1>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Table and Subcategory Chart */}
            <Row style={{ paddingBottom: '20px' }}>
                <Col xs={7}>
                    <div className="bento-item bento-users">
                        <h4>PMS Ticket Status</h4>
                        <div>
                            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: '100%' }}>
                                <thead style={{ background: '#053b00ff', color: 'white' }}>
                                    <tr>
                                        <th>Tag ID</th>
                                        <th>Total</th>
                                        <th>Resolved</th>
                                        <th>Closed</th>
                                        <th>Open</th>
                                        <th>Average TAT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                                        <td>Total</td>
                                        <td>{totalRow.total}</td>
                                        <td>{totalRow.resolved}</td>
                                        <td>{totalRow.closed}</td>
                                        <td>{totalRow.open}</td>
                                        <td>-</td>
                                    </tr>
                                    {stats.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row.subcategory}</td>
                                            <td>{row.total}</td>
                                            <td>{row.resolved}</td>
                                            <td>{row.closed}</td>
                                            <td>{row.open}</td>
                                            <td>{row.avgTAT}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Col>
                {/* ticket Summary */}
                <Col>
                    <div className="bento-item bento-users"
                        onClick={() => openModal("Ticket Summary", <PMSbyDept showChart={false} filterType={filterType} location={location} onDataReady={setSubcatSummary} />)}>
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
                                <PMSbyDept
                                    filterType={filterType}
                                    location={location}
                                    onDataReady={setSubcatSummary}
                                    showChart={true}
                                />
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Other Charts */}
            <Row className="g-2">
                {/* <Col xs={12} md={4}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "Tickets by Type",
                                <AllTicketbyType filterType={filterType} showChart={false} location={location} />)}>
                        <AllTicketbyType filterType={filterType} showChart={true} location={location} onDataReady={setTicketTypeSummary} />
                    </div>
                </Col> */}
                {/* category  */}
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
                                <PMSbyHD filterType={filterType} showChart={false} location={location} onDataReady={setTicketUsersSummary} />
                            )
                        }
                    >
                        <PMSbyHD filterType={filterType} showChart={true} location={location} onDataReady={setTicketUsersSummary} />
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
