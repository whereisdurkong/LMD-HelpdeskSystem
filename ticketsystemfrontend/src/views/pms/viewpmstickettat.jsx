import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "config";
import { Card } from "react-bootstrap";

export default function ViewPMSTicketTAT({ pmsticket_id }) {
    const [tat, setTAT] = useState([]);

    // Function to format TAT values
    const formatTAT = (value) => {
        if (!value) return "";

        const num = parseInt(value);

        if (value.includes("m")) {
            return `${num} minute${num > 1 ? "s" : ""}`;
        }

        if (value.includes("h")) {
            return `${num} hour${num > 1 ? "s" : ""}`;
        }

        if (value.includes("d")) {
            return `${num} day${num > 1 ? "s" : ""}`;
        }

        return value; // fallback
    };

    // Fetch all ticket logs
    useEffect(() => {
        try {
            const fetchData = async () => {
                const res = await axios.get(`${config.baseApi}/tat/get-all-pms-tat`);
                const resData = res.data || [];

                const tatsupport = resData.filter(a => a.ticket_type === 'pms');
                const ticketTAT = tatsupport.filter(a => a.pmsticket_id === pmsticket_id);

                console.log(ticketTAT);
                setTAT(ticketTAT);
            };
            fetchData();

        } catch (err) {
            console.log('Unable to fetch assets: ', err);
        }
    }, [pmsticket_id]);

    return (

        <Card>

            {tat.length === 0 ? (
                <p className="text-muted mb-0">No logs available for this pms ticket.</p>
            ) : (
                <div
                    style={{
                        borderLeft: "3px solid #0d6efd",
                        paddingLeft: "15px",
                    }}
                >
                    {tat.map((a, index) => (
                        <div
                            key={index}
                            style={{
                                position: "relative",
                                marginBottom: "20px",
                            }}
                        >
                            {/* timeline dot */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: "-22px",
                                    top: "4px",
                                    width: "10px",
                                    height: "10px",
                                    borderRadius: "50%",
                                    backgroundColor: "#0d6efd",
                                }}
                            />

                            {/* header */}
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span
                                    className="badge bg-primary"
                                    style={{ fontSize: "12px" }}
                                >
                                    {a.created_by}
                                </span>
                                <small className="text-muted">
                                    {new Date(a.created_at).toLocaleString()}
                                </small>
                            </div>

                            {/* content */}
                            <div
                                style={{
                                    background: "#f8f9fa",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                }}
                            >
                                Turn Around Time: {formatTAT(a.tat)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </Card>
    );
}
