import { useEffect, useState } from "react";
import { Card, Container, Form, Col, Row, Alert, Pagination } from "react-bootstrap";
import axios from 'axios';
import config from 'config';
import { useNavigate } from 'react-router-dom';

export default function HistoryPMSTicket() {
    const [userData, setUserData] = useState([]);
    const [allTickets, setAllTicket] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [workedTickets, setWorkedTickets] = useState([]);
    const [ticketsfor, setTicketsFor] = useState([]);
    const [toFilter, setToFilter] = useState([]);

    const [sortOrder, setSortOrder] = useState('newest');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    const navigate = useNavigate();

    //Current user Data
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem("user"));
        setUserData(empInfo);

    }, []);

    //all ticket user worked
    useEffect(() => {
        if (!userData || !userData.user_name) return;

        const fetchData = async () => {
            try {
                // Fetch all tickets once
                const ticketRes = await axios.get(`${config.baseApi}/pmsticket/get-all-ticket`);
                const activeticket = ticketRes.data.filter((ticket) => ticket.is_active === true);

                // Update state
                setAllTicket(activeticket);
                console.log(activeticket)
                // ------------------- User Data ------------------------//
                const userClosedTickets = activeticket.filter((ticket) =>
                    ticket.pmsticket_for === userData.user_name &&
                    ticket.is_reviewed === true &&
                    ticket.is_active === true
                );
                setTicketsFor(userClosedTickets);
                console.log(userClosedTickets)


                //------------------------ Admin data ------------------------//
                const notesRes = await axios.get(`${config.baseApi}/authentication/get-all-notes`);
                const notes = notesRes.data || [];

                const createdNotes = notes.filter(note => note.created_by === userData.user_name);
                const uniqueIds = [...new Set(createdNotes.map(note => note.pmsticket_id))];

                const worked = activeticket.filter(ticket => {
                    const isUniqueId = uniqueIds.includes(ticket.pmsticket_id);

                    const isAssignedOrCreatedByUser =
                        ticket.assigned_to === userData.user_name ||
                        ticket.created_by === userData.user_name ||
                        ticket.updated_by === userData.user_name;

                    return (
                        isUniqueId ||

                        ((isUniqueId || isAssignedOrCreatedByUser) && ticket.is_reviewed === true || ticket.pms_status === 'closed')
                    );
                });

                console.log(worked);
                setWorkedTickets(worked);

                // Final filtering
                if (userData.emp_tier === 'helpdesk') {
                    setToFilter(worked);
                } else if (userData.emp_tier === 'user') {
                    setToFilter(userClosedTickets);
                }

            } catch (error) {
                console.error('Error fetching tickets or notes:', error);
            }
        };

        fetchData();
    }, [userData]);

    //Filter ticket
    const filteredTickets = toFilter.filter((ticket) => {

        const ticketDate = new Date(ticket.created_at || ticket.date_created || ticket.date);

        const matchesSearch = (
            ticket.pmsticket_id?.toString().includes(searchTerm) ||
            ticket.tag_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.pmsticket_for?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const matchesStatus = filterStatus === 'All' || ticket.pms_status?.toLowerCase() === filterStatus.toLowerCase();

        //  Date range filter
        const matchesDate =
            (!fromDate || ticketDate >= new Date(fromDate)) &&
            (!toDate || ticketDate <= new Date(toDate + 'T23:59:59'));

        return matchesSearch && matchesStatus && matchesDate;
    });

    //Ascending || descending
    const sortedTickets = [...filteredTickets].sort((a, b) => {
        const dateA = new Date(a.created_at || a.date_created || a.date); // adjust based on your DB column
        const dateB = new Date(b.created_at || b.date_created || b.date);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Pagination calculations
    const indexOfLastTicket = currentPage * ticketsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
    const currentTickets = sortedTickets.slice(indexOfFirstTicket, indexOfLastTicket);
    const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage)

    //Status badge design
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

    //navigate to the ticket
    const HandleView = (ticket) => {
        const params = new URLSearchParams({ id: ticket.pmsticket_id });
        const user = JSON.parse(localStorage.getItem('user'));

        if (user.emp_tier === 'helpdesk') {
            navigate(`/view-pms-hd-ticket?${params.toString()}`);
        } else if (user.emp_tier === 'user') {
            navigate(`/view-pms-user-ticket?${params.toString()}`);
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
            <div className="d-flex flex-wrap align-items-end gap-3 mb-4" style={{ width: '100%' }}>
                {/* Search */}
                <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                        Search
                    </Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Search by Problem/Issue, ID, Category, etc."
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
                </div>

                {/* Status */}
                <div style={{ flex: '0 1 180px', minWidth: '160px' }}>
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                        Status
                    </Form.Label>
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
                        <option value="resolved">Resolved</option>
                        <option value="re-opened">Re-opened</option>
                        <option value="closed">Closed</option>
                    </Form.Select>
                </div>

                {/* From Date */}
                <div style={{ flex: '0 1 160px', minWidth: '140px' }}>
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                        From
                    </Form.Label>
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
                </div>

                {/* To Date */}
                <div style={{ flex: '0 1 160px', minWidth: '140px' }}>
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                        To
                    </Form.Label>
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
                </div>

                {/* Sort */}
                <div style={{ flex: '0 1 180px', minWidth: '160px' }}>
                    <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                        Order
                    </Form.Label>
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
                </div>
            </div>



            {/* Desktop Table */}
            <div className="d-none d-md-block">
                <table className="table mb-0 table-hover align-middle">
                    <thead style={{ fontSize: '14px', textTransform: 'uppercase', color: '#555', background: '#f8f9fa' }}>
                        <tr>
                            <th>PMS Ticket ID</th>
                            <th>Created At</th>
                            <th>Tag id</th>
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
                                    <td>{ticket.pmsticket_id}</td>
                                    <td>{new Date(ticket.created_at).toLocaleString()}</td>
                                    <td>{ticket.tag_id}</td>
                                    <td>{ticket.assigned_to || '-'}</td>
                                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {ticket.description}
                                    </td>
                                    <td>{renderStatusBadge(ticket.pms_status)}</td>
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
                                <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>#{ticket.pmsticket_id}</div>
                                <div><strong>Tag_id:</strong> {ticket.tag_id}</div>
                                {/* <div><strong>Type:</strong> {ticket.ticket_type}</div> */}
                                <div><strong>Status:</strong> {renderStatusBadge(ticket.pms_status)}</div>
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