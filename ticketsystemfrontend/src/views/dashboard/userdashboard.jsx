import { useEffect, useState } from "react";
import axios from "axios";
import config from "config";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Dashboardbtn from "layouts/ReactBits/dashboardbtn";
import Squares from "layouts/ReactBits/Squares";
import { useNavigate } from 'react-router-dom';
import BTN from "layouts/ReactBits/BTN";


export default function UserDashboard() {
    const [announcements, setAnnouncements] = useState("");
    const [ancState, setAncState] = useState(false)
    const [exitAnc, setExitAnc] = useState(true);

    const navigate = useNavigate()

    //Display users Username
    const empInfo = JSON.parse(localStorage.getItem("user"));
    const userName = empInfo?.user_name || "";
    const allcaps = userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();

    //Fetch All Announcements
    useEffect(() => {
        const fetchAnc = async () => {
            try {
                const res = await axios.get(
                    `${config.baseApi}/announcements/get-all-anc`
                );
                const allAnc = res.data || [];

                const activeAnc = allAnc.filter(anc => anc.is_active === true)

                if (activeAnc.length > 0) {
                    const newestAnc = [...activeAnc].sort((a, b) => {
                        const dateA = new Date(a.updated_at || a.created_at);
                        const dateB = new Date(b.updated_at || b.created_at);
                        return dateB - dateA;
                    })[0];
                    setAncState(true)
                    setAnnouncements(newestAnc);
                } else {
                    setAncState(false)
                }
            } catch (err) {
                console.error("Error fetching announcements:", err);
            }
        };

        fetchAnc();
    }, []);

    //navigate create a ticket
    const handleCreate = () => {
        navigate('/create-ticket')
    }

    return (
        <Container
            fluid
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                textAlign: "center",
                padding: "20px",
                overflow: "hidden", // ensure background doesn’t overflow
            }}
        >
            {/* Squares as background */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 0,
                    background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)'
                }}
            >
                <Squares
                    speed={0.1}
                    squareSize={100}
                    direction="down"
                    borderColor="rgba(255, 229, 112, 0.37)"
                    hoverFillColor="#dbcc40ff"

                />
            </div>

            {/* Foreground content */}
            <div style={{ zIndex: 1 }}>
                <h1
                    style={{
                        fontSize: "4.5rem",
                        fontWeight: "bold",
                        marginBottom: "20px",
                        color: "#012500ff",
                    }}
                >
                    Welcome, {allcaps}
                </h1>

                <p style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "15px" }}>
                    Create a ticket now so we can <br /> address your concern.
                </p>
                <Dashboardbtn onClick={handleCreate}>

                    Create a Ticket

                </Dashboardbtn>


            </div>

            {/* Fixed bottom-right card */}

            {exitAnc && ancState && (
                <Card
                    className="popup-card"
                    style={{
                        width: "90%",
                        maxWidth: "900px",
                        border: "2px solid #000",
                        borderRadius: "4px",
                        boxShadow: "4px 4px 0px #888",
                        overflow: "hidden",
                        backgroundColor: "#f1f1f1",
                        position: "fixed",
                        bottom: "0px",
                        right: "20px",
                        textAlign: "start",
                        zIndex: 2, // higher than background
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
                                onClick={() => setExitAnc(false)}
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
                                onClick={() => navigate('/announcements')}
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
                                onClick={() => setExitAnc(false)}
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
                                    style={{
                                        fontSize: "1rem",
                                        fontFamily: "Tahoma, Verdana, sans-serif",
                                    }}
                                >
                                    {announcements.announcementTitle ||
                                        "Announcement title"}
                                </Card.Title>
                            </Col>
                            <Col className="text-end">
                                <Card.Text
                                    className="text-muted"
                                    style={{
                                        fontSize: "0.85rem",
                                        fontFamily: "Tahoma, Verdana, sans-serif",
                                    }}
                                >
                                    {announcements?.created_at &&
                                        new Date(
                                            announcements.created_at
                                        ).toLocaleDateString()}
                                </Card.Text>
                            </Col>
                        </Row>
                        <Card.Text
                            style={{
                                fontSize: "0.95rem",
                                fontFamily: "Tahoma, Verdana, sans-serif",
                            }}
                        >
                            {announcements.announcements || "CONTEXT"}
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}

            {/* Animation styles */}
            <style>{`
                @keyframes popup {
                    0% { transform: scale(0.7); opacity: 0; }
                    60% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); }
                }

                .popup-card {
                    animation: popup 0.4s ease-out;
                }
            `}</style>
        </Container>
    );
}
