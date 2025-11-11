import { useEffect, useState } from "react";
import axios from "axios";
import config from "config";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import { Pagination } from "react-bootstrap";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function LocationTicketsChart({ filterType, showChart = true }) {
    const [chartData, setChartData] = useState(null);
    const [ticketsBySite, setTicketsBySite] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    //Get All tickets
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                let tickets = res.data || [];
                const today = new Date();

                // Filter tickets
                tickets = tickets.filter(ticket => {
                    const ticketDate = new Date(ticket.created_at);
                    switch (filterType) {
                        case "today":
                            return ticketDate.toDateString() === today.toDateString();
                        case "thisWeek": {
                            const firstDay = new Date(today);
                            firstDay.setDate(today.getDate() - today.getDay());
                            const lastDay = new Date(firstDay);
                            lastDay.setDate(firstDay.getDate() + 6);
                            return ticketDate >= firstDay && ticketDate <= lastDay;
                        }
                        case "lastWeek": {
                            const firstDay = new Date(today);
                            firstDay.setDate(today.getDate() - today.getDay() - 7);
                            const lastDay = new Date(firstDay);
                            lastDay.setDate(firstDay.getDate() + 6);
                            return ticketDate >= firstDay && ticketDate <= lastDay;
                        }
                        case "thisMonth":
                            return (
                                ticketDate.getFullYear() === today.getFullYear() &&
                                ticketDate.getMonth() === today.getMonth()
                            );
                        case "perMonth":
                            return ticketDate.getFullYear() === today.getFullYear();
                        case "perYear":
                            return true;
                        case "all":
                        default:
                            return true;
                    }
                });

                // Group tickets per site
                const grouped = tickets.reduce((acc, t) => {
                    const site = t.assigned_location?.trim() || "Unknown";
                    if (!acc[site]) acc[site] = [];
                    acc[site].push(t);
                    return acc;
                }, {});
                setTicketsBySite(grouped);

                // Build chart data
                if (showChart) {
                    let labels = [];
                    let datasets = [];

                    if (filterType === "perMonth") {
                        labels = [
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                        ];
                        const siteNames = Object.keys(grouped);

                        datasets = siteNames.map(site => {
                            const countsPerMonth = labels.map((_, monthIndex) =>
                                (grouped[site] || []).filter(
                                    t => new Date(t.created_at).getMonth() === monthIndex
                                ).length
                            );
                            return {
                                label: site,
                                data: countsPerMonth,
                                backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`
                            };
                        });
                    } else {
                        labels = Object.keys(grouped);
                        datasets = [
                            {
                                label: "Tickets",
                                data: labels.map(site => grouped[site].length),
                                backgroundColor: "rgba(54, 162, 235, 0.6)",
                                borderColor: "rgba(54, 162, 235, 1)",
                                borderWidth: 1
                            }
                        ];
                    }

                    setChartData({ labels, datasets });
                }
            } catch (err) {
                console.error("Unable to fetch tickets:", err);
            }
        };

        fetchData();
    }, [filterType, showChart]);

    // Table renderer with title + pagination Mmodal
    const renderTable = (site, rows) => {
        const totalPages = Math.ceil(rows.length / itemsPerPage);
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentRows = rows.slice(indexOfFirstItem, indexOfLastItem);

        return (
            <div key={site} style={{ marginTop: "20px" }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="mb-0">{`${site.toUpperCase()} Tickets`}</h4>
                    {totalPages > 1 && (
                        <Pagination className="tickets-pagination" style={{ "--bs-pagination-active-bg": "#053b00ff", "--bs-pagination-active-border-color": "#053b00ff", "--bs-pagination-color": "#053b00ff" }}>                            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} />

                            {Array.from({ length: totalPages }, (_, i) => (
                                <Pagination.Item
                                    key={i + 1}
                                    active={i + 1 === currentPage}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </Pagination.Item>
                            ))}

                            <Pagination.Next onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                    )}
                </div>

                <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead style={{ background: "#053b00ff", color: "white" }}>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Problem/Issue</th>
                            <th>Status</th>
                            {/* <th>Type</th> */}
                            <th>Assigned To</th>
                            <th>For</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRows.map((t, idx) => (
                            <tr key={idx}>
                                <td>{t.ticket_id}</td>
                                <td>{t.ticket_subject}</td>
                                <td>{t.ticket_status}</td>
                                {/* <td>{t.ticket_type}</td> */}
                                <td>{t.assigned_to || "-"}</td>
                                <td>{t.ticket_for || "-"}</td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center" }}>No tickets found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div style={{ width: "100%", height: "100%" }}>
            {showChart && chartData && (
                <Bar
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: "top" },
                            title: { display: true, text: "Tickets per Site" }
                        },
                        scales: { y: { beginAtZero: true } }
                    }}
                />
            )}

            {!showChart && (
                <>
                    {Object.keys(ticketsBySite).map(site => renderTable(site, ticketsBySite[site]))}
                </>
            )}
        </div>
    );
}
