import { Container, Row, Col, Form, Modal, Button } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "config";

import AllTicketsByUser from "./allticketsbyuser";
import AllTicketBySite from "./allticketbysite";
import AllTicketbyType from "./allticketbytype";
import AllTicketsByStatus from "./allticketsbystatus";
import GetAllByCategory from "./getallbycategory";
import AllTicketByTAT from "./allticketbytat";

import SubCatDepartment from "./subcat_department";
import SubCatDepartmentTable from "./subcat_departmentTable";
import "./bento-layout-new.css";

export default function Report() {
    const [filterType, setFilterType] = useState("all");
    const [stats, setStats] = useState([]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    const openModal = (title, content) => {
        setModalTitle(title);
        setModalContent(content);
        setShowModal(true);
    };

    const calcTAT = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { diffMs, text: `${diffDays}d ${diffHours}h ${diffMinutes}m` };
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                const data = res.data || [];

                const grouped = data.reduce((acc, ticket) => {
                    const subCat = ticket.ticket_SubCategory || "Unknown";
                    const status = ticket.ticket_status?.toLowerCase() || "unknown";

                    if (!acc[subCat]) {
                        acc[subCat] = {
                            subcategory: subCat,
                            total: 0,
                            resolved: 0,
                            closed: 0,
                            open: 0,
                            tatTimes: []
                        };
                    }

                    acc[subCat].total += 1;

                    if (status === "resolved") {
                        acc[subCat].resolved += 1;
                    } else if (status === "closed") {
                        acc[subCat].closed += 1;
                    } else if (status === "open") {
                        acc[subCat].open += 1;
                    }

                    if (ticket.created_at && ticket.resolved_at) {
                        const tat = calcTAT(ticket.created_at, ticket.resolved_at);
                        acc[subCat].tatTimes.push(tat.diffMs);
                    }

                    return acc;
                }, {});

                const result = Object.values(grouped).map(item => {
                    if (item.tatTimes.length > 0) {
                        const avgMs = item.tatTimes.reduce((a, b) => a + b, 0) / item.tatTimes.length;
                        const diffDays = Math.floor(avgMs / (1000 * 60 * 60 * 24));
                        const diffHours = Math.floor((avgMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const diffMinutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
                        item.avgTAT = `${diffDays}d ${diffHours}h ${diffMinutes}m`;
                    } else {
                        item.avgTAT = "N/A";
                    }
                    return item;
                });

                setStats(result);
            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, []);

    const totalRow = stats.reduce(
        (totals, row) => {
            totals.total += row.total;
            totals.resolved += row.resolved;
            totals.closed += row.closed;
            totals.open += row.open;
            return totals;
        },
        { total: 0, resolved: 0, closed: 0, open: 0 }
    );

    return (
        <Container
            fluid
            className="pt-100 px-3 px-md-5"
            style={{
                background: "linear-gradient(to bottom, #ffe798ff, #b8860b)",
                minHeight: "100vh",
                paddingTop: "100px",
                paddingBottom: "20px",
            }}
        >
            <Row className="align-items-center mb-2 justify-content-between">
                <Col xs="auto">
                    <div style={{ fontSize: '40px' }}><b>REPORTS</b></div>
                </Col>

                <Col xs="auto">
                    <Form.Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ maxWidth: "550px" }}
                    >
                        <option value="all">All</option>
                        <option value="today">Today</option>
                        <option value="thisWeek">This Week</option>
                        <option value="lastWeek">Last Week</option>
                        <option value="thisMonth">This Month</option>
                        <option value="perMonth">Per Month</option>
                        <option value="perYear">Per Year</option>
                    </Form.Select>
                </Col>
            </Row>

            <div className="bento-container">
                {/* Table Card */}
                <div
                    className="bento-item bento-data"
                    onClick={() => openModal("Tickets Summary by Subcategory",
                        <div style={{ overflow: "auto", maxHeight: "80vh" }}>
                            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
                                <thead style={{ background: '#053b00ff', color: 'white' }}>
                                    <tr>
                                        <th>Subcategory</th>
                                        <th>Total</th>
                                        <th>Resolved</th>
                                        <th>Closed</th>
                                        <th>Open</th>
                                        <th>Average TAT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row.subcategory}</td>
                                            <td>{row.total}</td>
                                            <td>{row.resolved}</td>
                                            <td>{row.closed}</td>
                                            <td>{row.open}</td>
                                            <td>{row.avgTAT}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                                        <td>Total</td>
                                        <td>{totalRow.total}</td>
                                        <td>{totalRow.resolved}</td>
                                        <td>{totalRow.closed}</td>
                                        <td>{totalRow.open}</td>
                                        <td>-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                >
                    <div className="bento-chart-wrapper">
                        <div style={{ width: "100%", overflowY: "auto" }}>
                            {/* Same table preview as modal */}
                            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
                                <thead style={{ background: '#053b00ff', color: 'white' }}>
                                    <tr>
                                        <th>Subcategory</th>
                                        <th>Total</th>
                                        <th>Resolved</th>
                                        <th>Closed</th>
                                        <th>Open</th>
                                        <th>Average TAT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row.subcategory}</td>
                                            <td>{row.total}</td>
                                            <td>{row.resolved}</td>
                                            <td>{row.closed}</td>
                                            <td>{row.open}</td>
                                            <td>{row.avgTAT}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                                        <td>Total</td>
                                        <td>{totalRow.total}</td>
                                        <td>{totalRow.resolved}</td>
                                        <td>{totalRow.closed}</td>
                                        <td>{totalRow.open}</td>
                                        <td>-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Other Cards */}
                <div className="bento-item bento-users" onClick={() => openModal("Ticket Summary ", <SubCatDepartmentTable filterType={filterType} />)}>
                    <h3 className="bento-chart-title">Tickets Summary</h3>
                    <div className="bento-chart-wrapper">
                        <SubCatDepartment filterType={filterType} />
                    </div>
                </div>

                <div className="bento-item bento-users" onClick={() => openModal("Tickets by User", <AllTicketsByUser filterType={filterType} />)}>
                    <h3 className="bento-chart-title">Tickets by User</h3>
                    <div className="bento-chart-wrapper">
                        <AllTicketsByUser filterType={filterType} />
                    </div>
                </div>

                <div className="bento-item bento-sites" onClick={() => openModal("Tickets by Site", <AllTicketBySite filterType={filterType} />)}>
                    <h3 className="bento-chart-title">Tickets by Site</h3>
                    <div className="bento-chart-wrapper">
                        <AllTicketBySite filterType={filterType} />
                    </div>
                </div>

                <div className="bento-item bento-types" onClick={() => openModal("Tickets by Type", <AllTicketbyType filterType={filterType} />)}>
                    <h3 className="bento-chart-title">Tickets by Type</h3>
                    <div className="bento-chart-wrapper">
                        <AllTicketbyType filterType={filterType} />
                    </div>
                </div>

                <div className="bento-item bento-status" onClick={() => openModal("Tickets by Status", <AllTicketsByStatus filterType={filterType} />)}>
                    <h3 className="bento-chart-title">Tickets by Status</h3>
                    <div className="bento-chart-wrapper">
                        <AllTicketsByStatus filterType={filterType} />
                    </div>
                </div>

                <div className="bento-item bento-category" onClick={() => openModal("Tickets by Category", <GetAllByCategory filterType={filterType} />)}>
                    <h3 className="bento-chart-title">Tickets by Category</h3>
                    <div className="bento-chart-wrapper">
                        <GetAllByCategory filterType={filterType} />
                    </div>
                </div>

                <div className="bento-item bento-tat" onClick={() => openModal("Tickets by Turnaround Time", <AllTicketByTAT filterType={filterType} />)}>
                    <h3 className="bento-chart-title">Tickets by Turnaround Time</h3>
                    <div className="bento-chart-wrapper">
                        <AllTicketByTAT filterType={filterType} />
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{modalContent}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
