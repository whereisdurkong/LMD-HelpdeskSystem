
import { FaFilePdf, FaFileWord, FaFileImage, FaFileAlt } from 'react-icons/fa';
import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Card, Button, Modal, Alert, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';
import FeatherIcon from 'feather-icons-react';
import Spinner from 'react-bootstrap/Spinner';
import BTN from 'layouts/ReactBits/BTN';

export default function ViewPmsTicket() {
    const [formData, setFormData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [ticketForData, setTicketForData] = useState({});
    const [currentUserData, setCurrentUserData] = useState({});

    const [hdUser, setHDUser] = useState({});
    const [tier, setTier] = useState('')
    const pmsticket_id = new URLSearchParams(window.location.search).get('id');

    const [allnotes, setAllNotes] = useState([]);
    const [notesofhduser, setnoteofhduser] = useState('')

    const [showCloseReasonModal, setShowCloseReasonModal] = useState(false);
    const [close, setClose] = useState(false);
    const [closureReason, setClosureReason] = useState('');

    const [showCloseReviewModal, setShowCloseReviewModal] = useState(false);
    const [userfeedback, setUserFeedback] = useState('');
    const [value, setValue] = useState(3);

    const [error, setError] = useState('');
    const [successful, setSuccessful] = useState('');

    const [collaboratorState, setCollaboratorState] = useState(false);
    const [allHDUser, setAllHDUser] = useState([]);

    const [loading, setLoading] = useState(false);

    const [resolveState, setResolveState] = useState(false)


    const thumbLeft = `${10 + (value - 1) * 20}%`;

    const subCategoryOptions = {
        incident: {
            hardware: [
                "Desktop",
                "Laptop",
                "Monitor",
                "Printer",
                "Scanner",
                "Printer/Scanner Combo",
                "Peripherals (Keyboard, Mouse, Webcam, External Drive)",
                "Docking Station",
                "Projector",
                "Fax Machine",
                "Telephone",
                "Server Hardware",
                "UPS (Uninterruptible Power Supply)",
                "Cabling & Ports",
                "Others",
            ],
            network: [
                "Internet Connectivity",
                "Wi-Fi",
                "LAN (Local Area Network)",
                "WAN (Wide Area Network)",
                "Server Access",
                "Network Printer/Scanner",
                "VPN Connection",
                "Firewall",
                "Router/Switch Configuration",
                "MPLS",
                "ISP",
                "Network Security (Intrusion Detection/Prevention)",
                "Bandwidth Issues",
                "Others",
            ],
            software: [
                "Microsoft Applications (Excel, Word, Outlook, PowerPoint, Teams)",
                "Oracle (PROD/BIPUB)",
                "Email (Setup, Creation, Error, Backup)",
                "System Updates & Patches",
                "Active Directory (User Creation, Login, Password)",
                "Zoom / Video Conferencing Tools",
                "FoxPro (Accounting System)",
                "GEMCOM",
                "SURPAC",
                "FTP (Access Creation, Change Password)",
                "PDF (Conversion, Reduce Size, Editing)",
                "Antivirus / Security Software",
                "Operating System (Windows, macOS, Linux)",
                "Custom In-house Applications",
                "Backup & Restore Tools",
                "Cloud Services (OneDrive, Google Drive, Dropbox)",
                "Others",
            ],
        },
        request: {
            hardware: [
                "New Laptop Request",
                "New Monitor Request",
                "Printer Installation",
                "Additional Peripherals",
                "Hardware Upgrade",
                "Others",
            ],
            network: [
                "New VPN Access",
                "Firewall Rule Request",
                "New Router/Switch Setup",
                "Bandwidth Upgrade",
                "ISP Request",
                "Others",
            ],
            software: [
                "New Software Installation",
                "License Renewal",
                "User Account Creation",
                "Database Access Request",
                "Cloud Storage Request",
                "Others",
            ],
        },
        inquiry: {
            hardware: ["Warranty Inquiry", "Specs Inquiry", "Others"],
            network: ["Network Policy Inquiry", "Coverage Inquiry", "Others"],
            software: ["Software Policy Inquiry", "Version Inquiry", "Others"],
        },
    };

    // useEffect(() => {
    //     if (loading) {
    //         const timer = setTimeout(() => {
    //             window.location.reload()
    //             setLoading(false);
    //         }, 2000);
    //         return () => clearTimeout(timer)
    //     }
    // }, [loading])

    useEffect(() => {
        axios.get(`${config.baseApi}/authentication/get-all-users`)
            .then((res) => {

                const allHD = res.data.filter(hd => hd.emp_tier === 'helpdesk');
                setAllHDUser(allHD);

            })
            .catch((err) => {
                console.error("Error fetching users:", err);
            });


    }, [])

    //Alert timeout effect
    useEffect(() => {
        if (error || successful) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessful('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, successful]);


    // Fetch all notes for the ticket
    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const getTicket = await axios.get(`${config.baseApi}/pmsticket/get-all-notes/${pmsticket_id}`);
                setAllNotes(getTicket.data);

                const usernames = getTicket.data.map(note => note.created_by);

                const response = await axios.get(`${config.baseApi}/authentication/get-all-notes-usernames`, {
                    params: { user_name: JSON.stringify(usernames) }
                });

                const userMap = {}
                response.data.forEach(user => {
                    userMap[user.user_name] = `${user.emp_FirstName} ` + ' ' + `${user.emp_LastName}`;
                });
                setnoteofhduser(userMap)

            } catch (err) {
                console.log('Unable to fetch data: ', err)
            }
        }
        fetchNotes();
    }, [])

    // Fetch ticket data by ID
    useEffect(() => {
        const fetchData = async () => {
            try {

                const fetchticket = await axios.get(`${config.baseApi}/pmsticket/pmsticket-by-id`, {
                    params: { id: pmsticket_id }
                });
                const ticket = Array.isArray(fetchticket.data) ? fetchticket.data[0] : fetchticket.data;
                setFormData(ticket);

                setOriginalData(ticket);

            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, [pmsticket_id]);


    // // Check if ticket status is closed
    useEffect(() => {
        if (formData.pms_status === 'closed') {
            setClose(false)
        }
        else if (formData.pms_status === 'resolved') {
            setResolveState(true)
            setClose(true)
        }
        else {
            setClose(true)
        }

        if (formData.is_reviewed === true && formData.pms_status === 'closed') {
            setShowCloseReviewModal(false)
            setClose(false)
        }


        if (hasChanges === false && formData.pms_status === 'closed' && (formData.is_reviewed === false || formData.is_reviewed === null)) {
            setShowCloseReviewModal(true)
            setClose(false)
        } else {
            setShowCloseReviewModal(false)
        }


    }, [formData.pms_status])


    // // Fetch current user data from local storage
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        setCurrentUserData(empInfo);
    }, []);

    // // Fetch created by user data
    useEffect(() => {
        if (formData.pmsticket_for) {
            const fetchCreatedby = async () => {
                try {
                    const response = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                        params: { user_name: formData.pmsticket_for }
                    });
                    setTicketForData(response.data);
                } catch (err) {
                    console.log(err);
                }
            };
            fetchCreatedby();
        }

        if (formData.assigned_to) {
            const fetchHDUser = async () => {
                try {
                    const response = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                        params: { user_name: formData.assigned_to }
                    });
                    setHDUser(response.data);
                } catch (err) {
                    console.log(err);
                }
            };
            fetchHDUser();
        }
    }, [formData.pmsticket_for]);


    //Lock Function
    useEffect(() => {
        const interval = setInterval(() => {

            const getUpdated = async () => {
                try {
                    const response = await axios.get(`${config.baseApi}/pmsticket/pmsticket-by-id`, {
                        params: { id: pmsticket_id }
                    });
                    const ticketdata = response.data.data || response.data;

                    if (ticketdata.is_locked === '1') {
                        setLoading(false)
                        setError(`${ticketdata.locked_by} is currently working on this ticket`)
                        setClose(false)
                        setShowCloseReasonModal(false)
                        setShowCloseReviewModal(false)
                    }
                    else if ((ticketdata.is_locked === '0' || ticketdata.is_locked === null) && ticketdata.is_reviewed === true) {
                        setClose(false)
                    }
                    else if (ticketdata.is_locked === '0' || ticketdata.is_locked === null) {
                        setClose(true)
                    } else {
                        console.log("is_locked is missing or not boolean:", ticketdata.is_locked);
                    }

                } catch (err) {
                    console.error("Error fetching ticket:", err);
                }
            };

            getUpdated();
        }, 5000);

        return () => clearInterval(interval);
    }, [pmsticket_id, currentUserData]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updatedForm = { ...prev, [name]: value };
            const fieldsToCheck = ['tag_id', 'pms_status', 'description',];
            const changed = fieldsToCheck.some(field => updatedForm[field] !== originalData[field]);
            setHasChanges(changed);
            return updatedForm;
        });
    };

    const Test = async (e) => {
        const response = await axios.get(`${config.baseApi}/pmsticket/pmsticket-by-id`, {
            params: { id: pmsticket_id }
        });
        const ticketdata = response.data.data || response.data;


        if (formData.pms_status === 'closed' && ticketdata.is_locked === '1') {
            setShowCloseReasonModal(false);
        } else if (formData.pms_status === 'closed') {
            setShowCloseReasonModal(true);
        }
        else {
            await handleSave();
        }
    }


    const HandleCheckerFields = async () => {

        const response = await axios.get(`${config.baseApi}/pmsticket/pmsticket-by-id`, {
            params: { id: pmsticket_id }
        });
        const ticketdata = response.data.data || response.data;


        if (formData.pms_status === 'closed' && ticketdata.is_locked === '1') {
            setShowCloseReasonModal(false);
        } else if (formData.pms_status === 'closed') {
            setShowCloseReasonModal(true);
        }
        else {
            await handleSave();
        }
    }



    //Reson why Close tikcet function
    const handleConfirmClosure = async (e) => {
        e.preventDefault();
        const empInfo = JSON.parse(localStorage.getItem('user'));
        if (!closureReason.trim()) return;
        try {
            //place a note
            setLoading(true)
            await axios.post(`${config.baseApi}/pmsticket/note-post`, {
                notes: 'User Confirmation: ' + closureReason,
                current_user: empInfo.user_name,
                pmsticket_id: pmsticket_id
            });

            //Send app notifcation 
            await axios.post(`${config.baseApi}/pmsticket/notified-true`, {
                pmsticket_id: pmsticket_id,
                user_id: empInfo.user_id
            })

            setShowCloseReasonModal(false);
            setClosureReason('');
            setClose(false);

            await handleSave();

            setLoading(false);
            setSuccessful('Ticket closed successfully.');
            // setShowCloseReviewModal(true);

        } catch (err) {
            console.log(err);
            setLoading(false)
            setError('Failed to close ticket. Please try again.');
            setShowCloseReasonModal(false);
            setClosureReason('');

        }
    }

    const handleReview = async (value, userfeedback) => {

        const empInfo = JSON.parse(localStorage.getItem("user"));
        console.log("was triggered. ", `Review ${userfeedback} HelpDesk: ${hdUser.user_id} Reviewed by: ${empInfo.user_name}`);

        // validate input first
        if (!userfeedback) {
            setError("Feedback must not be empty!");
            return;
        }

        try {
            setLoading(true);
            // get all feedback first
            const res = await axios.get(`${config.baseApi}/pmsticket/get-all-feedback`);
            const feedData = res.data || [];
            const feedTicket = feedData.filter((f) => String(f.pmsticket_id) === String(pmsticket_id));
            if (feedTicket.length > 0) {
                // delete first, then insert inside .then
                await axios
                    .post(`${config.baseApi}/pmsticket/feedback-delete-by-id`, {
                        pmsticket_id: pmsticket_id,
                        review: userfeedback,
                        user_id: hdUser.user_id,
                        created_by: empInfo.user_name,
                        score: value,
                    })
                setShowCloseReviewModal(false);
                setUserFeedback("");

                window.location.reload()

            } else {
                // if no feedback existed, insert directly
                await axios.post(`${config.baseApi}/pmsticket/feedback`, {
                    review: userfeedback,
                    user_id: hdUser.user_id,
                    created_by: empInfo.user_name,
                    pmsticket_id: formData.pmsticket_id,
                    score: value,
                });

                setShowCloseReviewModal(false);
                setUserFeedback("");

                window.location.reload()
            }

        } catch (err) {
            console.log("Error while submitting review: ", err);
        }
    };


    // //Save updated fields
    const handleSave = async () => {
        try {
            const empInfo = JSON.parse(localStorage.getItem('user'));
            const fetchticket = await axios.get(`${config.baseApi}/pmsticket/pmsticket-by-id`, {
                params: { id: pmsticket_id }
            });
            const ticket = Array.isArray(fetchticket.data) ? fetchticket.data[0] : fetchticket.data;

            //Check if someone is working on this ticket
            if (ticket.is_locked === '0' || ticket.locked_by === empInfo.user_name || ticket.locked_by === null) {


                //check any changes to save logs
                const changedFields = [];
                const fieldsToCheck = ['tag_id', 'pms_status', 'description'];
                fieldsToCheck.forEach(field => {
                    const original = originalData[field];
                    const current = formData[field];
                    if ((original ?? '') !== (current ?? '')) {
                        changedFields.push(` ${currentUserData.user_name} Changed '${field}' from '${original}' to '${current}'`)
                    }
                });
                const changesMade = changedFields.length > 0 ? changedFields.join('; ') : '';


                //save note if user re-opened the ticket
                if (formData.pms_status === 're-opened') {
                    await axios.post(`${config.baseApi}/pmsticket/note-post`, {
                        notes: `${currentUserData.user_name} re opened the ticket.`,
                        current_user: currentUserData.user_name,
                        pmsticket_id: pmsticket_id
                    });
                }

                // Send notification to HD
                setLoading(true)
                await axios.post(`${config.baseApi}/pmsticket/notified-true`, {
                    pmsticket_id: pmsticket_id,
                    user_id: currentUserData.user_id
                })


                setLoading(true)
                await axios.post(`${config.baseApi}/pmsticket/update-pmsticket`, {
                    pmsticket_id: formData.pmsticket_id,
                    tag_id: formData.tag_id,
                    pms_status: formData.pms_status,

                    description: formData.description,
                    updated_by: currentUserData.user_id,
                    changes_made: changesMade,
                    assigned_to_UserId: hdUser.user_id,
                    assigned_to: formData.assigned_to,

                });

                if (formData.pms_status === 'closed') {
                    setLoading(false)
                    setSuccessful('Ticket updated successfully.');
                    setOriginalData(formData);
                    setHasChanges(false);
                } else {
                    setLoading(false)
                    setSuccessful('Ticket updated successfully.');
                    setOriginalData(formData);
                    setHasChanges(false);
                }
            } else if (ticket.is_locked === '1' || ticket.locked_by !== empInfo.user_name) {
                setLoading(false)
                setError(`${ticket.updating_by} is currently working on this ticket`);
                return;
            }
            window.location.reload();

        } catch (err) {
            console.error("Error updating ticket:", err);
            setLoading(false)
            setError('Failed to update ticket.');
        }
    };

    return (
        <Container fluid className="pt-100 pb-4" style={{ background: 'linear-gradient(to bottom, #ffe798, #b8860b)', minHeight: '100vh', paddingTop: '100px' }}>
            {/* ALERT BAR */}
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
            <Container className="bg-white p-4 rounded-3 shadow-sm">
                <Row>
                    <Col lg={8}>
                        {/* Buttons */}
                        <Row className="mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <h3 className="fw-bold text-dark mb-0">PMS Ticket Details</h3>
                                <div className="d-flex gap-2">
                                    {hasChanges && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            style={{ width: '200px', minHeight: '40px' }}

                                            onClick={HandleCheckerFields}
                                        >
                                            Save Changes
                                        </Button>
                                        // <BTN size="sm" label={'Save Changes'}>

                                        // </BTN>
                                    )}

                                </div>
                            </div>
                        </Row>

                        <h6 className="text-muted fw-semibold mb-2">Dates</h6>
                        <Row>
                            {['created_at', 'resolved_at'].map((field, index) => (
                                <Form.Group as={Col} md={6} className="mb-2" key={index}>
                                    <Form.Label>{field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Form.Label>
                                    <Form.Control name={field} value={formData[field] ? new Date(formData[field]).toLocaleString() : '-'} disabled />
                                </Form.Group>
                            ))}
                        </Row>
                        {/* DETAILS */}
                        <h6 className="text-muted fw-semibold mt-4 mb-2">Details</h6>
                        <Row>
                            <Col md={6} className="mb-2">
                                <Form.Label>Assigned To</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>
                                        <FeatherIcon icon="user" />
                                    </InputGroup.Text>
                                    <Form.Control
                                        name="assigned_to"
                                        value={
                                            hdUser?.emp_FirstName && hdUser?.emp_LastName
                                                ? `${hdUser.emp_FirstName} ${hdUser.emp_LastName}`
                                                : '-'
                                        }
                                        disabled
                                    />
                                </InputGroup>
                            </Col>
                        </Row>


                        <h6 className="text-muted fw-semibold mt-4 mb-2">Request Info</h6>
                        <Row>
                            <Form.Group as={Col} md={6} className="mb-2">
                                <Form.Label>Ticket ID</Form.Label>
                                <Form.Control name="pmsticket_id" value={formData.pmsticket_id ?? ''} disabled />
                            </Form.Group>

                            <Form.Group as={Col} md={6} className="mb-2">
                                <Form.Label>Status</Form.Label>
                                <Form.Select name="pms_status" value={formData.pms_status ?? ''} onChange={handleChange} disabled={!close} required>
                                    <option value="open" hidden>Open</option>
                                    <option value="closed">Close</option>
                                    <option value="re-opened">Re open</option>

                                    <option value="assigned" hidden>Assigned</option>
                                    <option value="in-progress" hidden>In Progress</option>
                                    {/* <option value="escalate" hidden>Escalated</option> */}
                                    <option value="resolved" hidden>Resolve</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group as={Col} md={6} className="mb-3">
                                <Form.Label>Tag ID</Form.Label>
                                <Form.Control name="tag_id" value={formData.tag_id ?? ''} onChange={handleChange} disabled={!close} />
                            </Form.Group>

                        </Row>

                        <h6 className="text-muted fw-semibold mt-4 mb-2">Description</h6>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={7}
                                name="description"
                                value={formData.description ?? 'No Description Provided'}
                                onChange={handleChange}
                                disabled={!close}
                            />
                        </Form.Group>
                    </Col>

                    <Col lg={4}>
                        <h6 className="text-muted fw-semibold mb-2">Helpdesk Notes</h6>
                        <Card className="shadow-sm border-0">
                            <Card.Body>
                                <Form.Group>
                                    <div
                                        style={{
                                            maxHeight: '600px',
                                            overflowY: 'auto',
                                            paddingRight: '5px',
                                        }}
                                    >
                                        {allnotes && allnotes.length > 0 ? (
                                            [...allnotes]
                                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                                .map((note, index) => (
                                                    <div
                                                        key={index}
                                                        className="mb-3 p-3 rounded-3 shadow-sm bg-body-tertiary border border-light-subtle"
                                                    >
                                                        <div
                                                            className="text-dark"
                                                            style={{
                                                                fontSize: '0.95rem',
                                                                whiteSpace: 'pre-wrap',
                                                            }}
                                                        >
                                                            {note.note}
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                                            <small className="text-muted fst-italic">
                                                                {notesofhduser[note.created_by] || note.created_by || 'Unknown'}
                                                            </small>
                                                            <small className="text-muted">
                                                                {note.created_at
                                                                    ? new Date(
                                                                        note.created_at
                                                                    ).toLocaleString()
                                                                    : ''}
                                                            </small>
                                                        </div>
                                                    </div>
                                                ))
                                        ) : (
                                            <div className="text-muted fst-italic">
                                                No notes available.
                                            </div>
                                        )}
                                    </div>

                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                {/* CLOSE TICKET */}
                <Modal show={showCloseReasonModal} onHide={() => setShowCloseReasonModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Reason for Closing Ticket</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group controlId="closureReason">
                            <Form.Label>Please provide a reason:</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={closureReason}
                                onChange={(e) => setClosureReason(e.target.value)}
                                placeholder="Enter reason for closing the ticket"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCloseReasonModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmClosure}
                            disabled={closureReason.trim() === ''}
                        >
                            Confirm
                        </Button>
                    </Modal.Footer>
                </Modal>


                <Modal show={resolveState} onHide={() => setResolveState(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Ticket was marked Resolve</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group controlId="closureReason">

                            <div style={{ marginBottom: '5px', color: '#6c757d', fontSize: '0.9rem' }}>
                                You may now change the status to <b>Close</b> since the ticket has been resolved.
                                However, if the issue still persists, you may change the status to <b>Re-open</b> for further action.</div>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setResolveState(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => setResolveState(false)}

                        >
                            Ok
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Review Ticket */}
                {/* Review Ticket with Scale + Feedback */}
                <Modal show={showCloseReviewModal} onHide={() => setShowCloseReviewModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Leave a Feedback (Required)</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {/* Feedback Textarea */}
                        <Form.Group controlId="userfeedback" className="mb-3">
                            <Form.Label>How was our service?</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={userfeedback}
                                onChange={(e) => setUserFeedback(e.target.value)}
                                placeholder="Your feedback will help us improve our service"
                            />
                        </Form.Group>

                        {/* SCALE SLIDER */}
                        <Container fluid className="text-center mt-3">
                            <h5>SCALE</h5>
                            <Row className="justify-content-center">
                                <Col xs={12} sm={10} md={8}>
                                    <div style={{ position: "relative", width: "100%" }}>
                                        {/* colored bar */}
                                        <div
                                            style={{
                                                height: 12,
                                                borderRadius: 6,
                                                display: "flex",
                                                overflow: "hidden",
                                                width: "100%",
                                            }}
                                        >
                                            <div style={{ flex: 1, background: "#e74c3c" }} />
                                            <div style={{ flex: 1, background: "#e67e22" }} />
                                            <div style={{ flex: 1, background: "#f1c40f" }} />
                                            <div style={{ flex: 1, background: "#2ecc71" }} />
                                            <div style={{ flex: 1, background: "#27ae60" }} />
                                        </div>

                                        {/* custom thumb */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "50%",
                                                left: thumbLeft,
                                                transform: "translate(-50%, -50%)",
                                                width: 18,
                                                height: 18,
                                                borderRadius: "50%",
                                                background: "#333",
                                                boxShadow: "0 0 0 3px rgba(0,0,0,0.08)",
                                                zIndex: 2,
                                                pointerEvents: "none",
                                            }}
                                        />

                                        {/* invisible range */}
                                        <Form.Range
                                            min={1}
                                            max={5}
                                            step={1}
                                            value={value}
                                            onChange={(e) => setValue(Number(e.target.value))}
                                            style={{
                                                position: "absolute",
                                                top: -12,
                                                left: 0,
                                                right: 0,
                                                width: "100%",
                                                height: 36,
                                                opacity: 0,
                                                cursor: "pointer",
                                                zIndex: 3,
                                            }}
                                        />
                                    </div>

                                    {/* Numbers aligned */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(5, 1fr)",
                                            marginTop: 8,
                                            fontSize: "clamp(0.8rem, 2vw, 1rem)",
                                        }}
                                    >
                                        {["1", "2", "3", "4", "5"].map((n) => (
                                            <div key={n} style={{ textAlign: "center" }}>
                                                {n}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Labels aligned */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(5, 1fr)",
                                            marginTop: 4,
                                            fontSize: "clamp(0.55rem, 1.2vw, 0.75rem)", // smaller min size for phones

                                            wordBreak: "break-word", // break words if needed on very small screens
                                        }}
                                    >
                                        <div style={{ textAlign: "center", color: "#e74c3c" }}>Very Dissatisfied</div>
                                        <div style={{ textAlign: "center", color: "#e67e22" }}>Dissatisfied</div>
                                        <div style={{ textAlign: "center", color: "#f1c40f" }}>Neutral</div>
                                        <div style={{ textAlign: "center", color: "#2ecc71" }}>Satisfied</div>
                                        <div style={{ textAlign: "center", color: "#27ae60" }}>Very Satisfied</div>
                                    </div>
                                </Col>
                            </Row>
                        </Container>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCloseReviewModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => handleReview(value, userfeedback)}
                            disabled={userfeedback.trim() === ""}
                        >
                            Confirm
                        </Button>
                    </Modal.Footer>
                </Modal>


            </Container>
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
    );
}
