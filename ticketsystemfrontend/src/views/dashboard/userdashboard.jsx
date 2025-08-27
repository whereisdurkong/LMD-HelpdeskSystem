import { useEffect, useState } from "react";
import axios from "axios";
import config from "config";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

export default function UserDashboard() {
    const [announcements, setAnnouncements] = useState("");

    const empInfo = JSON.parse(localStorage.getItem("user"));
    const userName = empInfo?.user_name || "";
    const allcaps = userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();

    useEffect(() => {
        const fetchAnc = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/announcements/get-all-anc`);
                const allAnc = res.data || [];

                if (allAnc.length > 0) {
                    const newestAnc = [...allAnc].sort((a, b) => {
                        const dateA = new Date(a.updated_at || a.created_at);
                        const dateB = new Date(b.updated_at || b.created_at);
                        return dateB - dateA;
                    })[0];

                    setAnnouncements(newestAnc);
                }
            } catch (err) {
                console.error("Error fetching announcements:", err);
            }
        };

        fetchAnc();
    }, []);

    return (
        <Container
            fluid
            style={{
                background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)',
                minHeight: "100vh",
                paddingTop: '100px',

            }}
        >
            <Row className="align-items-start" style={{ padding: '20px' }}>
                {/* Left side */}
                <Col xs={12} md={6} className="mb-4">
                    {/* Welcome Text */}
                    <h1 style={{ fontSize: "4.5rem", fontWeight: "bold", marginBottom: "20px", color: '#012500ff' }}>
                        Welcome, {allcaps}
                    </h1>

                    {/* Ticket Prompt */}
                    <p style={{ fontSize: "2.1rem", marginBottom: "15px" }}>
                        Create a ticket now so we can <br /> address your concern.
                    </p>

                    {/* Create Ticket Button */}
                    <Button
                        variant="success"
                        style={{ fontSize: "1rem", padding: "10px 20px" }}
                    >
                        Create a Ticket
                    </Button>
                </Col>

                {/* Right side - Announcement Card */}
                <Col xs={12} md={6} className="d-flex justify-content-md-end">
                    <Card
                        style={{
                            width: "100%",
                            maxWidth: "1000px",
                            border: "2px solid #000",
                            borderRadius: "4px",
                            boxShadow: "4px 4px 0px #888",
                            overflow: "hidden",
                            backgroundColor: "#f1f1f1",
                        }}
                    >
                        {/* Fake Browser Title Bar */}
                        <div
                            style={{
                                background: "linear-gradient(to right, #d4d0c8, #c0c0c0)",
                                padding: "4px 8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderBottom: "2px solid #000",
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                            }}
                        >
                            <span>🗔 Announcement</span>
                            <div>
                                <button
                                    style={{
                                        marginLeft: "4px",
                                        border: "1px solid #000",
                                        background: "#e0e0e0",
                                        width: "20px",
                                        height: "20px",
                                        fontSize: "0.7rem",
                                        lineHeight: "1",
                                    }}
                                >
                                    _
                                </button>
                                <button
                                    style={{
                                        marginLeft: "4px",
                                        border: "1px solid #000",
                                        background: "#e0e0e0",
                                        width: "20px",
                                        height: "20px",
                                        fontSize: "0.7rem",
                                        lineHeight: "1",
                                    }}
                                >
                                    □
                                </button>
                                <button
                                    style={{
                                        marginLeft: "4px",
                                        border: "1px solid #000",
                                        background: "#e0e0e0",
                                        width: "20px",
                                        height: "20px",
                                        fontSize: "0.7rem",
                                        lineHeight: "1",
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <Card.Body style={{ backgroundColor: "white", padding: "10px" }}>
                            <Row className="align-items-center mb-2">
                                <Col>
                                    <Card.Title
                                        className="fw-bold"
                                        style={{ fontSize: "1rem", fontFamily: "Tahoma, Verdana, sans-serif" }}
                                    >
                                        {announcements.announcementTitle || "Announcement title"}
                                    </Card.Title>
                                </Col>
                                <Col className="text-end">
                                    <Card.Text
                                        className="text-muted"
                                        style={{ fontSize: "0.85rem", fontFamily: "Tahoma, Verdana, sans-serif" }}
                                    >
                                        {announcements?.created_at &&
                                            new Date(announcements.created_at).toLocaleDateString()}
                                    </Card.Text>
                                </Col>
                            </Row>
                            <Card.Text
                                style={{ fontSize: "0.95rem", fontFamily: "Tahoma, Verdana, sans-serif" }}
                            >
                                {announcements.announcements || "CONTEXT"}
                            </Card.Text>
                        </Card.Body>
                    </Card>

                </Col>
            </Row>
        </Container>
    );
}
