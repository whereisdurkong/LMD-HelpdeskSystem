import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import config from "config";
import { Container, Card, Accordion, ListGroup, Modal, Button, Form, ButtonGroup, Alert } from "react-bootstrap";
import { useNavigate } from "react-router";
import { PencilSquare, Trash3Fill, Archive } from 'react-bootstrap-icons';
import Spinner from 'react-bootstrap/Spinner';

export default function HardwareArchive() {
    const [loaded] = useState(true);
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [kbID, setKbID] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const contentRef = useRef(null);
    const [faqData, setFaqData] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [addMode, setAddMode] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [access, setAccess] = useState(false)
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (loading === true) {
            const timer = setTimeout(() => {
                setLoading(false);
            }, 2000);
            return () => clearTimeout(timer)
        }
    }, [loading])

    // Check user access
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("user"));

        if (userInfo.emp_tier === 'helpdesk') {
            setAccess(true)
        } else if (userInfo.emp_tier === 'user') {
            setAccess(false)
        }
    })

    // Auto-hide alerts
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 3000);
            return () => clearTimeout(timer);
        }
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    // Fetch FAQ data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const all = await axios.get(`${config.baseApi}/knowledgebase/all-knowledgebase`);
                if (all.data && Array.isArray(all.data)) {
                    setFaqData(
                        all.data
                            .filter(item => item.is_active === false && item.kb_category === "hardware")
                            .map(item => ({
                                id: item.kb_id,
                                question: item.kb_title,
                                answer: item.kb_desc
                            }))
                    );
                }
                console.log(all.data);
            } catch (err) {
                console.error("Error fetching FAQ data:", err);
            }
        };
        fetchData();
    }, []);
    const handleUnArchive = async (id) => {
        setLoading(true)

        try {
            const empInfo = JSON.parse(localStorage.getItem("user"));
            await axios.post(`${config.baseApi}/knowledgebase/un-archive-knowledgebase`, { kb_id: id, updated_by: empInfo.user_name })

            setSuccess("Hardware troubleshooting step archived successfully");
            window.location.reload();

        } catch (err) {
            console.log('Unable to archive knowledgebase: ', err);
            setLoading(false)
            setError("Failed to archive kb.");
        }

    }

    // Pre-fill editor when editing
    useEffect(() => {

        if (showModal && contentRef.current) {
            contentRef.current.innerHTML = newContent;
        }
    }, [showModal]);

    const handleDelete = async (id) => {

        const empInfo = JSON.parse(localStorage.getItem("user"));
        if (window.confirm("Are you sure you want to delete ?")) {
            try {
                setLoading(true)
                await axios.post(`${config.baseApi}/knowledgebase/delete-knowledgebase`, { kb_id: id, updated_by: empInfo.user_name });
                setSuccess("Hardware troubleshooting step deleted successfully");
                window.location.reload(); // Reload to reflect changes
            } catch (err) {
                console.error("Error deleting hardware troubleshooting step:", err);
                setLoading(false)
                setError("Failed to delete hardware troubleshooting step.");
            }
        }
    }

    const handleUpdate = async () => {

        if (newTitle === '') {
            setLoading(false)
            setError("Please fill in title.");
        } else if (newContent.replace(/<(.|\n)*?>/g, '').trim() === '') {
            setLoading(false)
            setError("Please fill in description.");
        } else {
            const empInfo = JSON.parse(localStorage.getItem("user"));
            try {
                setLoading(true)
                await axios.post(`${config.baseApi}/knowledgebase/update-knowledgebase`, {
                    kb_id: kbID,
                    kb_title: newTitle,
                    kb_desc: newContent,
                    updated_by: empInfo.user_name,
                })

                setEditMode(false);
                setSuccess("Hardware updated successfully");
                setNewTitle("");
                setNewContent("");
                setShowModal(false);
                window.location.reload(); // Reload to reflect changes 
            } catch (err) {
                console.log('Unable to update knowledgebase: ', err)
            }
        }
    }

    const handleSave = async () => {
        console.log("Saving Hardware:", newTitle, newContent);
        if (newTitle === '') {
            setLoading(false)
            setError("Please fill in title.");
        } else if (newContent.replace(/<(.|\n)*?>/g, '').trim() === '') {
            setLoading(false)
            setError("Please fill in description.");
        } else {
            const empInfo = JSON.parse(localStorage.getItem("user"));
            try {
                setLoading(true)
                await axios.post(`${config.baseApi}/knowledgebase/add-knowledgebase`, {
                    kb_title: newTitle,
                    kb_desc: newContent,
                    created_by: empInfo.user_name,
                    kb_category: "hardware"
                });
                setSuccess("Hardware saved successfully");
            } catch (err) {
                console.error("Error saving Hardware:", err);
            }

            setFaqData([...faqData, { question: newTitle, answer: newContent }]);
            setNewTitle("");
            setNewContent("");
            setEditMode(false);
            setAddMode(false);
            setShowModal(false);
            window.location.reload(); // Reload to reflect changes
        }
    };

    const handleContentChange = () => {
        setNewContent(contentRef.current.innerHTML);
    };

    const applyFormat = (command) => {
        document.execCommand(command, false, null);
        contentRef.current.focus();
    };

    const applyLink = () => {
        const url = prompt("Enter the link URL:");
        if (url) {
            document.execCommand("createLink", false, url);
            contentRef.current.focus();
        }
    };

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
            <Container>
                <Card className="p-4 shadow-lg" style={{ borderRadius: "20px", backgroundColor: "#fff" }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="fw-bold text-dark mb-0">Archived Hardware Questions</h2>
                        {access && (
                            <div className="d-flex gap-2">
                                <Button variant="primary" onClick={() => navigate('/hardware')}>Hardware</Button>
                            </div>
                        )}
                    </div>

                    <hr />

                    <Accordion defaultActiveKey={0} flush>
                        {faqData.length === 0 ? (
                            <div className="text-center text-muted py-3">
                                No archived hardware articles found
                            </div>
                        ) : (

                            faqData.map((faq, index) => (
                                <Accordion.Item eventKey={index.toString()} key={index}>
                                    <Accordion.Header>{faq.question}</Accordion.Header>

                                    <Accordion.Body>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div
                                                className="text-muted"
                                                style={{ flex: 1 }}
                                                dangerouslySetInnerHTML={{ __html: faq.answer }}
                                            />
                                            {access && (
                                                <div>
                                                    {/* EDIT BUTTON */}
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        className="ms-2"
                                                        onClick={() => {
                                                            setNewTitle(faq.question);
                                                            setNewContent(faq.answer);
                                                            setShowModal(true);
                                                            setEditMode(true);
                                                            setKbID(faq.id);
                                                        }}
                                                    >
                                                        <PencilSquare />
                                                    </Button>
                                                    {/* Delete Button */}
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        className="ms-2"
                                                        onClick={() => {
                                                            handleDelete(faq.id);
                                                            setKbID(faq.id);
                                                            setShowModal(false);
                                                            setNewTitle("");
                                                            setNewContent("");
                                                            setAddMode(false);
                                                            setEditMode(false);
                                                        }}
                                                    >
                                                        <Trash3Fill />
                                                    </Button>
                                                    {/* Re-Activate */}
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        className="ms-2"
                                                        onClick={() => {
                                                            handleUnArchive(faq.id);
                                                            setKbID(faq.id);
                                                            setShowModal(false);
                                                            setNewTitle("");
                                                            setNewContent("");
                                                            setAddMode(false);
                                                            setEditMode(false);
                                                        }}
                                                    >
                                                        <Archive />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>
                            ))
                        )}
                    </Accordion>

                    <hr className="my-4" />
                    <p className="text-muted text-center">
                        Have more questions? Email us at{" "}
                        <span className="fw-semibold text-primary">
                            adrian.ventura@lepantomining.com
                        </span>
                    </p>
                </Card>
            </Container>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header >
                    <Modal.Title>{editMode ? 'Edit Hardware Troubleshooting Step' : 'Add Hardware Troubleshooting Step'}</Modal.Title>

                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter title question"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Content</Form.Label>

                            <ButtonGroup size="sm" className="mb-2">
                                <Button variant="outline-secondary" onClick={() => applyFormat("bold")}><b>B</b></Button>
                                <Button variant="outline-secondary" onClick={() => applyFormat("italic")}><em>I</em></Button>
                                <Button variant="outline-secondary" onClick={() => applyFormat("underline")}><u>U</u></Button>
                                <Button variant="outline-secondary" onClick={() => applyFormat("insertUnorderedList")}>• List</Button>
                                <Button variant="outline-secondary" onClick={() => applyFormat("insertOrderedList")}>1. List</Button>
                                <Button variant="outline-secondary" onClick={applyLink}>🔗 Link</Button>
                            </ButtonGroup>

                            <div
                                ref={contentRef}
                                contentEditable

                                onInput={handleContentChange}
                                style={{
                                    border: "1px solid #ced4da",
                                    borderRadius: "5px",
                                    padding: "10px",
                                    minHeight: "150px",
                                    outline: "none"
                                }}
                                required
                            ></div>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        setShowModal(false);
                        setNewTitle("");
                        setNewContent("");
                        setAddMode(false);
                        setEditMode(false);
                        setError('');
                        setSuccess('');
                    }
                    }>
                        Cancel</Button>
                    <Button variant="primary" onClick={editMode ? handleUpdate : handleSave}>
                        {editMode ? 'Update' : 'Save'}
                    </Button>
                </Modal.Footer>
            </Modal>
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
