

import { Container, Row, Col, Form, Modal, Button, Pagination } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "config";


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

import AllTicketbyTypeOwn from "views/report/allticketbytypeown";
import AllTicketSCAT from "views/report/allticketSCAT";
import GetAllByCategoryOwn from "views/report/getallbycategoryown";
import AllDataOwn from "views/report/alldataown";
import AnimatedContent from "layouts/ReactBits/AnimatedContent";
import { useNavigate } from 'react-router';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function HDDashboard() {
    const [filterType, setFilterType] = useState("all");
    const [selectUserState, setSelectUserState] = useState(false)
    const [stats, setStats] = useState([]);
    const navigate = useNavigate();
    const [getAllHD, setGetAllHD] = useState([]);
    const [selectedHD, setSelectedHD] = useState("")

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

    const [userInfo, setUserInfo] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 11; // adjust how many rows per page
    const totalPages = Math.ceil(ownTicket.length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = ownTicket.slice(indexOfFirstItem, indexOfLastItem);

    //Modal Content setter
    const openModal = (title, content) => {
        setModalTitle(title);
        setModalContent(content);
        setShowModal(true);
    };

    //Filter Select user HD
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem("user"));
        if (getAllHD.length > 0 && !selectedHD) {
            setSelectedHD(empInfo.user_name);
        }

        if (empInfo.emp_role === 'admin' && empInfo.emp_tier === 'helpdesk') {
            setSelectUserState(true)
        }
    }, [getAllHD]);

    // Fetch tickets once
    useEffect(() => {
        const fetch = async () => {
            const empInfo = JSON.parse(localStorage.getItem("user"));
            setUserInfo(empInfo);
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                const data = res.data || [];
                setAllTickets(data);

                const resgetall = await axios.get(`${config.baseApi}/authentication/get-all-users`);
                const getallhd = resgetall.data.filter(hd => hd.emp_tier === 'helpdesk')
                setGetAllHD(getallhd)

                console.log('Get all HD: ', getAllHD)

                const own = data
                    .filter(e => e.assigned_to === selectedHD)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setOwnTicket(own)

                console.log(own)
            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, [selectedHD]);

    //Date calculator
    const calcTAT = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { diffMs, text: `${diffDays}d ${diffHours}h ${diffMinutes}m` };
    };

    //Modal Table
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
                            <th>Problem / Issue</th>
                            <th>Status</th>
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
                                    onClick={() => navigate(`/view-hd-ticket?id=${ticket.ticket_id}`)}
                                >
                                    <td>{ticket.ticket_id}</td>
                                    <td>{ticket.ticket_subject}</td>
                                    <td>{ticket.ticket_status}</td>
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

    // Filter || setting data for tables
    useEffect(() => {
        if (!allTickets.length) return;

        // Date Filter
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

        // save filtered tickets for modal usage
        setFilteredTickets(filtered);

        // Counters
        //Tickets
        setOpen(filtered.filter(ticket => (ticket.ticket_status === 'in-progress' || ticket.ticket_status === 'assigned' || ticket.ticket_status === 're-opened') &&
            (ticket.assigned_to === selectedHD && ticket.is_active === true)).length);

        //Not reviewed
        setNotReviewed(filtered.filter(ticket => ticket.is_reviewed === false && (ticket.ticket_status === 'closed' || ticket.ticket_status === 'resolved') &&
            (ticket.assigned_to === selectedHD && ticket.is_active === true)).length);

        //All open tickets
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


    }, [filterType, allTickets, selectedHD]);

    return (
        <Container fluid className="pt-100 px-3 px-md-5"
            style={{
                background: "linear-gradient(to bottom, #ffe798ff, #b8860b)",
                minHeight: "100vh",
                paddingTop: "100px",
                paddingBottom: "20px",
            }}>

            <AnimatedContent
                distance={100}
                direction="vertical"
                reverse={true}
                duration={0.8}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                scale={1.0}
                threshold={0.1}
                delay={0}
            >
                <Row className="align-items-center mb-4">
                    <Col xs={12} md={4} lg={3}>
                        <h2 className="mb-0"><b>Dashboard</b></h2>
                    </Col>

                    <Col xs={12} md={8} lg={9}>
                        <div className="d-flex justify-content-md-end flex-wrap gap-3">
                            {/* Date Filter */}
                            <Form.Group controlId="filterType1">
                                <Form.Select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    style={{ minWidth: "180px" }}
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
                            {/* All Helpdesk Users Option */}
                            {selectUserState && (
                                <Form.Group controlId="selectUser">
                                    <Form.Select
                                        value={selectedHD}
                                        onChange={(e) => setSelectedHD(e.target.value)}
                                        style={{ minWidth: "180px" }}
                                    >
                                        {getAllHD.map((hd) => (
                                            <option key={hd.user_name} value={hd.user_name}>
                                                {hd.user_name}
                                            </option>
                                        ))}

                                    </Form.Select>
                                </Form.Group>
                            )}
                        </div>
                    </Col>
                </Row>


                {/* Clickable Open / Not Reviewed / Closed cards */}
                <Row style={{ paddingBottom: '20px' }}>
                    {/* All Tickets */}
                    <Col>
                        <div
                            className="bento-item-top"
                            style={{ cursor: "pointer" }}
                            onClick={() => openModal(
                                `All Tickets`,
                                <TicketsTable tickets={filteredTickets.filter(t => (t.ticket_status === 'in-progress' || t.ticket_status === 'assigned' || t.ticket_status === 're-opened') &&
                                    (t.assigned_to === selectedHD && t.is_active === true))} />
                            )}
                        >
                            <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                                <b>Tickets</b>
                            </div>
                            <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                                <h1>{open || '0'}</h1>
                            </div>
                        </div>
                    </Col>
                    {/* Not-reviewed */}
                    <Col>
                        <div
                            className="bento-item-top"
                            style={{ cursor: "pointer" }}
                            onClick={() => openModal(
                                "Not Reviewed Tickets",
                                <TicketsTable tickets={filteredTickets.filter(t => t.is_reviewed === false &&
                                    (t.assigned_to === selectedHD && t.is_active === true) &&
                                    (t.ticket_status === 'closed' || t.ticket_status === 'resolved'))} />
                            )}
                        >
                            <div style={{ background: '#004e0dff', borderRadius: '5px 5px 0 0', color: '#fff', padding: '5px', textAlign: 'center' }}>
                                <b>Not Reviewed</b>
                            </div>
                            <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                                <h1>{notReviewed || '0'}</h1>
                            </div>
                        </div>
                    </Col>
                    {/* Open */}
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
                                <h1>{closed || '0'}</h1>
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
                                            <th>Problem/Issue</th>
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
                                                    onClick={() => navigate(`/view-hd-ticket?id=${e.ticket_id}`)}
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

                    {/* CSAT */}
                    <Col>
                        <div
                            className="bento-item-header"
                            onClick={() =>
                                openModal(
                                    "Ticket Summary",
                                    <AllTicketSCAT filterType={filterType} showChart={false} helpdesk={selectedHD} />
                                )}>
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
                                <AllTicketSCAT filterType={filterType} showChart={true} helpdesk={selectedHD} />
                            </div>
                        </div>
                    </Col>

                </Row>

                <Row className="g-2">
                    {/* Ticket Completion Rate */}
                    <Col xs={12} md={4}>
                        <div
                            className="bento-item-header"
                            onClick={() =>
                                openModal(
                                    "Tickets by Location",
                                    <AllDataOwn filterType={filterType} showChart={false} helpdesk={selectedHD} />
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
                                <AllDataOwn filterType={filterType} showChart={true} helpdesk={selectedHD} />
                            </div>


                        </div>
                    </Col>
                    {/* <Col xs={12} md={4}>
                    <div
                        className="bento-item bento-users"
                        onClick={() =>
                            openModal(
                                "Tickets by Type",
                                <AllTicketbyTypeOwn filterType={filterType} showChart={false} helpdesk={selectedHD} />
                            )
                        }
                    >
                        <AllTicketbyTypeOwn filterType={filterType} showChart={true} helpdesk={selectedHD} />
                    </div>
                </Col> */}

                    {/* BY CATEGORY */}
                    <Col xs={12} md={8}>
                        <div
                            className="bento-item bento-users"
                            onClick={() =>
                                openModal(
                                    "All Tickets by Category",
                                    <GetAllByCategoryOwn filterType={filterType} showChart={false} helpdesk={selectedHD} />
                                )
                            }
                        >
                            <GetAllByCategoryOwn filterType={filterType} showChart={true} helpdesk={selectedHD} />
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
            </AnimatedContent>
        </Container>
    );
}
