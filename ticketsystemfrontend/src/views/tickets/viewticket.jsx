import { FaFilePdf, FaFileWord, FaFileImage, FaFileAlt } from 'react-icons/fa';
import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Card, Button, Modal, Alert, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';
import FeatherIcon from 'feather-icons-react';
import Spinner from 'react-bootstrap/Spinner';
import BTN from 'layouts/ReactBits/BTN';
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';

export default function ViewTicket() {
    const [formData, setFormData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [ticketForData, setTicketForData] = useState({});
    const [currentUserData, setCurrentUserData] = useState({});

    const [attachmentState, setAttachmentState] = useState(false)
    const [attachmentButtonState, setAttachmentButtonState] = useState(false)

    const [hdUser, setHDUser] = useState({});
    const [tier, setTier] = useState('')
    const ticket_id = new URLSearchParams(window.location.search).get('id');

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


    const labels = {
        1: "Very Dissatisfied",
        2: "Dissatisfied",
        3: "Neutral",
        4: "Satisfied",
        5: "Very Satisfied",
    };

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

    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                window.location.reload()
                setLoading(false);
            }, 2000);
            return () => clearTimeout(timer)
        }
    }, [loading])

    useEffect(() => {
        axios.get(`${config.baseApi}/authentication/get-all-users`)
            .then((res) => {

                const allHD = res.data.filter(hd => hd.emp_tier === 'helpdesk');
                setAllHDUser(allHD);
                console.log('ALL HD USERS:', allHD)
            })
            .catch((err) => {
                console.error("Error fetching users:", err);
            });

        console.log(ticket_id)
    }, [])

    useEffect(() => {
        if (formData.assigned_collaborators) {
            setCollaboratorState(true);
        } else if (formData.assigned_collaborators === null) {
            setCollaboratorState(false)
        }
        else {
            setCollaboratorState(false)

        }
    }, [formData.assigned_collaborators])

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
                const getTicket = await axios.get(`${config.baseApi}/ticket/get-all-notes/${ticket_id}`);
                setAllNotes(getTicket.data);

                const usernames = getTicket.data.map(note => note.created_by);

                const response = await axios.get(`${config.baseApi}/authentication/get-all-notes-usernames`, {
                    params: { user_name: JSON.stringify(usernames) }
                });

                console.log('HD notes userdata: ', response.data);
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
                const fetchticket = await axios.get(`${config.baseApi}/ticket/ticket-by-id`, {
                    params: { id: ticket_id }
                });
                const ticket = Array.isArray(fetchticket.data) ? fetchticket.data[0] : fetchticket.data;
                setFormData(ticket);
                setOriginalData(ticket);

            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, [ticket_id]);


    // Check if ticket status is closed
    useEffect(() => {
        if (formData.ticket_status === 'closed') {
            setClose(false)
        } else if (formData.ticket_status === 'resolved') {
            setResolveState(true)

            setClose(false)
        }
        else {
            setClose(true)
        }
        if (formData.is_reviewed === true && formData.ticket_status === 'closed') {
            setShowCloseReviewModal(false)
            setClose(false)
        }

        if (hasChanges === false && formData.ticket_status === 'closed' && (formData.is_reviewed === false || formData.is_reviewed === null)) {
            setShowCloseReviewModal(true)
        } else {
            setShowCloseReviewModal(false)
        }


    }, [formData.ticket_status])


    // Fetch current user data from local storage
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem('user'));
        setCurrentUserData(empInfo);
    }, []);

    // Fetch created by user data
    useEffect(() => {
        if (formData.ticket_for) {
            const fetchCreatedby = async () => {
                try {
                    const response = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                        params: { user_name: formData.ticket_for }
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
    }, [formData.ticket_for]);

    useEffect(() => {
        if (formData.Attachments && formData.Attachments !== '') {
            setAttachmentState(true);
        } else {
            setAttachmentState(true);
        }

        if (attachmentButtonState === true) {
            setAttachmentState(false)
        }

    }, [formData, attachmentState, attachmentButtonState]);

    //Lock Function
    useEffect(() => {
        const interval = setInterval(() => {
            const getUpdated = async () => {
                try {
                    const response = await axios.get(`${config.baseApi}/ticket/ticket-by-id`, {
                        params: { id: ticket_id }
                    });
                    const ticketdata = response.data.data || response.data;

                    if (ticketdata.is_locked === '1') {
                        setLoading(false)
                        setError(`${ticketdata.updating_by} is currently working on this ticket`)
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
        }, 1000);

        return () => clearInterval(interval);
    }, [ticket_id, currentUserData]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updatedForm = { ...prev, [name]: value };
            const fieldsToCheck = ['ticket_subject', 'tag_id', 'ticket_status', 'ticket_urgencyLevel', 'ticket_category', 'ticket_SubCategory', 'Description', 'Attachments'];
            const changed = fieldsToCheck.some(field => updatedForm[field] !== originalData[field]);
            setHasChanges(changed);
            return updatedForm;
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const filePaths = files.map(file => `uploads/${file.name}`);
            const updatedForm = {
                ...formData,
                Attachments: filePaths.join(','),
                attachmentFiles: files
            };
            setFormData(updatedForm);

            const fieldsToCheck = ['ticket_subject', 'tag_id', 'ticket_status', 'ticket_urgencyLevel', 'ticket_category', 'ticket_SubCategory', 'Description', 'Attachments'];
            const changed = fieldsToCheck.some(field => updatedForm[field] !== originalData[field]);
            setHasChanges(changed);
        }
    };

    const HandleCheckerFields = async (e) => {
        const response = await axios.get(`${config.baseApi}/ticket/ticket-by-id`, {
            params: { id: ticket_id }
        });
        const ticketdata = response.data.data || response.data;


        if (formData.ticket_status === 'closed' && ticketdata.is_locked === '1') {
            setShowCloseReasonModal(false);
        } else if (formData.ticket_status === 'closed') {
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
            await axios.post(`${config.baseApi}/ticket/note-post`, {
                notes: closureReason,
                current_user: empInfo.user_name,
                ticket_id: ticket_id
            });

            //Send app notifcation 
            await axios.post(`${config.baseApi}/ticket/notified-true`, {
                ticket_id: ticket_id,
                user_id: empInfo.user_id
            })

            setShowCloseReasonModal(false);
            setClosureReason('');
            setClose(false);

            await handleSave();
            setShowCloseReviewModal(true);
            setSuccessful('Ticket closed successfully.');
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
            const res = await axios.get(`${config.baseApi}/ticket/get-all-feedback`);
            const feedData = res.data || [];
            const feedTicket = feedData.filter((f) => String(f.ticket_id) === String(ticket_id));

            if (feedTicket.length > 0) {
                // delete first, then insert inside .then
                await axios
                    .post(`${config.baseApi}/ticket/feedback-delete-by-id`, {
                        ticket_id: ticket_id,
                        review: userfeedback,
                        user_id: hdUser.user_id,
                        created_by: empInfo.user_name,
                        ticket_id: formData.ticket_id,
                        score: value,
                    })

            } else {
                // if no feedback existed, insert directly
                await axios.post(`${config.baseApi}/ticket/feedback`, {
                    review: userfeedback,
                    user_id: hdUser.user_id,
                    created_by: empInfo.user_name,
                    ticket_id: formData.ticket_id,
                    score: value,
                });
                console.log("Feedback submitted (no old feedback) ✅");
            }


            setShowCloseReviewModal(false);
            setUserFeedback("");
            setLoading(true)
        } catch (err) {
            console.log("Error while submitting review: ", err);
        } finally {
            setLoading(false);
        }
    };





    //Save updated fields
    const handleSave = async () => {
        try {
            const empInfo = JSON.parse(localStorage.getItem('user'));
            const fetchticket = await axios.get(`${config.baseApi}/ticket/ticket-by-id`, {
                params: { id: ticket_id }
            });
            const ticket = Array.isArray(fetchticket.data) ? fetchticket.data[0] : fetchticket.data;

            //Check if someone is working on this ticket
            if (ticket.is_locked === false || ticket.updating_by === empInfo.user_name || ticket.updating_by === null) {




                //check any changes to save logs
                const changedFields = [];
                const fieldsToCheck = ['ticket_subject', 'tag_id', 'ticket_status', 'ticket_urgencyLevel', 'ticket_category', 'ticket_SubCategory', 'Description', 'Attachments'];
                fieldsToCheck.forEach(field => {
                    const original = originalData[field];
                    const current = formData[field];
                    if ((original ?? '') !== (current ?? '')) {
                        changedFields.push(` ${currentUserData.user_name} Changed '${field}' from '${original}' to '${current}'`)
                    }
                });
                console.log('Changed Fields:', changedFields);
                const changesMade = changedFields.length > 0 ? changedFields.join('; ') : '';

                console.log('CHANGES MADE:', changesMade)


                const dataToSend = new FormData();
                dataToSend.append('ticket_id', formData.ticket_id);
                dataToSend.append('ticket_subject', formData.ticket_subject);
                // dataToSend.append('ticket_type', formData.ticket_type);
                dataToSend.append('ticket_status', formData.ticket_status);
                dataToSend.append('ticket_category', formData.ticket_category);
                dataToSend.append('ticket_SubCategory', formData.ticket_SubCategory);
                dataToSend.append('ticket_urgencyLevel', formData.ticket_urgencyLevel);
                dataToSend.append('Description', formData.Description);
                dataToSend.append('changes_made', changesMade);
                dataToSend.append('updated_by', currentUserData.user_id);

                dataToSend.append('CloseReason', closureReason);
                dataToSend.append('tag_id', formData.tag_id);
                dataToSend.append('assigned_to_UserId', hdUser.user_id);// ISSUE WHEN SAVING AN OPEN TICKET AND NO HD USE WAS ASSIGNED  
                console.log('HS USER ID:', hdUser.user_id)
                console.log('UPDATED USER ID:', currentUserData.user_id)

                if (formData.attachmentFiles && formData.attachmentFiles.length > 0) {
                    formData.attachmentFiles.forEach(file => {
                        dataToSend.append('attachments', file);
                    });
                } else {
                    dataToSend.append('Attachments', formData.Attachments || '');
                }
                console.log(dataToSend)
                //save note if user re-opened the ticket
                if (formData.ticket_status === 're-opened') {
                    await axios.post(`${config.baseApi}/ticket/note-post`, {
                        notes: `${currentUserData.user_name} re opened the ticket.`,
                        current_user: currentUserData.user_name,
                        ticket_id: ticket_id
                    });

                }

                // Send notification to HD
                setLoading(true)
                await axios.post(`${config.baseApi}/ticket/notified-true`, {
                    ticket_id: ticket_id,
                    user_id: currentUserData.user_id
                })

                await axios.post(`${config.baseApi}/ticket/update-ticket`, dataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (formData.ticket_status === 'closed') {
                    setSuccessful('Ticket updated successfully.');
                    setOriginalData(formData);
                    setHasChanges(false);
                } else {
                    setSuccessful('Ticket updated successfully.');
                    setOriginalData(formData);
                    setHasChanges(false);
                }
            } else if (ticket.is_locked === true || ticket.updating_by !== empInfo.user_name) {
                setLoading(false)
                setError(`${ticket.updating_by} is currently working on this ticket`);
                return;
            }


        } catch (err) {
            console.error("Error updating ticket:", err);
            setLoading(false)
            setError('Failed to update ticket.');
        }
    };








    //Display the files uploaded
    const renderAttachment = () => {
        if (!formData.Attachments) return <div className="text-muted fst-italic">No attachments</div>;

        const filePaths = formData.Attachments.split(',');

        const getFileIcon = (filename) => {
            const ext = filename.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <FaFileImage size={28} className="text-primary" />;
            if (['pdf'].includes(ext)) return <FaFilePdf size={28} className="text-danger" />;
            if (['doc', 'docx'].includes(ext)) return <FaFileWord size={28} className="text-info" />;
            return <FaFileAlt size={28} className="text-secondary" />;
        };

        return (
            <div className="d-flex flex-column">
                {filePaths.map((filePath, idx) => {
                    const fileName = filePath.split('\\').pop().split('/').pop();
                    const shortName = fileName.length > 25 ? fileName.slice(0, 25) + '...' : fileName;
                    const fileUrl = `${config.baseApi}/${filePath.replace(/\\/g, '/')}`;

                    return (

                        <Card key={idx} className="shadow-sm border-0 mb-1" style={{ backgroundColor: '#fdedd3ff' }}>
                            <Card.Body className="d-flex align-items-center justify-content-between p-2">
                                <div className="d-flex align-items-center">
                                    <div className="me-3">{getFileIcon(fileName)}</div>
                                    <div className="text-truncate" style={{ maxWidth: '250px' }}>{shortName}</div>
                                </div>
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline-primary" size="sm">View</Button>
                                </a>
                            </Card.Body>
                        </Card>

                    );
                })

                }
            </div>
        );
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
                <Container className="bg-white p-4 rounded-3 shadow-sm">
                    <Row>
                        <Col lg={8}>
                            {/* Buttons */}
                            <Row className="mb-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h3 className="fw-bold text-dark mb-0">Ticket Details</h3>
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
                                <Col md={6} className="mb-2" hidden>
                                    <Form.Label>Created By</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FeatherIcon icon="user" />
                                        </InputGroup.Text>
                                        <Form.Control name="created_by" value={formData.created_by ?? '-'} disabled />
                                    </InputGroup>
                                </Col>
                                <Col md={6} className="mb-2" hidden>
                                    <Form.Label>Employee</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FeatherIcon icon="user" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            value={`${ticketForData?.emp_FirstName ?? '-'} ${ticketForData?.emp_LastName ?? '-'}`} disabled />
                                    </InputGroup>
                                </Col>
                                <Col md={6} className="mb-2" hidden>
                                    <Form.Label>Department</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FeatherIcon icon="briefcase" />
                                        </InputGroup.Text>
                                        <Form.Control value={ticketForData.emp_department ?? ''} disabled />
                                    </InputGroup>
                                </Col>
                                <Col md={6} className="mb-2" hidden>
                                    <Form.Label>Position</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FeatherIcon icon="activity" />
                                        </InputGroup.Text>
                                        <Form.Control value={ticketForData.emp_position ?? ''} disabled />
                                    </InputGroup>
                                </Col>
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
                            {/* XXX */}


                            {collaboratorState && (
                                <Col md={6} className="mb-2">
                                    <Form.Label
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>Collaborators</span>
                                    </Form.Label>

                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FeatherIcon icon="users" />
                                        </InputGroup.Text>

                                        {(() => {
                                            // Normalize assigned_collaborators into an array
                                            const collaboratorsArray = Array.isArray(formData.assigned_collaborators)
                                                ? formData.assigned_collaborators
                                                : typeof formData.assigned_collaborators === "string" &&
                                                    formData.assigned_collaborators.trim() !== ""
                                                    ? formData.assigned_collaborators.split(",")
                                                    : [];

                                            // Convert usernames to full names
                                            const collaborators = collaboratorsArray.map((user_name) => {
                                                const user = allHDUser.find(
                                                    (u) => u.user_name === user_name.trim()
                                                );
                                                return user ? `${user.emp_FirstName} ${user.emp_LastName}` : user_name;
                                            });

                                            if (collaborators.length > 1) {
                                                // Show dropdown if more than 1 collaborator
                                                return (
                                                    <Form.Select defaultValue="">
                                                        <option value="" disabled>
                                                            {collaborators[0]} and {collaborators.length - 1} more
                                                        </option>
                                                        {collaborators.map((c, idx) => (
                                                            <option key={idx} value={c} disabled>
                                                                {c}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                );

                                            } else {
                                                // Show single name or NONE if empty
                                                return (
                                                    <Form.Control
                                                        value={collaborators[0] || "NONE"}
                                                        disabled
                                                    />
                                                );
                                            }
                                        })()}
                                    </InputGroup>
                                </Col>
                            )}

                            <h6 className="text-muted fw-semibold mt-4 mb-2">Request Info</h6>
                            <Row>
                                <Form.Group as={Col} md={6} className="mb-2">
                                    <Form.Label>Ticket ID</Form.Label>
                                    <Form.Control name="ticket_id" value={formData.ticket_id ?? ''} disabled />
                                </Form.Group>
                                <Form.Group as={Col} md={6} className="mb-2">
                                    <Form.Label>Problem/Issue</Form.Label>
                                    <Form.Control name="ticket_subject" value={formData.ticket_subject ?? ''} onChange={handleChange} disabled={!close} />
                                </Form.Group>
                                <Form.Group as={Col} md={6} className="mb-2" hidden>
                                    <Form.Label>Ticket Type</Form.Label>
                                    <Form.Select name="ticket_type" value={formData.ticket_type ?? ''} onChange={handleChange} required disabled={!close}>
                                        <option value="incident">Incident</option>
                                        <option value="request">Request</option>
                                        <option value="inquiry">Inquiry</option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group as={Col} md={6} className="mb-2">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select name="ticket_status" value={formData.ticket_status ?? ''} onChange={handleChange} disabled={!close} required>
                                        <option value="open" hidden>Open</option>
                                        <option value="closed">Close</option>
                                        <option value="re-opened">Re open</option>

                                        <option value="assigned" hidden>Assigned</option>
                                        <option value="in-progress" hidden>In Progress</option>
                                        {/* <option value="escalate" hidden>Escalated</option> */}
                                        <option value="resolved" hidden>Resolve</option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group as={Col} md={6} className="mb-2">
                                    <Form.Label>Urgency</Form.Label>
                                    <Form.Select name="ticket_urgencyLevel" value={formData.ticket_urgencyLevel ?? ''} onChange={handleChange} required disabled>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group as={Col} md={6} className="mb-2" hidden>
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select
                                        name="ticket_category"
                                        value={formData.ticket_category ?? ''}
                                        onChange={handleChange}
                                        required
                                        disabled={!close}
                                    >
                                        <option value="hardware">Hardware</option>
                                        <option value="network">Network</option>
                                        <option value="software">Software</option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group as={Col} md={6} className="mb-2" hidden>
                                    <Form.Label>Sub Category</Form.Label>
                                    <Form.Select
                                        name="ticket_SubCategory"
                                        value={formData.ticket_SubCategory ?? ''}
                                        onChange={handleChange}
                                        disabled={!close}
                                        required
                                    >
                                        <option value="">Select</option>
                                        {subCategoryOptions[formData.ticket_type]?.[formData.ticket_category]?.map(
                                            (subcat, idx) => (
                                                <option key={idx} value={subcat}>
                                                    {subcat}
                                                </option>
                                            )
                                        )}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group as={Col} md={6} className="mb-3">
                                    <Form.Label>Tag ID</Form.Label>
                                    <Form.Control name="tag_id" value={formData.tag_id ?? ''} onChange={handleChange} disabled={!close} />
                                </Form.Group>

                                <Form.Group as={Col} md={12} className="mb-2">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: 'pointer' }}>
                                        <Form.Label>Attachments</Form.Label>
                                        {attachmentState && (
                                            <Form.Text onClick={() => setAttachmentButtonState(true)} style={{ color: '#DEA22B' }}>+ Add document</Form.Text>
                                        )}
                                    </div>
                                    {attachmentState && (renderAttachment())}
                                    {attachmentButtonState && (

                                        < Form.Control type="file" multiple onChange={handleFileChange} className="mt-1" disabled={!close} />
                                    )}

                                </Form.Group>
                            </Row>

                            <h6 className="text-muted fw-semibold mt-4 mb-2">Description</h6>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    as="textarea"
                                    rows={7}
                                    name="Description"
                                    value={formData.Description ?? 'No Description Provided'}
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

            </AnimatedContent>
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
