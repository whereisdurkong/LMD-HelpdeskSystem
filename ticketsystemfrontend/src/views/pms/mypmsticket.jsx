
import { useEffect, useState } from "react";
import axios from 'axios';
import config from 'config';
import { Card, Container, Form, Col, Row, Pagination, Modal, Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AnimatedContent from "layouts/ReactBits/AnimatedContent";

export default function MyPmsTicket() {
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
    const [assets, setAssets] = useState([]);

    const navigate = useNavigate();
    const empInfo = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetch = async () => {
            const res = await axios.get(`${config.baseApi}/pms/get-all-pms`);
            const data = res.data || [];
            const active = data.filter(a => a.is_active === "1");
            setAssets(active)
        }
        fetch();
    }, [])


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
                await axios.get(`${config.baseApi}/pmsticket/get-all-pmsticket`)
                    .then((res) => {
                        if (user.emp_tier === 'user') {
                            const userTickets = res.data.filter(
                                (pmsticket) => pmsticket.pmsticket_for === userName && pmsticket.is_active === true &&
                                    (pmsticket.is_reviewed === false || pmsticket.is_reviewed === null)
                            );
                            console.log(userTickets)
                            setAllTicket(userTickets);
                        } else if (user.emp_tier === 'helpdesk') {
                            const userTickets = res.data.filter(
                                (ticket) =>
                                    ticket.assigned_to === userName && ticket.is_active === true &&
                                    (ticket.is_reviewed === false || ticket.is_reviewed === null) &&
                                    ticket.pms_status !== 'closed'
                            );
                            setAllTicket(userTickets);
                        }
                    })
                    .catch((err) => console.error("Error fetching tickets:", err));
            } catch (err) {
                console.log('Unable to fetch all pmsticket: ', err)
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

    // Filter Function
    const filteredTickets = allticket.filter((ticket) => {
        const ticketDate = new Date(ticket.created_at);

        const matchesSearch = (

            ticket.pmsticket_id?.toString().includes(searchTerm) ||
            ticket.tag_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage);

    // OnClick View Ticket Function
    const HandleView = (ticket) => {
        const params = new URLSearchParams({ id: ticket.pmsticket_id })
        const user = JSON.parse(localStorage.getItem('user'));

        if (user.emp_tier === 'helpdesk') {
            navigate(`/view-pms-hd-ticket?${params.toString()}`)
        } else if (user.emp_tier === 'user') {
            navigate(`/view-pms-user-ticket?${params.toString()}`)
        }
    }

    //Handle Status Change Function
    const handleStatusChange = async (ticket, newStatus) => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const prevStat = ticket.pms_status;

        setSelectedTicket(ticket);
        setSelectedNewStatus(newStatus);
        //if na review na
        if ((prevStat === 'closed' && ticket.is_reviewed === true) && (newStatus === 'open' || newStatus === 'in-progress' || newStatus === 'resolved' || newStatus === 'closed' || newStatus === 'assigned')) {
            setError('Unable to change status! Ticket was already reviewed')
        }
        //if open and not empty
        else if (prevStat === 'open' && (newStatus === 'in-progress' || newStatus === 'resolved') && (ticket.sub_category?.trim() !== '' || ticket.ticket_SubCategory?.trim() !== '')) {
            setError(`Ticket ID: ${ticket.pmsticket_id}, you are not assigned on this ticket!`)
        }
        //Accept a ticket from open to assigned
        else if (prevStat === 'open' && newStatus === 'assigned') {
            setModalTitle(`Ticket ID: ${ticket.pmsticket_id}`)
            setModalContent(`Are you sure you want to "accept" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }

        //if assigned tapos open tas naka assign sa assgined na tao
        else if (prevStat === 'assigned' && newStatus === 'open' && (ticket.assigned_to === empInfo.user_name)) {
            setModalTitle(`Ticket ID: ${ticket.pmsticket_id}`)
            setModalContent(`Are you sure you want to "open" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        //!! 
        //if assigned tapos open tas naka assign sa ibang tao
        else if (prevStat === 'assigned' && (newStatus === 'in-progress' || newStatus === 'resolved' || newStatus === 'open') && (ticket.assigned_to !== empInfo.user_name || ticket.assigned_to === null)) {
            setError(`Ticket ID: ${ticket.pmsticket_id}, you are not assigned on this ticket!`)
        }
        //if assigned to in-progress and assigned user is the user
        else if (prevStat === 'assigned' && (newStatus === 'in-progress') && ticket.assigned_to === empInfo.user_name) {
            setModalTitle(`Ticket ID: ${ticket.pmsticket_id}`)
            setModalContent(`Are you sure you want to change the status to "in-progress"?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        //if assigned to resolved and assigned user is the user
        else if (prevStat === 'assigned' && (newStatus === 'resolved') && ticket.assigned_to === empInfo.user_name) {
            setModalTitle(`Ticket ID: ${ticket.pmsticket_id}`)
            setModalContent(`Are you sure you want to change the status to "resolved"?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        /////////TAT


        //in-progress changing to resolve or open And not the assign
        else if (prevStat === 'in-progress' && (newStatus === 'resolved' || newStatus === 'open') && ticket.assigned_to !== empInfo.user_name) {
            setError(`Ticket ID: ${ticket.pmsticket_id}, you are not assigned on this ticket!`)
        }
        else if (prevStat === 'in-progress' && newStatus === 'assigned' && ticket.assigned_to === empInfo.user_name) {
            setError(`Ticket ID: ${ticket.pmsticket_id}, you are already assigned on this ticket!`)
        }

        else if (prevStat === 'in-progress' && (newStatus === 'resolved') && ticket.assigned_to === empInfo.user_name) {
            setModalTitle(`Ticket ID: ${ticket.pmsticket_id}`)
            setModalContent(`Are you sure you want to "resolve" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        else if (prevStat === 'in-progress' && newStatus === 'open' && ticket.assigned_to === empInfo.user_name) {
            setModalTitle(`Ticket ID: ${ticket.pmsticket_id}`)
            setModalContent(`Are you sure you want to "open" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }

        //Accept ticket
        else if (prevStat === 'in-progress' && newStatus === 'assigned') {
            setModalTitle(`Ticket ID: ${ticket.pmsticket_id}`)
            setModalContent(`Are you sure you want to "accept" this ticket?\n\nReminder: Leave a note before committing changes.`)
            setShowModal(true)
        }
        else {
            setShowModal(false)
        }
    }

    //Update pms ticket function
    // const handleUpdate = async () => {
    //     const empInfo = JSON.parse(localStorage.getItem('user'));
    //     const prevStat = selectedTicket.pms_status

    //     if (prevStat !== selectedNewStatus && selectedNewStatus === 'open') {
    //         setLoading(true);
    //         try {
    //             await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
    //                 pmsticket_id: selectedTicket.pmsticket_id,
    //                 pms_status: selectedNewStatus,
    //                 updated_by: empInfo.user_id,
    //                 updated_at: new Date()
    //             });
    //             setSuccessful(`Succesfully changed Ticket ID: ${selectedTicket.pmsticket_id} to open!`);
    //             setTimeout(() => {
    //                 window.location.reload()
    //             }, 2000);
    //         } catch (err) {
    //             setError('Unable to change status, please try again!')
    //             console.log(err)
    //         }
    //     }
    //     else if (prevStat !== selectedNewStatus && selectedNewStatus === 'in-progress') {
    //         setLoading(true);
    //         try {
    //             await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
    //                 pmsticket_id: selectedTicket.pmsticket_id,
    //                 pms_status: selectedNewStatus,
    //                 updated_by: empInfo.user_id,
    //                 updated_at: new Date()
    //             });
    //             setSuccessful(`Succesfully changed ${selectedTicket.pmsticket_id} to in-progress!`);
    //             setTimeout(() => {
    //                 window.location.reload()
    //             }, 2000);
    //         } catch (err) {
    //             setError('Unable to change status, please try again!')
    //             console.log(err)
    //         }
    //     }
    //     else if (prevStat !== selectedNewStatus && selectedNewStatus === 'closed') {
    //         setShowCloseResolutionModal(true)
    //         setShowModal(false)
    //     }
    // }

    const handleUpdate = async () => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        const prevStat = selectedTicket.pms_status

        if (prevStat === 'open' && selectedNewStatus === 'assigned') {
            setLoading(true);
            try {
                await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                    pmsticket_id: selectedTicket.pmsticket_id,
                    pms_status: selectedNewStatus,
                    assigned_to: empInfo.user_name,
                    updated_by: empInfo.user_id,
                    updated_at: new Date()
                });
                setSuccessful(`Succesfully changed Ticket ID: ${selectedTicket.pmsticket_id} to assigned!`);
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
                await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                    pmsticket_id: selectedTicket.pmsticket_id,
                    pms_status: selectedNewStatus,
                    updated_by: empInfo.user_id,
                    updated_at: new Date()
                });
                setSuccessful(`Succesfully changed Ticket ID: ${selectedTicket.pmsticket_id} to open!`);
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
                await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                    pmsticket_id: selectedTicket.pmsticket_id,
                    pms_status: selectedNewStatus,
                    updated_by: empInfo.user_id,
                    updated_at: new Date()
                });
                setSuccessful(`Succesfully changed Ticket ID: ${selectedTicket.pmsticket_id} to open!`);
                setTimeout(() => {
                    window.location.reload()
                }, 2000);
            } catch (err) {
                setError('Unable to change status, please try again!')
                console.log(err)
            }
        }
        ////TAT
        else if (prevStat === 'assigned' && (selectedNewStatus === 'resolved') && selectedTicket.assigned_to === empInfo.user_name) {
            setShowCloseResolutionModal(true)
            setShowModal(false)
            console.log(selectedTicket.pmsticket_id)
        }

        else if (prevStat === 'in-progress' && (selectedNewStatus === 'resolved') && selectedTicket.assigned_to === empInfo.user_name) {
            setShowCloseResolutionModal(true)
            setShowModal(false)
            console.log(selectedTicket.pmsticket_id)
        }
        else if (prevStat === 'in-progress' && selectedNewStatus === 'open' && selectedTicket.assigned_to === empInfo.user_name) {
            setLoading(true);
            try {
                await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                    pmsticket_id: selectedTicket.pmsticket_id,
                    pms_status: selectedNewStatus,
                    updated_by: empInfo.user_id,
                    updated_at: new Date()
                });
                setSuccessful(`Succesfully changed Ticket ID: ${selectedTicket.pmsticket_id} to open!`);
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
                await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                    pmsticket_id: selectedTicket.pmsticket_id,
                    pms_status: selectedNewStatus,
                    updated_by: empInfo.user_id,
                    updated_at: new Date()
                });
                setSuccessful(`Succesfully changed Ticket ID: ${selectedTicket.pmsticket_id} to open!`);
                setTimeout(() => {
                    window.location.reload()
                }, 2000);
            } catch (err) {
                setError('Unable to change status, please try again!')
                console.log(err)
            }
        }
    }

    // useEffect(() => {
    //     const selectedAsset = assets.find(asset => asset.tag_id === selectedTicket.tag_id);


    //     console.log('Selected Asset:', assets);


    // }, [])

    //Handle when resolved
    const handleResolved = async (e) => {
        e.preventDefault();
        setShowModal(false)
        const empInfo = JSON.parse(localStorage.getItem('user'));


        if (selectedTicket.tag_id === '' || selectedTicket.tag_id === null || selectedTicket.tag_id === undefined) {
            setError('Unable to save empty Asset Tag! Please try again!');
            return;
        }

        const selectedAsset = assets.find(asset => asset.tag_id === selectedTicket.tag_id);

        if (!selectedAsset) {
            console.log(`${selectedTicket.tag_id} not found in assets list.`);
            setError(`Tag ID: ${selectedTicket.tag_id} not found in assets list. `);
            return;
        }

        if (selectedAsset.is_active === "0" || selectedAsset.is_active === false) {
            setError('Selected asset is inactive. Please select an active asset.');
            return;
        }

        console.log('Selected Asset:', selectedAsset);
        // const selectedOption = options.find(opt => opt.value === formData.tag_id);

        console.log('user_id:', empInfo.user_id,
            'username: ', empInfo.user_name,
            'pmsticket_id: ', selectedTicket.pmsticket_id,
            'turnaroundtime: ', turnaroundtime,
            'asset:', selectedAsset.tag_id,
            'pms_category: ', selectedAsset.pms_category,
            'ticket_type: pms',
            'ticket_created_at: ', selectedTicket.created_at)
        try {
            setLoading(true);
            await axios.post(`${config.baseApi}/pmsticket/note-hd-post`, {
                notes: resolution,
                current_user: empInfo.user_name,
                pmsticket_id: selectedTicket.pmsticket_id
            });
            await axios.post(`${config.baseApi}/pmsticket/notified-true`, {
                pmsticket_id: selectedTicket.pmsticket_id,
                user_id: empInfo.user_id
            });

            await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                pmsticket_id: selectedTicket.pmsticket_id,
                pms_status: selectedNewStatus,
                updated_by: empInfo.user_id,
                updated_at: new Date()
            });

            await axios.post(`${config.baseApi}/pms/turnaround-time`, {
                tat: turnaroundtime,
                user_id: empInfo.user_id,
                pmsticket_id: selectedTicket.pmsticket_id,
                user_name: empInfo.user_name,
                pms_category: selectedAsset.pms_category,
                created_by: empInfo.user_name,
                ticket_type: 'pms',
                ticket_created_at: selectedTicket.created_at
            })
            setResolution(`Successfully closed ticket ${selectedTicket.pmsticket_id}`);
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
                                <th>PMS Ticket ID</th>
                                <th>Created at</th>
                                <th>Tag ID</th>
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
                                            <td onClick={() => HandleView(ticket)}>{ticket.pmsticket_id}</td>
                                            <td onClick={() => HandleView(ticket)}>{new Date(ticket.created_at).toLocaleString()}</td>
                                            <td onClick={() => HandleView(ticket)}>{ticket.tag_id}</td>
                                            <td onClick={() => HandleView(ticket)}>
                                                {(ticket.assigned_to || '').charAt(0).toUpperCase() + (ticket.assigned_to || '').slice(1).toLowerCase()}
                                            </td>
                                            <td
                                                style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                onClick={() => HandleView(ticket)}
                                            >
                                                {ticket.description}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <Form.Select
                                                        value={ticket.pms_status || ''}
                                                        onChange={(e) => handleStatusChange(ticket, e.target.value)}
                                                        style={{ width: 170, borderRadius: 8, fontSize: 13 }}
                                                    >
                                                        {ticket.pms_status === 'open' ? (
                                                            // When status is open, show only Open and Accept options
                                                            <>
                                                                <option hidden value="open">Open</option>
                                                                <option value="assigned">Accept</option>
                                                            </>
                                                        ) : ticket.pms_status === 'closed' ? (
                                                            // When status is closed, show only Close option
                                                            <>
                                                                <option value="closed">Close</option>
                                                            </>
                                                        ) : ticket.pms_status === 'resolved' ? (
                                                            // When status is resolved, show only Accept option
                                                            <>
                                                                <option hidden value="resolved">Resolve</option>
                                                                <option value="assigned">Accept</option>
                                                            </>
                                                        ) : ticket.pms_status === 're-opened' ? (
                                                            // When status is re-opened, show only Accept option
                                                            <>
                                                                <option hidden value="re-opened">Re-Opened</option>
                                                                <option value="assigned">Accept</option>
                                                            </>
                                                        ) : (
                                                            // For all other statuses, show all options
                                                            <>
                                                                <option value="open">Open</option>
                                                                {ticket.pms_status === 'assigned' || ticket.pms_status === 'in-progress' ? (
                                                                    <option value="assigned">Assigned</option>
                                                                ) : (
                                                                    <option value="assigned">Accept</option>
                                                                )}
                                                                <option value="in-progress">In-Progress</option>
                                                                <option value="resolved">Resolved</option>
                                                                <option hidden value="re-opened">Re-Opened</option>
                                                                <option value="closed" hidden>Close</option>
                                                            </>
                                                        )}
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
                                    <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>PMS Ticket ID:{ticket.pmsticket_id}</div>
                                    <div><strong>Tag_id:</strong> {ticket.tag_id}</div>
                                    <div><strong>Created at:</strong> {new Date(ticket.created_at).toLocaleString()}</div>
                                    <div><strong>Status:</strong> {renderStatusBadge(ticket.pms_status)}</div>
                                    <div style={{ marginBottom: 4 }}><strong>Description:</strong> {ticket.description}</div>
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

            {/* Status modal Validation */}
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
