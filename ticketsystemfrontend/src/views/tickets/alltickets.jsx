import { useEffect, useState } from "react";
import { Card, Container, Form, Col, Row, Alert, Pagination, Spinner, Modal, Button } from "react-bootstrap";
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
    const [hdstate, setHDstate] = useState(false)

    const [filterLocation, setFilterLocation] = useState('All');
    const [empLocation, setEmpLocation] = useState('');

    const [sortOrder, setSortOrder] = useState('newest');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

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

    //Alerts timeout 3s
    useEffect(() => {
        if (error || successful) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessful('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, successful]);

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
                    const activeTicket = res.data.filter((ticket) => ticket.is_active === true);
                    setAllTicket(activeTicket);

                });

            if (user.emp_location) {
                setEmpLocation(user.emp_location);
                setFilterLocation(user.emp_location);   // auto-apply filter
            }
        } catch (err) {
            console.log('Unable to get all tickets: ', err)
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
            setHDstate(false)
            setForAdminTickets(filtered);
        } else if (userData.emp_role === 'user' && userData.emp_tier === 'helpdesk') {
            setHDstate(true)
            setForAdminTickets(allticket)
        } else if (userData.emp_role === 'admin' && userData.emp_tier === 'helpdesk') {
            setHDstate(true)
            setForAdminTickets(allticket)
        } else if (userData.emp_role === 'user' && userData.emp_tier === 'user') {
            setHDstate(false)
            console.log('change account to view archived tickets')
        }

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
        } else if (user.emp_tier === 'user') {
            navigate(`/view-ticket?${params.toString()}`);
        }
    };

    //Status Changes
    const handleStatusChange = async (ticket, newStatus) => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const prevStat = ticket.ticket_status;

        setSelectedTicket(ticket);
        setSelectedNewStatus(newStatus);
        //if na review na
        if ((prevStat === 'closed' && ticket.is_reviewed === true) && (newStatus === 'open' || newStatus === 'in-progress' || newStatus === 'resolved' || newStatus === 'assigned')) {
            setError('Unable to change status! Ticket was already reviewed')
        }
        //if open and empty yung fields
        else if (prevStat === 'open' && (newStatus === 'in-progress' || newStatus === 'resolved') && (ticket.sub_category?.trim() === '' || ticket.ticket_SubCategory?.trim() === '')) {
            setError(`Ticket ID: ${ticket.ticket_id}, Category and Sub-category fields are empty!`)
        }
        //if open and not empty
        else if (prevStat === 'open' && (newStatus === 'in-progress' || newStatus === 'resolved') && (ticket.sub_category?.trim() !== '' || ticket.ticket_SubCategory?.trim() !== '')) {
            setError(`Ticket ID: ${ticket.ticket_id}, you are not assigned on this ticket!`)
        }
        //Accept a ticket from open to assigned
        else if (prevStat === 'open' && newStatus === 'assigned') {
            setModalTitle(`Ticket ID: ${ticket.ticket_id}`)
            setModalContent(`Are you sure you want to "accept" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }


        //if assigned tapos open tas naka assign sa assgined na tao
        else if (prevStat === 'assigned' && newStatus === 'open' && (ticket.assigned_to === empInfo.user_name)) {
            setModalTitle(`Ticket ID: ${ticket.ticket_id}`)
            setModalContent(`Are you sure you want to "open" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        //!! 
        //if assigned tapos open tas naka assign sa ibang tao
        else if (prevStat === 'assigned' && (newStatus === 'in-progress' || newStatus === 'resolved' || newStatus === 'open') && (ticket.assigned_to !== empInfo.user_name || ticket.assigned_to === null)) {
            setError(`Ticket ID: ${ticket.ticket_id}, you are not assigned on this ticket!`)
        }
        //if assigned to in-progress and assigned user is the user
        else if (prevStat === 'assigned' && (newStatus === 'in-progress') && ticket.assigned_to === empInfo.user_name) {
            setModalTitle(`Ticket ID: ${ticket.ticket_id}`)
            setModalContent(`Are you sure you want to change the status to "in-progress"?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        //if assigned to resolved and assigned user is the user
        else if (prevStat === 'assigned' && (newStatus === 'resolved') && ticket.assigned_to === empInfo.user_name) {
            setModalTitle(`Ticket ID: ${ticket.ticket_id}`)
            setModalContent(`Are you sure you want to change the status to "resolved"?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }


        //in-progress changing to resolve or open And not the assign
        else if (prevStat === 'in-progress' && (newStatus === 'resolved' || newStatus === 'open') && ticket.assigned_to !== empInfo.user_name) {
            setError(`Ticket ID: ${ticket.ticket_id}, you are not assigned on this ticket!`)
        }
        else if (prevStat === 'in-progress' && newStatus === 'assigned' && ticket.assigned_to === empInfo.user_name) {
            setError(`Ticket ID: ${ticket.ticket_id}, you are already assigned on this ticket!`)
        }

        else if (prevStat === 'in-progress' && (newStatus === 'resolved') && ticket.assigned_to === empInfo.user_name) {
            setModalTitle(`Ticket ID: ${ticket.ticket_id}`)
            setModalContent(`Are you sure you want to "resolve" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        else if (prevStat === 'in-progress' && newStatus === 'open' && ticket.assigned_to === empInfo.user_name) {
            setModalTitle(`Ticket ID: ${ticket.ticket_id}`)
            setModalContent(`Are you sure you want to "open" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }

        //Accept ticket
        else if (prevStat === 'in-progress' && newStatus === 'assigned') {
            setModalTitle(`Ticket ID: ${ticket.ticket_id}`)
            setModalContent(`Are you sure you want to "accept" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        else {
            setShowModal(false)
        }
    }

    // Update Function
    const handleUpdate = async () => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const prevStat = selectedTicket.ticket_status

        if (prevStat === 'open' && selectedNewStatus === 'assigned') {
            setLoading(true);
            try {
                await axios.post(`${config.baseApi}/ticket/update-ticket`, {
                    ticket_id: selectedTicket.ticket_id,
                    ticket_status: selectedNewStatus,
                    assigned_to: empInfo.user_name,
                    updated_by: empInfo.user_id,
                    updated_at: new Date()
                });
                setSuccessful(`Succesfully changed Ticket ID: ${selectedTicket.ticket_id} to assigned!`);
                setTimeout(() => {
                    window.location.reload()
                }, 2000);
            } catch (err) {
                setError('Unable to change status, please try again!')
                console.log(err)
            }
        }
        else if (prevStat === 'assigned' && selectedNewStatus === 'open' && (selectedTicket.assigned_to === empInfo.user_name)) {
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
        else if (prevStat === 'assigned' && (selectedNewStatus === 'in-progress') && selectedTicket.assigned_to === empInfo.user_name) {
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
        else if (prevStat === 'assigned' && (selectedNewStatus === 'resolved') && selectedTicket.assigned_to === empInfo.user_name) {
            setShowCloseResolutionModal(true)
            setShowModal(false)
            console.log(selectedTicket.ticket_id)
        }

        else if (prevStat === 'in-progress' && (selectedNewStatus === 'resolved') && selectedTicket.assigned_to === empInfo.user_name) {
            setShowCloseResolutionModal(true)
            setShowModal(false)
            console.log(selectedTicket.ticket_id)
        }
        else if (prevStat === 'in-progress' && selectedNewStatus === 'open' && selectedTicket.assigned_to === empInfo.user_name) {
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

        else if (prevStat === 'in-progress' && newStatus === 'assigned') {
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
    }

    // Resolution Function
    const handleResolved = async (e) => {
        e.preventDefault();
        setShowModal(false)

        const empInfo = JSON.parse(localStorage.getItem('user'));

        if (!turnaroundtime) {
            return setError('Unable to save empty Turn Around Time! Please try again!')
        }

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
            setSuccessful(`Succesfully changed ${selectedTicket.ticket_id} to in-progress!`);
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
            }}>
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
            {/* Search and Filter */}
            {hdstate ? (
                // Helpdesk View
                <div
                    className="d-flex flex-wrap align-items-end gap-3 mb-4"
                    style={{ width: "100%" }}
                >
                    {/* Search */}
                    <div style={{ flex: "1 1 300px" }}>
                        <Form.Group controlId="search" style={{ width: "100%" }}>
                            <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                Search
                            </Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Search by Problem/Issue, ID, Category, etc."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    border: "2px solid #e9ecef",
                                    borderRadius: "12px",
                                    padding: "12px 16px",
                                    fontSize: "15px",
                                    background: "#f8f9fa",
                                }}
                            />
                        </Form.Group>
                    </div>

                    {/* Status Filter */}
                    <div style={{ flex: "0 1 180px" }}>
                        <Form.Group controlId="status-filter" style={{ width: "100%" }}>
                            <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                Status
                            </Form.Label>
                            <Form.Select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    border: "2px solid #e9ecef",
                                    borderRadius: "12px",
                                    padding: "12px 16px",
                                    fontSize: "15px",
                                    background: "#f8f9fa",
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
                            <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                Site
                            </Form.Label>
                            <Form.Select
                                value={filterLocation}
                                onChange={(e) => {
                                    setFilterLocation(e.target.value);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    border: "2px solid #e9ecef",
                                    borderRadius: "12px",
                                    padding: "12px 16px",
                                    fontSize: "15px",
                                    background: "#f8f9fa",
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
                            <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                From
                            </Form.Label>
                            <Form.Control
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    border: "2px solid #e9ecef",
                                    borderRadius: "12px",
                                    padding: "10px 14px",
                                    fontSize: "15px",
                                    background: "#f8f9fa",
                                }}
                            />
                        </Form.Group>

                        <Form.Group controlId="to-date" className="flex-fill">
                            <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                To
                            </Form.Label>
                            <Form.Control
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    border: "2px solid #e9ecef",
                                    borderRadius: "12px",
                                    padding: "10px 14px",
                                    fontSize: "15px",
                                    background: "#f8f9fa",
                                }}
                            />
                        </Form.Group>
                    </div>

                    {/* Sort Filter */}
                    <div style={{ flex: "0 1 180px" }}>
                        <Form.Group controlId="sort-filter" style={{ width: "100%" }}>
                            <Form.Label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                Order
                            </Form.Label>
                            <Form.Select
                                value={sortOrder}
                                onChange={(e) => {
                                    setSortOrder(e.target.value);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    border: "2px solid #e9ecef",
                                    borderRadius: "12px",
                                    padding: "10px 14px",
                                    fontSize: "15px",
                                    background: "#f8f9fa",
                                }}
                            >
                                <option value="newest">Newest to Oldest</option>
                                <option value="oldest">Oldest to Newest</option>
                            </Form.Select>
                        </Form.Group>
                    </div>
                </div>

            ) : (
                // User View
                <Row className="align-items-center g-3 mb-4" >
                    <Col xs={12} md={8} lg={9}>
                        <Form.Group controlId="search" style={{ width: '100%' }}>
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
                                {/* <option value="escalate">Escalated</option> */}
                                <option value="resolved">Resolved</option>
                                <option value="re-opened">Re-opened</option>
                                <option value="closed">Closed</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>

                </Row>
            )}
            {/* Desktop Table */}
            <div className="d-none d-md-block" >
                <table className="table mb-0 table-hover align-middle" >
                    <thead style={{ fontSize: '14px', textTransform: 'uppercase', color: '#555', background: '#f8f9fa' }}>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Created At</th>
                            <th>Problem/Issue</th>
                            <th>Assigned To</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    {hdstate ? (
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
                                        <td onClick={() => HandleView(ticket)}>{ticket.created_at}</td>
                                        <td onClick={() => HandleView(ticket)}>{ticket.ticket_subject}</td>
                                        <td onClick={() => HandleView(ticket)}>{ticket.assigned_to || '-'}</td>
                                        <td onClick={() => HandleView(ticket)} style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                                                    {ticket.ticket_status === 'assigned' ? (
                                                        <option value="assigned">Assigned</option>
                                                    ) : (
                                                        <option value="assigned">Accept</option>
                                                    )}
                                                    <option value="in-progress">In-Progress</option>
                                                    <option value="resolved">Resolved</option>
                                                    <option hidden value="re-opened">Re-Opened</option>
                                                    <option hidden value="closed">Closed</option>
                                                </Form.Select>
                                            </div>
                                        </td>
                                        <td onClick={() => HandleView(ticket)} style={{ color: '#003006ff', fontWeight: 500 }}>View</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    ) : (
                        //USER TABLE DATA
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
                                        <td>{ticket.created_at}</td>
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

            {/*HD Resolution Ticket */}
            <Modal show={showCloseResolutionModal} onHide={() => setShowCloseResolutionModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Resolution: (required)</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="userResolution">
                        <Form.Label>How were you able to resolve Ticket ID:{selectedTicket?.ticket_id || ''}</Form.Label>
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

            {/* Logs MOdal */}
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

            {/* Loading COmponent */}
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