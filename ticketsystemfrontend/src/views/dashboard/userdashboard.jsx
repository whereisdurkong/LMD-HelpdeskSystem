import { useEffect, useState } from "react";
import axios from "axios";
import config from "config";

import comment from "src/assets/images/b2.png"; // bubble
import people from "src/assets/images/bg1.png"; // team
import { Container } from "react-bootstrap";

export default function UserDashboard() {
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem("user"));
        setUsername(empInfo?.user_name || "");

        const fetchTickets = async () => {
            const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
            const allticket = res.data || [];

            const userticket = allticket.filter(
                (ticket) =>
                    (ticket.created_by || ticket.ticket_for) === empInfo?.user_name
            );

            if (userticket.length === 0) {
                setMessage("Create a ticket now so we can address your concern.");
            } else {
                setMessage("");
            }
        };
        fetchTickets();
    }, []);

    return (
        <Container
            fluid
            className="d-flex flex-column justify-content-between"
            style={{
                background: "#fcd34d", // yellow background
                minHeight: "100vh",
                paddingTop: "100px",

            }}
        >
            {/* Top Section */}
            <div>
                <h1
                    style={{
                        fontSize: "clamp(32px, 5vw, 60px)", // responsive font size
                        fontWeight: "bold",
                        color: "#111",
                    }}
                >
                    Welcome{" "}
                    {username
                        ? username.toUpperCase()
                        : "${User_name}"}
                </h1>

                {message && (
                    <p
                        style={{
                            fontSize: "clamp(14px, 2vw, 18px)",
                            color: "#333",
                            marginTop: "20px",
                            maxWidth: "600px",
                        }}
                    >
                        {message}
                    </p>
                )}

                <button
                    style={{
                        marginTop: "20px",
                        backgroundColor: "#22c55e",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "16px",
                        fontWeight: "500",
                        cursor: "pointer",
                    }}
                >
                    Create a Ticket
                </button>
            </div>

            {/* Bottom Section */}
            <div className="position-relative mt-5 d-flex justify-content-center">
                {/* Bubble */}
                <img
                    src={comment}
                    alt="Comment"
                    className="position-absolute"
                    style={{
                        top: "-15%",
                        right: "5%",
                        width: "clamp(150px, 30%, 300px)", // responsive bubble size
                        height: "auto",
                    }}
                />

                {/* People */}
                <img
                    src={people}
                    alt="People"
                    style={{
                        width: "100%",
                        maxWidth: "900px", // limit max size
                        height: "auto",
                    }}
                />
            </div>
        </Container>
    );
}
