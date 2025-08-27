import { useEffect, useState } from "react";
import { Card, Container, Form, Col, Row, Alert } from "react-bootstrap";
import axios from 'axios';
import config from 'config';
import { useNavigate } from 'react-router-dom';

export default function Alltickets() {
    const [userData, setUserData] = useState(null);
    const [allticket, setAllTicket] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [forAdminTickets, setForAdminTickets] = useState([]);

    const navigate = useNavigate();

    //Fetch user information from local storage
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem("user"));
        setUserData(empInfo);
    }, []);

    //Fetch all tickets
    useEffect(() => {
        axios.get(`${config.baseApi}/ticket/get-all-ticket`)
            .then((res) => {
                setAllTicket(res.data);
            });
    }, []);

    //Fetch all users
    useEffect(() => {
        axios.get(`${config.baseApi}/authentication/get-all-users`)
            .then((res) => {
                setAllUsers(res.data);
            });
    }, []);

    //Assigned to display tickets per role
    useEffect(() => {
        if (!userData || allticket.length === 0 || allUsers.length === 0) return;

        const departmentUsers = allUsers.filter(user => user.emp_department === userData.emp_department);
        const usernamesInDept = departmentUsers.map(user => user.user_name);

        const filtered = allticket.filter(ticket => usernamesInDept.includes(ticket.ticket_for));

        if (userData.emp_role === 'admin' && userData.emp_tier === 'none') {
            setForAdminTickets(filtered);
        } else if (userData.emp_role === 'user' && (userData.emp_tier === 'tier1' || userData.emp_tier === 'tier2' || userData.emp_tier === 'tier3')) {
            setForAdminTickets(allticket)
        } else if (userData.emp_role === 'admin' && (userData.emp_tier === 'tier1' || userData.emp_tier === 'tier2' || userData.emp_tier === 'tier3')) {
            setForAdminTickets(allticket)
        } else if (userData.emp_role === 'user' && userData.emp_tier === 'none') {
            Alert('CHANGE ACCOUNT TO VIEW THIS PAGE!')
        }
        console.log(filtered)
    }, [userData, allticket, allUsers]);

    //Filter ticket function
    const filteredTickets = forAdminTickets.filter((ticket) => {
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

    //Design for Status
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
                style = { ...baseStyle, backgroundColor: '#dcffdeff', color: '#404040ff' }; label = 'Open'; break;
            case 'in-progress':
                style = { ...baseStyle, backgroundColor: '#033f00ff', color: '#ffffffff' }; label = 'In Progress'; break;
            case 'assigned':
                style = { ...baseStyle, backgroundColor: '#ffcb5aff', color: '#404040ff' }; label = 'Assigned'; break;
            case 'escalate2':
                style = { ...baseStyle, backgroundColor: '#ff7d7dff', color: '#404040ff' }; label = 'Escalated to Tier II'; break;
            case 'escalate3':
                style = { ...baseStyle, backgroundColor: '#ff7d7dff', color: '#404040ff' }; label = 'Escalated to Tier III'; break;
            case 'resolved':
                style = { ...baseStyle, backgroundColor: '#91c6ffff', color: '#404040ff' }; label = 'Resolved'; break;
            case 're-opened':
                style = { ...baseStyle, backgroundColor: '#28a745', color: '#ffffffff' }; label = 'Re Opened'; break;
            case 'closed':
                style = { ...baseStyle, backgroundColor: '#767676ff', color: '#000000ff' }; label = 'Closed'; break;
            default:
                style = { ...baseStyle, backgroundColor: '#6c757d' }; break;
        }

        return <span style={style}>{label}</span>;
    };

    //Design for Urgency Levels
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
                style = { ...baseStyle, backgroundColor: '#003006ff', color: '#ffffffff' }; label = 'Low'; break;
            case 'medium':
                style = { ...baseStyle, backgroundColor: '#9e8600ff', color: '#ffffffff' }; label = 'Medium'; break;
            case 'high':
                style = { ...baseStyle, backgroundColor: '#720000ff', color: '#ffffffff' }; label = 'High'; break;
            case 'critical':
                style = { ...baseStyle, backgroundColor: '#fd0000ff', color: '#fefefeff' }; label = 'Critical'; break;
            default:
                style = { ...baseStyle, backgroundColor: '#6c757d' }; label = 'NONE'; break;
        }

        return <span style={style}>{label}</span>;
    };

    //onClick view ticket 
    const HandleView = (ticket) => {
        const params = new URLSearchParams({ id: ticket.ticket_id });
        const user = JSON.parse(localStorage.getItem('user'));

        if (user.emp_tier === 'tier1' || user.emp_tier === 'tier2' || user.emp_tier === 'tier3') {
            navigate(`/view-hd-ticket?${params.toString()}`);
        } else if (user.emp_tier === 'none') {
            navigate(`/view-ticket?${params.toString()}`);
        }
    };

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
            <Row className="align-items-center g-3 mb-4" >
                <Col xs={12} md={8} lg={9}>
                    <Form.Group controlId="search" style={{ width: '100%' }}>
                        <Form.Control
                            type="text"
                            placeholder="Search by Subject, ID, Category, etc."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                            onChange={(e) => setFilterStatus(e.target.value)}
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
                            <option value="escalate2">Escalated to Tier II</option>
                            <option value="escalate3">Escalated to Tier III</option>
                            <option value="resolved">Resolved</option>
                            <option value="re-opened">Re-opened</option>
                            <option value="closed">Closed</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            {/* Desktop Table */}
            <div className="d-none d-md-block" >
                <table className="table mb-0 table-hover align-middle" >
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
                        {filteredTickets.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-4">
                                    No matching tickets found.
                                </td>
                            </tr>
                        ) : (
                            filteredTickets.map((ticket, index) => (
                                <tr
                                    key={index}
                                    onClick={() => HandleView(ticket)}
                                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                    className="table-row-hover"
                                >
                                    <td>{ticket.ticket_id}</td>
                                    <td>{ticket.ticket_subject}</td>
                                    <td>{ticket.ticket_type === null || ticket.ticket_type === "" ? "NONE" : ticket.ticket_type}</td>

                                    <td>{renderStatusBadge(ticket.ticket_status)}</td>
                                    <td>{renderUrgencyBadge(ticket.ticket_urgencyLevel) || ''}</td>
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
                {filteredTickets.length === 0 ? (
                    <Card body className="text-center">No matching tickets found.</Card>
                ) : (
                    filteredTickets.map((ticket, index) => (
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
        </Container>

    )
}