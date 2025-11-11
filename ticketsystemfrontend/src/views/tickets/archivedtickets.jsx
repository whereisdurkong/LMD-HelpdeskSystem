import { useEffect, useState } from "react";
import { Card, Container, Form, Col, Row, Alert, Pagination } from "react-bootstrap";
import axios from 'axios';
import config from 'config';
import { useNavigate } from 'react-router-dom';

export default function ArchivedTickets() {
    const [userData, setUserData] = useState(null);
    const [allticket, setAllTicket] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [forAdminTickets, setForAdminTickets] = useState([]);

    const [filterLocation, setFilterLocation] = useState('All');
    const [empLocation, setEmpLocation] = useState('');

    const [sortOrder, setSortOrder] = useState('newest');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    const navigate = useNavigate();

    //Fetch user information from local storage
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem("user"));
        setUserData(empInfo);
    }, []);

    //Fetch all tickets
    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            axios.get(`${config.baseApi}/ticket/get-all-ticket`)
                .then((res) => {

                    const archived = res.data.filter(ticket => ticket.is_active === false)
                    console.log(archived)
                    setAllTicket(archived);
                });

            if (user.emp_location) {
                setEmpLocation(user.emp_location);
                setFilterLocation(user.emp_location);   // auto-apply filter
            }
        } catch (err) {
            console.log('Unable to get all archive: ', err);
        }

    }, []);

    //Fetch all users
    useEffect(() => {
        try {
            axios.get(`${config.baseApi}/authentication/get-all-users`)
                .then((res) => {
                    setAllUsers(res.data);
                });
        } catch (err) {
            console.log('Unable to get all users: ', err)
        }
    }, []);

    //Assigned to display tickets per role
    useEffect(() => {
        if (!userData || allticket.length === 0 || allUsers.length === 0) return;

        const departmentUsers = allUsers.filter(user => user.emp_department === userData.emp_department);
        const usernamesInDept = departmentUsers.map(user => user.user_name);

        const filtered = allticket.filter(ticket => usernamesInDept.includes(ticket.ticket_for));

        if (userData.emp_role === 'admin' && userData.emp_tier === 'user') {
            setForAdminTickets(filtered);
        } else if (userData.emp_role === 'user' && userData.emp_tier === 'helpdesk') {
            setForAdminTickets(allticket)
        } else if (userData.emp_role === 'admin' && userData.emp_tier === 'helpdesk') {
            setForAdminTickets(allticket)
        } else if (userData.emp_role === 'user' && userData.emp_tier === 'user') {
            console.log('change account to view archived tickets')
        }
        console.log(filtered)
    }, [userData, allticket, allUsers]);

    //Filter ticket function
    const filteredTickets = forAdminTickets.filter((ticket) => {

        const ticketDate = new Date(ticket.created_at || ticket.date_created || ticket.date);

        const matchesSearch = (
            ticket.ticket_subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.ticket_id?.toString().includes(searchTerm) ||
            ticket.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.sub_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.ticket_for?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const matchesStatus = filterStatus === 'All' || ticket.ticket_status?.toLowerCase() === filterStatus.toLowerCase();

        const matchesLocation =
            filterLocation === 'All' ||
            ticket.assigned_location?.toLowerCase() === filterLocation.toLowerCase();

        const matchesDate =
            (!fromDate || ticketDate >= new Date(fromDate)) &&
            (!toDate || ticketDate <= new Date(toDate + 'T23:59:59'));

        return matchesSearch && matchesStatus && matchesLocation && matchesDate;
    });

    //Ascending and desending 
    const sortedTickets = [...filteredTickets].sort((a, b) => {
        const dateA = new Date(a.created_at || a.date_created || a.date); // adjust based on your DB column
        const dateB = new Date(b.created_at || b.date_created || b.date);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Pagination calculations
    const indexOfLastTicket = currentPage * ticketsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
    const currentTickets = sortedTickets.slice(indexOfFirstTicket, indexOfLastTicket);
    const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage);


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
            // case 'escalate':
            //     style = { ...baseStyle, backgroundColor: '#ff7d7dff', color: '#404040ff' }; label = 'Escalated'; break;
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

        if (user.emp_tier === 'helpdesk') {
            navigate(`/view-hd-ticket?${params.toString()}`);
        } else if (user.emp_tier === 'none') {
            navigate(`/view-ticket?${params.toString()}`);
        }
    };

    return (
        <Container
            style={{
                padding: '20px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',

            }}
        >
            {/* Search and Filter */}
            <div
                className="d-flex flex-wrap align-items-end gap-3 mb-4"
                style={{ width: "100%" }}
            >
                {/* Search */}
                <div style={{ flex: "1 1 300px" }}>
                    <Form.Group controlId="search" style={{ width: "100%" }}>
                        <Form.Label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Search</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Search by Problem/Issue, ID, Category, etc."
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
                </div>

                {/* Status Filter */}
                <div style={{ flex: "0 1 180px" }}>
                    <Form.Group controlId="status-filter" style={{ width: "100%" }}>
                        <Form.Label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Status</Form.Label>
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
                            {/* <option value="escalate">Escalated</option> */}
                            <option value="resolved">Resolved</option>
                            <option value="re-opened">Re-opened</option>
                            <option value="closed">Closed</option>
                        </Form.Select>
                    </Form.Group>
                </div>

                {/* Location Filter */}
                <div style={{ flex: "0 1 160px" }}>
                    <Form.Group controlId="location-filter" style={{ width: "100%" }}>
                        <Form.Label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Site</Form.Label>
                        <Form.Select
                            value={filterLocation}
                            onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
                            style={{
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '15px',
                                background: '#f8f9fa',
                            }}
                        >
                            <option value="All">LMD & CORP</option>
                            <option value="lmd">LMD</option>
                            <option value="corp">Corp</option>
                        </Form.Select>
                    </Form.Group>
                </div>

                {/* Date Range */}
                <div className="d-flex align-items-end gap-2" style={{ flex: "0 1 300px" }}>
                    <Form.Group controlId="from-date" className="flex-fill">
                        <Form.Label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>From</Form.Label>
                        <Form.Control
                            type="date"
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                            style={{
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                padding: '10px 14px',
                                fontSize: '15px',
                                background: '#f8f9fa',
                            }}
                        />
                    </Form.Group>


                    <Form.Group controlId="to-date" className="flex-fill">
                        <Form.Label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>To</Form.Label>
                        <Form.Control
                            type="date"
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                            style={{
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                padding: '10px 14px',
                                fontSize: '15px',
                                background: '#f8f9fa',
                            }}
                        />
                    </Form.Group>
                </div>

                {/* Sort Filter */}
                <div style={{ flex: "0 1 180px" }}>
                    <Form.Group controlId="sort-filter" style={{ width: "100%" }}>
                        <Form.Label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Order</Form.Label>
                        <Form.Select
                            value={sortOrder}
                            onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                            style={{
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                padding: '10px 14px',
                                fontSize: '15px',
                                background: '#f8f9fa',
                            }}
                        >
                            <option value="newest">Newest to Oldest</option>
                            <option value="oldest">Oldest to Newest</option>
                        </Form.Select>
                    </Form.Group>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="d-none d-md-block" >
                <table className="table mb-0 table-hover align-middle" >
                    <thead style={{ fontSize: '14px', textTransform: 'uppercase', color: '#555', background: '#f8f9fa' }}>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Created at</th>
                            <th>Problem/Issue</th>
                            <th>Assigned to</th>
                            <th>Description</th>
                            <th>Status</th>
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
                                    <td>{new Date(ticket.created_at).toLocaleString()}</td>
                                    <td>{ticket.ticket_subject}</td>
                                    <td>{ticket.assigned_to || '-'}</td>
                                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {ticket.Description}
                                    </td>
                                    <td>{renderStatusBadge(ticket.ticket_status)}</td>
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
                                <div><strong>Problem/Issue:</strong> {ticket.ticket_subject}</div>
                                {/* <div><strong>Type:</strong> {ticket.ticket_type}</div> */}
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
            {
                totalPages > 1 && (
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
                )
            }
        </Container >

    )
}