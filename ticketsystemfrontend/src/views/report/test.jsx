import { Container, Row, Col, Form, Modal, Button } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "config";
import * as XLSX from "xlsx";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Report() {
    const [filterType, setFilterType] = useState("all");
    const [stats, setStats] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);

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
    const [tikcetUsersSummary, setTicketUsersSummary] = useState(null);
    const openModal = (title, content) => {
        setModalTitle(title);
        setModalContent(content);
        setShowModal(true);
    };

    const calcTAT = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { diffMs, text: `${diffDays}d ${diffHours}h ${diffMinutes}m` };
    };

    const TicketsTable = ({ tickets }) => {
        return (
            <div style={{ overflowX: "auto" }}>
                <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead style={{ background: '#053b00ff', color: 'white' }}>
                        <tr>
                            <th>ID</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Assigned To</th>
                            <th>For</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.length > 0 ? (
                            tickets.map(ticket => (
                                <tr key={ticket.ticket_id}>
                                    <td>{ticket.ticket_id}</td>
                                    <td>{ticket.ticket_subject}</td>
                                    <td>{ticket.ticket_status}</td>
                                    <td>{ticket.ticket_type}</td>
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
            </div>
        );
    };

    const [locationFilteredTickets, setLocationFilteredTickets] = useState([]);

    // Fetch tickets once
    useEffect(() => {

        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                const data = res.data || [];
                setAllTickets(data);


            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, []);

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

        // save filtered tickets for modal usage
        setFilteredTickets(filtered);

        // Counters
        setOpen(filtered.filter(ticket => ticket.ticket_status === 'open').length);
        setNotReviewed(filtered.filter(ticket => ticket.is_reviewed === false && ticket.ticket_status === 'closed').length);

        setClosed(filtered.filter(ticket => ticket.is_reviewed === true && ticket.ticket_status === 'closed').length);

        // Group by subcategory
        const grouped = filtered.reduce((acc, ticket) => {
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
    const handleDownloadExcel = () => {
        const workbook = XLSX.utils.book_new();

        if (!ticketTypeSummary && !subcatSummary && !filteredTickets.length) {
            alert("No data available to download");
            return;
        }

        // ---- Tickets by Type ----
        if (ticketTypeSummary) {
            let ws1;
            const summaryArray = Array.isArray(ticketTypeSummary)
                ? ticketTypeSummary
                : [ticketTypeSummary];

            if (summaryArray[0]?.month) {
                const header = ["Month", "Incident", "Request", "Inquiry", "Total"];
                const rows = summaryArray.map(r => [
                    r.month,
                    r.incident,
                    r.request,
                    r.inquiry,
                    r.total
                ]);
                ws1 = XLSX.utils.aoa_to_sheet([header, ...rows]);
            } else {
                ws1 = XLSX.utils.json_to_sheet(summaryArray);
            }

            // ✅ Append Incident, Request, Inquiry tables below Tickets by Type
            let currentRow = XLSX.utils.decode_range(ws1['!ref']).e.r + 3; // start 3 rows below

            const addTable = (title, tickets) => {
                // Title row
                const titleCell = [[title]];
                XLSX.utils.sheet_add_aoa(ws1, titleCell, { origin: { r: currentRow, c: 0 } });
                currentRow++;

                // Header row
                const headers = [["ID", "Subject", "Status", "Type", "Assigned To", "For", "Created At"]];
                XLSX.utils.sheet_add_aoa(ws1, headers, { origin: { r: currentRow, c: 0 } });
                currentRow++;

                // Data rows
                const rows = tickets.map(t => [
                    t.ticket_id,
                    t.ticket_subject,
                    t.ticket_status,
                    t.ticket_type,
                    t.assigned_to || "-",
                    t.ticket_for || "-",
                    new Date(t.created_at).toLocaleString()
                ]);

                XLSX.utils.sheet_add_aoa(ws1, rows, { origin: { r: currentRow, c: 0 } });
                currentRow += rows.length + 2; // leave 2 spaces after each table
            };

            addTable("Incident Tickets", filteredTickets.filter(t => t.ticket_type === "incident"));
            addTable("Request Tickets", filteredTickets.filter(t => t.ticket_type === "request"));
            addTable("Inquiry Tickets", filteredTickets.filter(t => t.ticket_type === "inquiry"));

            XLSX.utils.book_append_sheet(workbook, ws1, "Tickets By Type");
        }

        // ---- Subcategory Summary ----
        if (subcatSummary) {
            let ws2;
            const summaryArray = Array.isArray(subcatSummary)
                ? subcatSummary
                : [subcatSummary];

            if (summaryArray[0]?.month) {
                const departments = summaryArray[0].departments || [];
                const header = ["Month", ...departments, "Total"];
                const rows = summaryArray.map(r => {
                    const deptCounts = departments.map(
                        dept => r.deptCount?.[dept] ?? 0
                    );
                    return [r.month, ...deptCounts, r.grandTotal ?? 0];
                });
                ws2 = XLSX.utils.aoa_to_sheet([header, ...rows]);
            } else {
                const departments = subcatSummary.departments || [];
                const header = ["Department", "Tickets"];
                const rows = departments.map(dept => [
                    dept,
                    subcatSummary.deptCount?.[dept] ?? 0
                ]);
                rows.push(["Total", subcatSummary.grandTotal ?? 0]);
                ws2 = XLSX.utils.aoa_to_sheet([header, ...rows]);
            }
            XLSX.utils.book_append_sheet(workbook, ws2, "SubCat Summary");
        }

        // ---- Tickets by Category ----
        if (ticketCategorySummary) {
            let ws3;
            const summaryArray = Array.isArray(ticketCategorySummary)
                ? ticketCategorySummary
                : [ticketCategorySummary];

            if (summaryArray[0]?.month) {
                const keys = Object.keys(summaryArray[0]).filter(k => k !== "month");
                const header = ["Month", ...keys];
                const rows = summaryArray.map(r => [r.month, ...keys.map(k => r[k] ?? 0)]);
                ws3 = XLSX.utils.aoa_to_sheet([header, ...rows]);
            } else {
                ws3 = XLSX.utils.json_to_sheet(summaryArray);
            }
            let currentRow = XLSX.utils.decode_range(ws3['!ref']).e.r + 3; // start 3 rows below
            const addTable = (title, tickets) => {
                // Title row
                const titleCell = [[title]];
                XLSX.utils.sheet_add_aoa(ws3, titleCell, { origin: { r: currentRow, c: 0 } });
                currentRow++;

                // Header row
                const headers = [["ID", "Subject", "Status", "Type", "Assigned To", "For", "Created At"]];
                XLSX.utils.sheet_add_aoa(ws3, headers, { origin: { r: currentRow, c: 0 } });
                currentRow++;

                // Data rows
                const rows = tickets.map(t => [
                    t.ticket_id,
                    t.ticket_subject,
                    t.ticket_status,
                    t.ticket_type,
                    t.assigned_to || "-",
                    t.ticket_for || "-",
                    new Date(t.created_at).toLocaleString()
                ]);

                XLSX.utils.sheet_add_aoa(ws3, rows, { origin: { r: currentRow, c: 0 } });
                currentRow += rows.length + 2; // leave 2 spaces after each table
            };

            addTable("Incident Tickets", filteredTickets.filter(t => t.ticket_category === "hardware"));
            addTable("Request Tickets", filteredTickets.filter(t => t.ticket_category === "network"));
            addTable("Inquiry Tickets", filteredTickets.filter(t => t.ticket_category === "software"));




            XLSX.utils.book_append_sheet(workbook, ws3, "Tickets By Category");
        }

        // ---- Tickets by User ----
        if (tikcetUsersSummary) {
            let ws4;
            const summaryArray = Array.isArray(tikcetUsersSummary)
                ? tikcetUsersSummary
                : [tikcetUsersSummary];

            if (filterType === "perMonth") {
                const keys = Object.keys(summaryArray[0]).filter(k => k !== "month");
                const header = ["Month", ...keys];
                const rows = summaryArray.map(r => [r.month, ...keys.map(k => r[k] ?? 0)]);
                ws4 = XLSX.utils.aoa_to_sheet([header, ...rows]);
            } else {
                const keys = Object.keys(summaryArray[0]);
                const header = keys;
                const rows = summaryArray.map(r => keys.map(k => r[k] ?? 0));
                ws4 = XLSX.utils.aoa_to_sheet([header, ...rows]);
            }

            const addTable = () => {

            }

            XLSX.utils.book_append_sheet(workbook, ws4, "Tickets By User");
        }

        // ---- Save Excel file ----
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "Reports.xlsx");
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
                    <h2 className="mb-0"><b>Reports</b></h2>
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




            {/* ✅ Clickable Open / Not Reviewed / Closed cards */}
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
                <Col xs={8}>
                    <div className="bento-item bento-users">
                        <div>
                            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: '100%' }}>
                                <thead style={{ background: '#053b00ff', color: 'white' }}>
                                    <tr>
                                        <th>Subcategory</th>
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
                <Col>
                    <div className="bento-item bento-users"
                        onClick={() => openModal("Ticket Summary", <SubCatDepartmentTable filterType={filterType} location={location} onDataReady={setSubcatSummary} />)}>
                        <h3>Summary</h3>
                        <div className="bento-chart-wrapper">
                            <SubCatDepartment filterType={filterType} location={location} onDataReady={setSubcatSummary} />
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Other Charts */}
            <Row className="g-3">
                <Col xs={12} md={4}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "Tickets by Type",
                                <AllTicketbyType filterType={filterType} showChart={false} location={location} />)}>
                        <AllTicketbyType filterType={filterType} showChart={true} location={location} onDataReady={setTicketTypeSummary} />
                    </div>
                </Col>

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

                <Col xs={12} md={4}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "Tickets per Help Desk",
                                <AllTicketsByUser filterType={filterType} showChart={false} location={location} onDataReady={setTicketUsersSummary} />
                            )
                        }
                    >
                        <AllTicketsByUser filterType={filterType} showChart={true} location={location} onDataReady={setTicketUsersSummary} />
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
