import { Container, Row, Col, Form, Modal, Button } from "react-bootstrap";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "config";

import SubCatDepartment from "./subcat_department";
import SubCatDepartmentTable from "./subcat_departmentTable";
import "./bento-layout-new.css";
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Report() {
    const [filterType, setFilterType] = useState("all");
    const [stats, setStats] = useState([]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalContent, setModalContent] = useState(null);

    const [open, setOpen] = useState('')
    const [notReviewed, setNotReviewed] = useState('')
    const [closed, setClosed] = useState('')

    const [chartdata, setChartData] = useState(null);

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

                const allOpen = data.filter(ticket => ticket.ticket_status === 'open').length;
                console.log('OPEN:', allOpen)
                setOpen(allOpen)

                const notReviewed = data.filter(ticket => ticket.is_reviewed === 0).length;
                console.log('Not_Reviewed:', notReviewed)
                setNotReviewed(notReviewed)

                const closed = data.filter(ticket => ticket.is_reviewed === 1).length;
                console.log('Closed:', closed)
                setClosed(closed)

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

                const incidentCount = data.filter(i => i.ticket_type === 'incident').length;
                const requestCount = data.filter(r => r.ticket_type === 'request').length;
                const inquiryCount = data.filter(q => q.ticket_type === 'inquiry').length;

                console.log('Incident:', incidentCount);
                console.log('Request:', requestCount);
                console.log('Inquiry:', inquiryCount);

                setChartData({
                    labels: ['Incident', 'Request', 'Inquiry'],
                    datasets: [
                        {
                            label: 'Number of Tickets',
                            data: [incidentCount, requestCount, inquiryCount],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.5)',
                                'rgba(54, 162, 235, 0.5)',
                                'rgba(255, 206, 86, 0.5)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)'
                            ],
                            borderWidth: 1
                        }
                    ]
                });

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
            <Row className="align-items-center g-3 mb-4">
                {/* Title */}
                <Col xs={12} md={8} lg={9}>
                    <h2 className="mb-0"><b>Reports</b></h2>
                </Col>

                {/* Status Filter */}
                <Col xs={12} md={4} lg={3}>
                    <Form.Group controlId="status-filter" style={{ width: '100%' }}>
                        <Form.Select
                            style={{
                                border: '2px solid #e9ecef',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '15px',
                                background: '#f8f9fa',
                            }}
                        >
                            <option value="All">Today</option>
                            <option value="open">This Week</option>
                            <option value="assigned">Last Week</option>
                            <option value="in-progress">This Month</option>
                            <option value="escalated">Last Month</option>
                            <option value="resolved">Year</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            <Row style={{ paddingBottom: '20px' }}>
                <Col>
                    <div className="bento-item-top " >
                        <div
                            style={{
                                background: '#004e0dff',
                                borderRadius: '5px 5px 0 0',
                                color: '#fff',
                                padding: '5px',
                                textAlign: 'center'
                            }}>
                            <b>Open Tickets</b>

                        </div>

                        <div style={{
                            textAlign: 'center',
                            paddingTop: '10px',

                        }}><h1>{open}</h1>

                        </div>

                    </div>
                </Col>
                <Col>
                    <div className="bento-item-top " >
                        <div
                            style={{
                                background: '#004e0dff',
                                borderRadius: '5px 5px 0 0',
                                color: '#fff',
                                padding: '5px',
                                textAlign: 'center'
                            }}>
                            <b>Not Reviewed</b>

                        </div>

                        <div style={{
                            textAlign: 'center',
                            paddingTop: '10px',

                        }}><h1>{notReviewed}</h1>

                        </div>

                    </div>
                </Col>
                <Col>
                    <div className="bento-item-top " >
                        <div
                            style={{
                                background: '#004e0dff',
                                borderRadius: '5px 5px 0 0',
                                color: '#fff',
                                padding: '5px',
                                textAlign: 'center'
                            }}>
                            <b>Closed Tickets</b>

                        </div>

                        <div style={{
                            textAlign: 'center',
                            paddingTop: '10px',

                        }}><h1>{closed}</h1>

                        </div>

                    </div>
                </Col>
            </Row>
            <Row style={{ paddingBottom: '20px' }}>
                <Col xs={8}>
                    <div className="bento-item bento-users">
                        <div style={{ alignContent: 'center' }} >
                            {/* Same table preview as modal */}
                            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: '100%' }}>
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
                                    <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                                        <td>Total</td>
                                        <td>{totalRow.total}</td>
                                        <td>{totalRow.resolved}</td>
                                        <td>{totalRow.closed}</td>
                                        <td>{totalRow.open}</td>
                                        <td>-</td>
                                    </tr>
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

                                </tbody>
                            </table>

                        </div>
                    </div>
                </Col>
                <Col >
                    <div className="bento-item bento-users" onClick={() => openModal("Ticket Summary ", <SubCatDepartmentTable filterType={filterType} />)}>
                        <h3>Summary</h3>
                        <div className="bento-chart-wrapper" >
                            <SubCatDepartment filterType={filterType} />
                        </div>
                    </div>

                </Col>

            </Row>
            <Row>
                <Col>
                    <div className="bento-item bento-users">
                        <div style={{ width: '100%', height: '100%' }}>
                            {chartdata && (
                                <Bar
                                    data={chartdata}
                                    options={{
                                        responsive: true,

                                        plugins: {
                                            legend: { display: true },
                                            title: { display: true, text: "Tickets by Type" }
                                        },
                                        scales: {
                                            y: { beginAtZero: true }
                                        }
                                    }}
                                    style={{ height: "100%", width: '100%' }}
                                />
                            )}
                        </div>
                    </div>
                </Col>
                <Col xs={5}>
                    <div className="bento-item bento-users">

                    </div>
                </Col>
                <Col>
                    <div className="bento-item bento-users">

                    </div>
                </Col>
            </Row>
        </Container >
    );
}
