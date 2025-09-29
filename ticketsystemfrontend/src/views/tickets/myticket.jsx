import { useEffect, useState } from "react";
import axios from 'axios';
import config from 'config';
import { Card, Container, Form, Col, Row, Pagination } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function Myticket() {
    const [allticket, setAllTicket] = useState([]);
    const [userName, setUserName] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    const navigate = useNavigate();

    //User Information from local storage
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            const Fullname = user.user_name;
            setUserName(Fullname);
        }
    }, []);

    //Get All Tickets Assigned on User
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));

        if (!userName) return;

        axios.get(`${config.baseApi}/ticket/get-all-ticket`)
            .then((res) => {
                if (user.emp_tier === 'user') {
                    const userTickets = res.data.filter(
                        (ticket) => ticket.ticket_for === userName && ticket.is_active === true &&
                            (ticket.is_reviewed === false || ticket.is_reviewed === null)
                    );
                    setAllTicket(userTickets);
                } else if (user.emp_tier === 'helpdesk') {
                    const userTickets = res.data.filter(
                        (ticket) =>
                            ticket.assigned_to === userName && ticket.is_active === true &&
                            (ticket.is_reviewed === false || ticket.is_reviewed === null)
                    );
                    setAllTicket(userTickets);
                }
            })
            .catch((err) => console.error("Error fetching tickets:", err));
    }, [userName]);

    //-------------------STATUS DESIGN----------------------//
    const renderStatusBadge = (status) => {
        const baseStyle = {
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '50px',
            border: '0.1px solid',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            textAlign: 'center',
            minWidth: '60px',
        };

        let style = {};
        let label = status;

        switch (status?.toLowerCase()) {
            case 'open':
                style = { ...baseStyle, backgroundColor: '#dcffdeff', color: '#404040ff' };
                label = 'Open';
                break;
            case 'in-progress':
                style = { ...baseStyle, backgroundColor: '#033f00ff', color: '#ffffffff' };
                label = 'In Progress';
                break;
            case 'assigned':
                style = { ...baseStyle, backgroundColor: '#ffcb5aff', color: '#404040ff' };
                label = 'Assigned';
                break;
            case 'escalate':
                style = { ...baseStyle, backgroundColor: '#ff7d7dff', color: '#404040ff' };
                label = 'Escalated';
                break;
            case 'resolved':
                style = { ...baseStyle, backgroundColor: '#91c6ffff', color: '#404040ff' };
                label = 'Resolved';
                break;
            case 're-opened':
                style = { ...baseStyle, backgroundColor: '#28a745', color: '#ffffffff' };
                label = 'Re Opened';
                break;
            case 'closed':
                style = { ...baseStyle, backgroundColor: '#767676ff', color: '#000000ff' };
                label = 'Closed';
                break;
            default:
                style = { ...baseStyle, backgroundColor: '#6c757d' };
                break;
        }

        return <span style={style}>{label}</span>;
    };

    //--------------URGENCY DESGIN--------------------//
    const renderUrgencyBadge = (urgency) => {
        const baseStyle = {
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '50px',
            border: '0.1px solid',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            textAlign: 'center',
            minWidth: '60px',
        };

        let style = {};
        let label = urgency;

        switch (urgency?.toLowerCase()) {
            case 'low':
                style = { ...baseStyle, backgroundColor: '#003006ff', color: '#ffffffff' };
                label = 'Low';
                break;
            case 'medium':
                style = { ...baseStyle, backgroundColor: '#9e8600ff', color: '#ffffffff' };
                label = 'Medium';
                break;
            case 'high':
                style = { ...baseStyle, backgroundColor: '#720000ff', color: '#ffffffff' };
                label = 'High';
                break;
            case 'critical':
                style = { ...baseStyle, backgroundColor: '#fd0000ff', color: '#fefefeff' };
                label = 'Critical';
                break;
            default:
                style = { ...baseStyle, backgroundColor: '#6c757d' };
                break;
        }

        return <span style={style}>{label}</span>;
    };

    // Filter Function
    const filteredTickets = allticket.filter((ticket) => {
        const matchesSearch = (
            ticket.ticket_subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.ticket_id?.toString().includes(searchTerm) ||
            ticket.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.sub_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.Description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const matchesStatus = filterStatus === 'All' || ticket.ticket_status?.toLowerCase() === filterStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // Pagination calculations
    const indexOfLastTicket = currentPage * ticketsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
    const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

    // OnClick View Ticket Function
    const HandleView = (ticket) => {
        const params = new URLSearchParams({ id: ticket.ticket_id })
        const user = JSON.parse(localStorage.getItem('user'));

        if (user.emp_tier === 'helpdesk') {
            navigate(`/view-hd-ticket?${params.toString()}`)
        } else if (user.emp_tier === 'user') {
            navigate(`/view-ticket?${params.toString()}`)
        }
    }

    return (
        <Container
            style={{
                padding: '24px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
        >
            {/* Search and Filter */}
            <Row className="align-items-center g-3 mb-4">
                <Col xs={12} md={8} lg={9}>
                    <Form.Group controlId="search" style={{ width: '100%' }}>
                        <Form.Control
                            type="text"
                            placeholder="Search by Subject, ID, Category, etc."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            style={{
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '15px',
                                background: '#f8f9fa',
                            }}
                        />
                    </Form.Group>
                </Col>
                <Col xs={12} md={4} lg={3}>
                    <Form.Group controlId="status-filter" style={{ width: '100%' }}>
                        <Form.Select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            style={{
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '15px',
                                background: '#f8f9fa',
                            }}
                        >
                            <option value="All">All Status</option>
                            <option value="open">Open</option>
                            <option value="assigned">Assigned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="escalated">Escalated</option>
                            <option value="resolved">Resolved</option>
                            <option value="re-opened">Re-opened</option>
                            <option value="closed">Closed</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            {/* Desktop Table */}
            <div className="d-none d-md-block">
                <table className="table mb-0 table-hover align-middle">
                    <thead style={{ fontSize: '14px', textTransform: 'uppercase', color: '#555', background: '#f8f9fa' }}>
                        <tr>
                            <th>Ticket #</th>
                            <th>Subject</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Urgency</th>
                            <th>Description</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: '15px', color: '#333' }}>
                        {currentTickets.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-4">
                                    No matching tickets found.
                                </td>
                            </tr>
                        ) : (
                            currentTickets.map((ticket, index) => (
                                <tr
                                    key={index}
                                    onClick={() => HandleView(ticket)}
                                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                    className="table-row-hover"
                                >
                                    <td>{ticket.ticket_id}</td>
                                    <td>{ticket.ticket_subject}</td>
                                    <td>{ticket.ticket_type}</td>
                                    <td>{renderStatusBadge(ticket.ticket_status)}</td>
                                    <td>{renderUrgencyBadge(ticket.ticket_urgencyLevel)}</td>
                                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {ticket.Description}
                                    </td>
                                    <td style={{ color: '#003006ff', fontWeight: 500 }}>View</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="d-md-none">
                {currentTickets.length === 0 ? (
                    <Card body className="text-center">No matching tickets found.</Card>
                ) : (
                    currentTickets.map((ticket, index) => (
                        <Card
                            key={index}
                            className="mb-3"
                            onClick={() => HandleView(ticket)}
                            style={{
                                cursor: 'pointer',
                                borderRadius: '12px',
                                border: '1px solid #e9ecef',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                            }}
                        >
                            <Card.Body>
                                <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>#{ticket.ticket_id}</div>
                                <div><strong>Subject:</strong> {ticket.ticket_subject}</div>
                                <div><strong>Type:</strong> {ticket.ticket_type}</div>
                                <div><strong>Status:</strong> {renderStatusBadge(ticket.ticket_status)}</div>
                                <div><strong>Urgency:</strong> {renderUrgencyBadge(ticket.ticket_urgencyLevel)}</div>
                                <div style={{ marginBottom: 4 }}><strong>Description:</strong> {ticket.Description}</div>
                                <div style={{ marginTop: '8px', color: '#003006ff', fontWeight: 500 }}>View</div>
                            </Card.Body>
                        </Card>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />

                        {[...Array(totalPages)].map((_, index) => (
                            <Pagination.Item
                                key={index + 1}
                                active={index + 1 === currentPage}
                                onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                            </Pagination.Item>
                        ))}

                        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                </div>
            )}
        </Container>
    )
}
