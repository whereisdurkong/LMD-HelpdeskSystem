import { Container, Row, Col, Form, Modal, Button } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "config";

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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Report() {
    const [filterType, setFilterType] = useState("all");
    const [stats, setStats] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    const [open, setOpen] = useState('');
    const [notReviewed, setNotReviewed] = useState('');
    const [closed, setClosed] = useState('');

    const [chartdata, setChartData] = useState(null);

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

    // ✅ Table component used inside modal
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

    // Apply filter + sorting whenever filterType or allTickets changes
    useEffect(() => {
        if (!allTickets.length) return;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let filtered = [...allTickets];

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

        // ✅ save filtered tickets for modal usage
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
    }, [filterType, allTickets]);

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

    return (
        <Container fluid className="pt-100 px-3 px-md-5"
            style={{
                background: "linear-gradient(to bottom, #ffe798ff, #b8860b)",
                minHeight: "100vh",
                paddingTop: "100px",
                paddingBottom: "20px",
            }}>
            <Row className="align-items-center g-3 mb-4">
                <Col xs={12} md={8} lg={9}>
                    <h2 className="mb-0"><b>Reports</b></h2>
                </Col>
                <Col xs={12} md={4} lg={3}>
                    <Form.Group controlId="status-filter" style={{ width: '100%' }}>
                        <Form.Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{ maxWidth: "550px" }}
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
                        onClick={() => openModal("Ticket Summary", <SubCatDepartmentTable filterType={filterType} />)}>
                        <h3>Summary</h3>
                        <div className="bento-chart-wrapper">
                            <SubCatDepartment filterType={filterType} />
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
                                <AllTicketbyType filterType={filterType} showChart={false} />
                            )
                        }
                    >
                        <AllTicketbyType filterType={filterType} showChart={true} />
                    </div>
                </Col>

                <Col xs={12} md={4}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "All Tickets by Category",
                                <GetAllByCategory filterType={filterType} showChart={false} />
                            )
                        }
                    >
                        <GetAllByCategory filterType={filterType} showChart={true} />
                    </div>
                </Col>

                <Col xs={12} md={4}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "Tickets by Location",
                                <LocationTicketsChart filterType={filterType} showChart={false} />
                            )
                        }
                    >
                        <LocationTicketsChart filterType={filterType} showChart={true} />
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
