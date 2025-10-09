import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "config";
import { Card } from "react-bootstrap";

export default function ViewTicketLogs({ ticket_id }) {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get(`${config.baseApi}/ticket/ticket-logs`, {
                    params: { id: ticket_id },
                });
                setLogs(response.data);
            } catch (err) {
                console.error("Error fetching ticket logs:", err);
            }
        };

        if (ticket_id) fetchLogs();
    }, [ticket_id]);

    return (

        <Card
            style={{
                backgroundColor: "#fffbe6",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                padding: "20px",
                fontFamily: "'Courier New', monospace",
            }}
        >
            <h5
                style={{
                    borderBottom: "2px solid #ccc",
                    paddingBottom: "10px",
                    marginBottom: "20px",
                    color: "#333",
                }}
            >
                Ticket Logs (ID: {ticket_id})
            </h5>

            {logs.length === 0 ? (
                <p style={{ color: "#777" }}>No logs available for this ticket.</p>
            ) : (
                <div
                    style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.5",
                        color: "#222",
                        backgroundColor: "#fffbe6",
                    }}
                >
                    {logs.map((log, index) => (
                        <div
                            key={index}
                            style={{
                                borderBottom: "1px dashed #ddd",
                                paddingBottom: "10px",
                                marginBottom: "10px",
                            }}
                        >
                            <div style={{ fontWeight: "bold", color: "#007b5e" }}>
                                {log.created_by} — {new Date(log.time_date).toLocaleString()}
                            </div>
                            <div style={{ marginTop: "5px" }}>{log.changes_made}</div>
                        </div>
                    ))}
                </div>
            )}
        </Card>

    );
}
