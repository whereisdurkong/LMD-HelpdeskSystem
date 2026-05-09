import { useEffect, useState } from "react";
import axios from 'axios';
import config from 'config';
import { Card, Container, Form, Col, Row, Pagination, Modal, Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AnimatedContent from "layouts/ReactBits/AnimatedContent";

export default function Myticket() {
    const [allticket, setAllTicket] = useState([]);
    const [userName, setUserName] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    const [sortOrder, setSortOrder] = useState('newest');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedNewStatus, setSelectedNewStatus] = useState(null);

    const [error, setError] = useState('');
    const [successful, setSuccessful] = useState('');
    const [loading, setLoading] = useState(false);

    const [showCloseResolutionModal, setShowCloseResolutionModal] = useState(false);
    const [resolution, setResolution] = useState('');

    const [turnaroundtime, setTurnAroundTime] = useState('');

    const navigate = useNavigate();
    const empInfo = JSON.parse(localStorage.getItem('user'));

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

        const fetch = async () => {
            try {
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
            } catch (err) {
                console.log('UNable to get all tickets: ', err)
            }
        }

        fetch()

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
            // case 'escalate':
            //     style = { ...baseStyle, backgroundColor: '#ff7d7dff', color: '#404040ff' };
            //     label = 'Escalated';
            //     break;
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

        //  Date range filter
        const matchesDate =
            (!fromDate || ticketDate >= new Date(fromDate)) &&
            (!toDate || ticketDate <= new Date(toDate + 'T23:59:59'));

        return matchesSearch && matchesStatus && matchesDate;
    });

    //Sort Ascending || Descending
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

    //Changes Function
    const handleStatusChange = async (ticket, newStatus) => {
        console.log(ticket, newStatus)
        const prevStat = ticket.ticket_status

        setSelectedTicket(ticket);
        setSelectedNewStatus(newStatus);

        if (prevStat !== newStatus && newStatus === 'open') {
            setModalTitle(`Ticket ID: ${ticket.ticket_id}`)
            setModalContent(`Are you sure you want to "open" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        else if (prevStat !== newStatus && newStatus === 'in-progress') {
            setModalTitle(`Ticket ID: ${ticket.ticket_id}`)
            setModalContent(`Are you sure you want to change the status to "in-progress"?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        else if (prevStat !== newStatus && newStatus === 'resolved') {
            setModalTitle(`Ticket ID: ${ticket.ticket_id}`)
            setModalContent(`Are you sure you want to change the status to "resolved"?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        } else {
            setShowModal(false)
        }
    }

    //Save Function
    const handleUpdate = async () => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const prevStat = selectedTicket.ticket_status

        if (prevStat !== selectedNewStatus && selectedNewStatus === 'open') {
            setLoading(true);
            try {
                await axios.post(`${config.baseApi}/ticket/update-ticket`, {
                    ticket_id: selectedTicket.ticket_id,
                    ticket_status: selectedNewStatus,
                    updated_by: empInfo.user_id,
                    updated_at: new Date()
                });
                setSuccessful(`Succesfully changed Ticket ID: ${selectedTicket.ticket_id} to open!`);
                setTimeout(() => {
                    window.location.reload()
                }, 2000);
            } catch (err) {
                setError('Unable to change status, please try again!')
                console.log(err)
            }
        }
        else if (prevStat !== selectedNewStatus && selectedNewStatus === 'in-progress') {
            setLoading(true);
            try {
                await axios.post(`${config.baseApi}/ticket/update-ticket`, {
                    ticket_id: selectedTicket.ticket_id,
                    ticket_status: selectedNewStatus,
                    updated_by: empInfo.user_id,
                    updated_at: new Date()
                });
                setSuccessful(`Succesfully changed ${selectedTicket.ticket_id} to in-progress!`);
                setTimeout(() => {
                    window.location.reload()
                }, 2000);
            } catch (err) {
                setError('Unable to change status, please try again!')
                console.log(err)
            }
        }
        else if (prevStat !== selectedNewStatus && selectedNewStatus === 'resolved') {
            setShowCloseResolutionModal(true)
            setShowModal(false)
        }
    }

    //Reolved Function
    const handleResolved = async (e) => {
        e.preventDefault();
        setShowModal(false)
        const empInfo = JSON.parse(localStorage.getItem('user'));

        if (!turnaroundtime) {
            return setError('Unable to save empty Turn Around Time! Please try again!')
        }
        if (!selectedTicket.ticket_category)
            return setError('Unable to save empty Ticket Category! Please try again!');
        if (!selectedTicket.ticket_SubCategory)
            return setError('Unable to save empty Ticket Sub Category! Please try again!');
        try {
            setLoading(true);
            await axios.post(`${config.baseApi}/ticket/note-post`, {
                notes: resolution,
                current_user: empInfo.user_name,
                ticket_id: selectedTicket.ticket_id
            });
            await axios.post(`${config.baseApi}/ticket/notified-true`, {
                ticket_id: selectedTicket.ticket_id,
                user_id: empInfo.user_id
            });

            await axios.post(`${config.baseApi}/ticket/turnaround-time`, {
                tat: turnaroundtime,
                user_id: empInfo.user_id,
                ticket_id: selectedTicket.ticket_id,
                user_name: empInfo.user_name,
                category: selectedTicket.ticket_category,
                sub_category: selectedTicket.ticket_SubCategory,
                created_by: empInfo.user_name,
                ticket_type: 'support',
                ticket_created_at: selectedTicket.created_at
            })

            await axios.post(`${config.baseApi}/ticket/update-ticket`, {
                ticket_id: selectedTicket.ticket_id,
                ticket_status: selectedNewStatus,
                updated_by: empInfo.user_id,
                updated_at: new Date()
            });
            setSuccessful(`Succesfully changed ${selectedTicket.ticket_id} to resolved!`);
            setTimeout(() => {
                window.location.reload()
            }, 2000);

            setResolution('');
            console.log('Submitted a resolution succesfully')


        } catch (err) {
            console.log(err)
        }
    }

    return (
        <Container
            style={{
                padding: '20px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
        >
            {/* Alert Component */}
            {error && (
                <div
                    className="position-fixed start-50 l translate-middle-x"
                    style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}
                >
                    <Alert variant="danger" onClose={() => setError('')} dismissible>
                        {error}
                    </Alert>
                </div>
            )}
            {successful && (
                <div
                    className="position-fixed start-50 l translate-middle-x"
                    style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}
                >
                    <Alert variant="success" onClose={() => setSuccessful('')} dismissible>
                        {successful}
                    </Alert>
                </div>
            )}

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
                {/* Search, Status, Sort, and Date Range — Single Row */}
                <Row className="align-items-center g-2 mb-3 flex-wrap">

                    {/* Search Input */}
                    <Col xs={12} md={4} lg={4}>
                        <Form.Group controlId="search" style={{ width: '100%' }}>
                            <Form.Label
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    marginBottom: '4px',
                                }}
                            >
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
                                    padding: '10px 14px',
                                    fontSize: '15px',
                                    background: '#f8f9fa',
                                }}
                            />
                        </Form.Group>
                    </Col>

                    {/* Status Filter */}
                    <Col xs={12} md={2} lg={2}>
                        <Form.Group controlId="status-filter" style={{ width: '100%' }}>
                            <Form.Label
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    marginBottom: '4px',
                                }}
                            >
                                Status
                            </Form.Label>
                            <Form.Select
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                style={{
                                    border: '2px solid #e9ecef',
                                    borderRadius: '12px',
                                    padding: '10px 14px',
                                    fontSize: '15px',
                                    background: '#f8f9fa',
                                }}
                            >
                                <option value="All">All Status</option>
                                <option value="open">Open</option>
                                <option value="assigned">Assigned</option>
                                <option value="in-progress">In Progress</option>
                                {/* <option value="escalated">Escalated</option> */}
                                <option value="resolved">Resolved</option>
                                <option value="re-opened">Re-opened</option>
                                <option value="closed">Closed</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    {/* Date Range */}
                    <Col xs={12} md={4} lg={4}>
                        <div className="d-flex align-items-center gap-2 w-100">
                            <Form.Group controlId="from-date" className="flex-fill">
                                <Form.Label
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        marginBottom: '4px',
                                    }}
                                >
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
                            </Form.Group>

                            <Form.Group controlId="to-date" className="flex-fill">
                                <Form.Label
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        marginBottom: '4px',
                                    }}
                                >
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
                            </Form.Group>
                        </div>
                    </Col>

                    {/* Sort Filter */}
                    <Col xs={12} md={2} lg={2}>
                        <Form.Group controlId="sort-filter" style={{ width: '100%' }}>
                            <Form.Label
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    marginBottom: '4px',
                                }}
                            >
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
                        </Form.Group>
                    </Col>
                </Row>

                {/* Desktop Table */}
                <div className="d-none d-md-block">
                    <table className="table mb-0 table-hover align-middle">
                        <thead style={{ fontSize: '14px', textTransform: 'uppercase', color: '#555', background: '#f8f9fa' }}>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Created at</th>
                                <th>Problem/Issue</th>
                                {/* <th>Type</th> */}

                                <th>Assigned to</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        {empInfo.emp_tier === 'helpdesk' ? (
                            //HELPDESK TABLE DATA
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
                                            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                            className="table-row-hover"
                                        >
                                            <td onClick={() => HandleView(ticket)}>{ticket.ticket_id}</td>
                                            <td onClick={() => HandleView(ticket)}>{new Date(ticket.created_at).toLocaleString()}</td>
                                            <td onClick={() => HandleView(ticket)}>{ticket.ticket_subject}</td>
                                            <td onClick={() => HandleView(ticket)}>
                                                {(ticket.assigned_to || '').charAt(0).toUpperCase() + (ticket.assigned_to || '').slice(1).toLowerCase()}
                                            </td>
                                            <td
                                                style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                onClick={() => HandleView(ticket)}
                                            >
                                                {ticket.Description}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <Form.Select
                                                        value={ticket.ticket_status || ''}
                                                        onChange={(e) => handleStatusChange(ticket, e.target.value)}
                                                        style={{ width: 170, borderRadius: 8, fontSize: 13 }}
                                                    >
                                                        <option value="open">Open</option>
                                                        <option hidden value="assigned">Assigned</option>
                                                        <option value="in-progress">In-Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                        <option hidden value="re-opened">Re-Opened</option>
                                                        <option hidden value="closed">Closed</option>
                                                    </Form.Select>
                                                </div>
                                            </td>
                                            <td style={{ color: '#003006ff', fontWeight: 500 }} onClick={() => HandleView(ticket)}>View</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        ) : (
                            // USER TABLE DATA
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
                                            <td>{ticket.assigned_to}</td>


                                            <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ticket.Description}
                                            </td>
                                            <td>{renderStatusBadge(ticket.ticket_status)}</td>
                                            <td style={{ color: '#003006ff', fontWeight: 500 }}>View</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        )}
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
            </AnimatedContent>

            {/*HD Resolution Ticket */}
            <Modal show={showCloseResolutionModal} onHide={() => setShowCloseResolutionModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Resolution: (Required)</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="userResolution">
                        <Form.Label>How were you able to resolve?</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder="Enter your troubleshooting steps here"
                        />
                    </Form.Group>
                    <Form.Group controlId="userResolution">
                        <Form.Label>Turn around time(TAT)</Form.Label>
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                            name="ticket_tat"
                            value={turnaroundtime ?? ''}
                            onChange={(e) => setTurnAroundTime(e.target.value)}
                            required
                            disabled={!resolution}
                        >
                            <option value="" hidden>-</option>
                            <option value="30m">30 minutes</option>
                            <option value="1h">1 hour</option>
                            <option value="2h">2 hour</option>
                            <option value="1d">24 hour (1 day)</option>
                            <option value="2d">48 hour (2 days)</option>
                            <option value="3d">72 hour (3 days)</option>
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCloseResolutionModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleResolved}
                        disabled={resolution.trim() === ''}
                    >
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Change Status Modal */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="lg" // smaller than xl
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>

                <Modal.Body
                    style={{
                        maxHeight: "50vh", // responsive height limit
                        overflowY: "auto", // scroll if content is long
                        padding: "20px",
                        whiteSpace: 'pre-line',
                    }}
                >
                    {modalContent}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                    <Button variant='primary' onClick={handleUpdate}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Loading Component */}
            {loading && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.5)", // black transparent bg
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                    }}
                >
                    <Spinner animation="border" variant="light" />
                </div>

            )}
        </Container>
    )
}
