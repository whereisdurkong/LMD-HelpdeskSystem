import { useEffect, useState } from 'react';
import { Table, Container, Button, Card, Form, Row, Col, Alert } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import axios from 'axios';
import config from 'config';
import Spinner from 'react-bootstrap/Spinner';



export default function Announcements() {
    const [announcementText, setAnnouncementText] = useState('');
    const [announcementTitleText, setAnnouncementTitleText] = useState('');
    const [announcementsList, setAnnouncementsList] = useState([]);
    const [fullname, setFullname] = useState({});

    const [showCard, setShowCard] = useState(false);
    const [ancId, setAncId] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const announcementsPerPage = 5;

    const [loading, setLoading] = useState(false);

    // Pagination logic
    const indexOfLast = currentPage * announcementsPerPage;
    const indexOfFirst = indexOfLast - announcementsPerPage;
    const currentAnnouncements = announcementsList.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(announcementsList.length / announcementsPerPage);

    const [access, setAccess] = useState(false);

    //Loading state
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setLoading(false);
            }, 2000);
            return () => clearTimeout(timer)
        }
    }, [loading])

    //Validations 
    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem("user"));

        if (empInfo.emp_tier === 'helpdesk') {
            setAccess(true)
        } else if (empInfo.emp_tier === 'user') {
            setAccess(false)
        }
    })

    // Fetch announcements and usernames
    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                /// Fetch all announcements
                const res = await axios.get(`${config.baseApi}/announcements/get-all-anc`);
                const active = res.data.filter(data => data.is_active === true);
                const sorted = active.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setAnnouncementsList(sorted);


                const usernames = res.data.map(data => data.created_by);
                // Fetch usernames for the announcements
                const getUsernames = await axios.get(`${config.baseApi}/authentication/get-all-notes-usernames`, {
                    params: { user_name: JSON.stringify(usernames) }
                });

                const userMap = {}
                getUsernames.data.forEach(user => {
                    userMap[user.user_name] = `${user.emp_FirstName} ${user.emp_LastName}`;
                });
                setFullname(userMap);
            } catch (error) {
                console.error("Failed to fetch announcements:", error);
            }
        };

        fetchAnnouncements();
    }, []);

    const HandleAdd = () => {
        setShowCard(true);
        setIsEditing(false);
        setAnnouncementText('');
    };

    // Handle save announcement
    const HandleSave = async () => {
        const empInfo = JSON.parse(localStorage.getItem("user"));

        if (!announcementTitleText.trim() || !announcementText.trim()) {
            setLoading(false)
            setError("Unable to save empty fields, please try again.");
            return;
        }
        try {
            setLoading(true);
            await axios.post(`${config.baseApi}/announcements/add-anc`, {
                announcements: announcementText,
                created_by: empInfo.user_name,
                announcementTitle: announcementTitleText
            });
            setSuccess("Announcement created successfully!");
            setAnnouncementText('');
            setAnnouncementTitleText('')
            setShowCard(false);
            window.location.reload();
        } catch (error) {
            console.error("Error saving announcement:", error);
            setLoading(false)
            setError("Failed to create announcement.");
        }
    };

    // Handle edit announcement setting up values for editing
    const handleEditClick = (announcement) => {
        setAnnouncementText(announcement.announcements);
        setAnnouncementTitleText(announcement.announcementTitle)
        setEditId(announcement.announcements_id);
        setIsEditing(true);
        setShowCard(true);
        setAncId(null);
    };
    //Edit Announcement Function
    const handleUpdate = async () => {
        const empInfo = JSON.parse(localStorage.getItem("user"));
        console.log("Updating announcement with ID:", editId, "Text:", announcementText, "User:", empInfo.user_name);
        try {
            setLoading(true);
            await axios.post(`${config.baseApi}/announcements/update-anc`, {
                announcement_id: editId,
                announcements: announcementText,
                updated_by: empInfo.user_name,
                announcementTitle: announcementTitleText
            });

            setSuccess("Announcement updated successfully!");

            setAnnouncementText('');
            setShowCard(false);
            setIsEditing(false);
            setEditId(null);

            window.location.reload();
        } catch (err) {
            console.log('Unable to update announcement:', err);
            setLoading(false)
            setError("Failed to update announcement.");
        }
    };

    //Handle Archive Announcements
    const handleDelete = async (announcementId) => {
        const empInfo = JSON.parse(localStorage.getItem("user"));
        if (!window.confirm("Are you sure you want to archive this announcement?")) {
            return;
        }
        try {
            setLoading(true);
            await axios.post(`${config.baseApi}/announcements/delete-anc`, {
                announcement_id: announcementId,
                updated_by: empInfo.user_name
            });
            setSuccess("Announcement deleted successfully!");
            setAnnouncementsList(announcementsList.filter(item => item.announcements_id !== announcementId));
            setAncId(null);

            window.location.reload();
        } catch (error) {
            console.error("Error deleting announcement:", error);
            setLoading(false)
            setError("Failed to delete announcement.");
        }
    }
    //Archvie navigate
    const HandleArchive = () => {
        setLoading(true);
        window.location.replace('/ticketsystem/inactive-announcements');
    }

    return (
        <Container
            fluid
            className="pt-100 px-3 px-md-5"
            style={{
                background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)',
                minHeight: '100vh',
                paddingTop: '100px',
                paddingBottom: '20px',
            }}
        >

            {error && (
                <div className="position-fixed start-50 translate-middle-x" style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}>
                    <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>
                </div>
            )}
            {success && (
                <div className="position-fixed start-50 translate-middle-x" style={{ top: '100px', zIndex: 9999, minWidth: '300px' }}>
                    <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>
                </div>
            )}
            {access &&
                (
                    <Row className="align-items-center mb-3">
                        <Col xs={12} md={6}>
                            <h2 className="mb-0"><b>Announcements</b></h2>
                        </Col>

                        <Col xs={12} md={6}>
                            <div className="d-flex justify-content-md-end justify-content-start gap-2 mt-2 mt-md-0">
                                <Button variant="secondary" onClick={HandleArchive}>Archive</Button>
                                <Button variant="primary" onClick={HandleAdd}>+ Create Post</Button>
                            </div>
                        </Col>
                    </Row>

                )}


            <div className="mt-4">

                {announcementsList.length === 0 ? (
                    <div
                        className="d-flex justify-content-center align-items-center"
                        style={{ minHeight: '200px' }}
                    >
                        <Card.Text style={{
                            fontSize: '1.2rem',
                            fontWeight: '500',
                            textAlign: 'center'
                        }}>
                            NO ANNOUNCEMENTS
                        </Card.Text>
                    </div>
                ) : (
                    currentAnnouncements.map((item) => (
                        <Card key={item.announcements_id} className="mb-4 shadow-sm" style={{ borderRadius: '15px' }}>
                            <Card.Body>
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <div className="d-flex align-items-center">
                                        <img
                                            src="src/assets/images/user/avatar-2.jpg"
                                            alt="Profile"
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                marginRight: '10px'
                                            }}
                                        />
                                        <div>
                                            <strong>
                                                {fullname[item.created_by] || item.created_by || 'Unknown'}
                                            </strong>
                                            <br />
                                            <small className="text-muted">
                                                {new Date(item.created_at).toLocaleString()}
                                            </small>
                                        </div>
                                    </div>
                                    {access && (
                                        <div onClick={() => {
                                            setAncId(item.announcements_id === ancId ? null : item.announcements_id);
                                        }}>
                                            <i className="bi bi-three-dots" style={{ cursor: 'pointer' }}></i>

                                            {ancId === item.announcements_id && (
                                                <div
                                                    className="position-absolute bg-white border rounded shadow-sm"
                                                    style={{ top: '20px', right: '0', zIndex: 1000, minWidth: '100px' }}
                                                >
                                                    <div
                                                        className="p-2 text-dark border-bottom"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleEditClick(item)}
                                                    >
                                                        Edit
                                                    </div>
                                                    <div
                                                        className="p-2 text-danger"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => {
                                                            handleDelete(item.announcements_id);
                                                        }}
                                                    >
                                                        Archive
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Card.Text className="mb-0" style={{ fontSize: '1.5rem' }}>
                                    <b>{item.announcementTitle}</b>
                                </Card.Text>
                                <Card.Text className="mb-0" style={{ fontSize: '1.0rem' }}>
                                    {item.announcements}
                                </Card.Text>
                            </Card.Body>

                        </Card>
                    )))}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3 flex-wrap gap-2">
                        <Button
                            variant="miColor"
                            size="sm"
                            className="me-2"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Prev
                        </Button>
                        <span className="align-self-center">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="miColor"
                            size="sm"
                            className="ms-2"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            {showCard && (
                <Card className='announcement-card p-4 shadow' style={{ borderRadius: '15px', maxWidth: '600px', margin: '0 auto' }}>
                    <Card.Title className="mb-3">
                        {isEditing ? "Edit Announcement" : "Create Announcement"}
                    </Card.Title>
                    <Form>
                        {/* Title Input */}
                        <Form.Group controlId="announcementTitle" className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter title"
                                value={announcementTitleText}
                                onChange={(e) => setAnnouncementTitleText(e.target.value)}
                                required
                            />
                        </Form.Group>

                        {/* Announcement Textarea */}
                        <Form.Group controlId="announcementText">
                            <Form.Label>Announcement</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={announcementText}
                                onChange={(e) => setAnnouncementText(e.target.value)}
                                placeholder="What's on your mind?"
                            />
                        </Form.Group>

                        {/* Buttons */}
                        <div className="mt-3 d-flex justify-content-end gap-2 flex-wrap">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowCard(false);
                                    setIsEditing(false);
                                    setEditId(null);
                                    setAnnouncementTitleText('');
                                    setAnnouncementText('');
                                }}
                                className="me-2"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={isEditing ? handleUpdate : HandleSave}
                            >
                                {isEditing ? "Update" : "Post"}
                            </Button>
                        </div>
                    </Form>
                </Card>
            )}
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
