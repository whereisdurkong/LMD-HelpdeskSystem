

import { Container, Row, Col, Form, Modal, Button, Pagination } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "config";

import SubCatDepartment from "views/report/subcat_department";
import SubCatDepartmentTable from "views/report/subcat_departmentTable";
import "views/report/bento-layout-new.css";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import GetAllByCategory from "views/report/getallbycategory";
import LocationTicketsChart from "views/report/allticketbysite";
import AllTicketbyTypeOwn from "views/report/allticketbytypeown";
import AllTicketSCAT from "views/report/allticketSCAT";
import GetAllByCategoryOwn from "views/report/getallbycategoryown";
import AllDataOwn from "views/report/alldataown";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function HDDashboard() {
    const [filterType, setFilterType] = useState("all");
    const [stats, setStats] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [ownTicket, setOwnTicket] = useState([]);
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    const [open, setOpen] = useState('');
    const [notReviewed, setNotReviewed] = useState('');
    const [closed, setClosed] = useState('');

    const [chartdata, setChartData] = useState(null);

    const [location, setLocation] = useState('')
    const [userInfo, setUserInfo] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 11; // adjust how many rows per page
    const totalPages = Math.ceil(ownTicket.length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = ownTicket.slice(indexOfFirstItem, indexOfLastItem);

    const openModal = (title, content) => {
        setModalTitle(title);
        setModalContent(content);
        setShowModal(true);
    };

    // Fetch tickets once
    useEffect(() => {
        const fetch = async () => {
            const empInfo = JSON.parse(localStorage.getItem("user"));
            setUserInfo(empInfo);
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                const data = res.data || [];

                let siteTickets = data;
                if (empInfo.emp_location === 'lmd') {
                    siteTickets = data.filter(t => t.assigned_location === "lmd" && t.is_active === true);

                    setLocation('lmd')
                } else if (empInfo.emp_location === 'corp') {
                    siteTickets = data.filter(t => t.assigned_location === "corp" && t.is_active === true);
                    setLocation('corp')
                }
                setAllTickets(data);

                const own = data
                    .filter(e => e.assigned_to === empInfo.user_name)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setOwnTicket(own)
                console.log(own)
            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, []);


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
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Assigned To</th>
                            <th>For</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTickets.length > 0 ? (
                            currentTickets.map(ticket => (
                                <tr
                                    key={ticket.ticket_id}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => window.location.replace(`view-hd-ticket?id=${ticket.ticket_id}`)}
                                >
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
        setOpen(filtered.filter(ticket => (ticket.ticket_status === 'in-progress' || ticket.ticket_status === 'assigned' || ticket.ticket_status === 're-opened') &&
            (ticket.assigned_to === userInfo.user_name && ticket.is_active === true)).length);

        setNotReviewed(filtered.filter(ticket => ticket.is_reviewed === false && (ticket.ticket_status === 'closed' || ticket.ticket_status === 'resolved') && (ticket.assigned_to === userInfo.user_name && ticket.is_active === true)).length);

        setClosed(filtered.filter(ticket => ticket.ticket_status === 'open' && ticket.is_active === true).length);

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
                    <h2 className="mb-0"><b>Dashboard</b></h2>
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
                            <TicketsTable tickets={filteredTickets.filter(t => (t.ticket_status === 'in-progress' || t.ticket_status === 'assigned' || t.ticket_status === 're-opened') && (t.assigned_to === userInfo.user_name && t.is_active === true))} />
                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>Tickets</b>
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
                            <TicketsTable tickets={filteredTickets.filter(t => t.is_reviewed === false &&
                                (t.assigned_to === userInfo.user_name && t.is_active === true) &&
                                (t.ticket_status === 'closed' || t.ticket_status === 'resolved'))} />
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
                            <TicketsTable tickets={filteredTickets.filter(t => t.ticket_status === 'open' && t.is_active === true)} />
                        )}
                    >
                        <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                            <b>Open Tickets</b>
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
                                        <th>Ticket ID</th>
                                        <th>Subject</th>
                                        <th>Status</th>
                                        <th>Level</th>
                                        <th>Ticket For</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length > 0 ? (
                                        currentItems.map(e => (
                                            <tr key={e.ticket_id}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => window.location.replace(`view-hd-ticket?id=${e.ticket_id}`)}
                                            >
                                                <td>{e.ticket_id}</td>
                                                <td>{e.ticket_subject}</td>
                                                <td>{e.ticket_status}</td>
                                                <td>{e.ticket_urgencyLevel}</td>
                                                <td>
                                                    {`${e.ticket_for.charAt(0).toUpperCase() + e.ticket_for.slice(1).toLowerCase()}`}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: "center" }}>No Tickets Found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {/* Pagination controls */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-3">
                                    <Pagination
                                        className="tickets-pagination"
                                        style={{
                                            "--bs-pagination-active-bg": "#053b00ff",
                                            "--bs-pagination-active-border-color": "#053b00ff",
                                            "--bs-pagination-color": "#053b00ff"
                                        }}
                                    >
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
                    </div>
                </Col>

                <Col>
                    <div
                        className="bento-item-header"
                        onClick={() =>
                            openModal(
                                "Ticket Summary",
                                <AllTicketSCAT filterType={filterType} showChart={false} location={location} />
                            )
                        }
                    >
                        <div
                            style={{
                                background: "#004e0dff",
                                borderRadius: "5px 5px 0 0",
                                color: "#fff",
                                padding: "10px",
                                textAlign: "center",
                                display: "flex",           // row layout
                                justifyContent: "center",  // center horizontally
                                alignItems: "center",      // align vertically
                                gap: "8px"                 // space between h4 and h6
                            }}
                        >
                            <h5 style={{ margin: 0, color: "#fff" }}><b>CSAT</b></h5>
                            <h6 style={{ margin: 0, color: "#fff" }}>(Customer Satisfaction Score)</h6>
                        </div>

                        <div className="bento-chart-wrapper" style={{ height: "100%" }}>
                            <AllTicketSCAT filterType={filterType} location={location} showChart={true} />
                        </div>
                    </div>
                </Col>

            </Row>

            {/* Other Charts */}
            <Row className="g-3">
                <Col xs={12} md={4}>
                    <div
                        className="bento-item-header"
                        onClick={() =>
                            openModal(
                                "Tickets by Location",
                                <AllDataOwn filterType={filterType} showChart={false} location={location} />
                            )
                        }
                    >
                        <div
                            style={{
                                background: "#004e0dff",
                                borderRadius: "5px 5px 0 0",
                                color: "#fff",
                                padding: "10px",
                                textAlign: "center",
                                display: "flex",           // row layout
                                justifyContent: "center",  // center horizontally
                                alignItems: "center",      // align vertically

                            }}
                        >
                            <h5 style={{ margin: 0, color: "#fff" }}><b>Ticket Completion Rate</b></h5>
                        </div>

                        <div className="bento-chart-wrapper" style={{ height: "100%" }}>
                            <AllDataOwn filterType={filterType} showChart={true} location={location} />
                        </div>


                    </div>
                </Col>
                <Col xs={12} md={4}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "Tickets by Type",
                                <AllTicketbyTypeOwn filterType={filterType} showChart={false} location={location} />
                            )
                        }
                    >
                        <AllTicketbyTypeOwn filterType={filterType} showChart={true} location={location} />
                    </div>
                </Col>

                <Col xs={12} md={4}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "All Tickets by Category",
                                <GetAllByCategoryOwn filterType={filterType} showChart={false} location={location} />
                            )
                        }
                    >
                        <GetAllByCategoryOwn filterType={filterType} showChart={true} location={location} />
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
