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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function LocationTicketsChart({ filterType, showChart = true }) {
    const [chartData, setChartData] = useState(null);
    const [ticketsBySite, setTicketsBySite] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                let tickets = res.data || [];
                const today = new Date();

                // Filter tickets based on filterType
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

                // Build chart data only if showChart is true
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

    const renderTable = (site, rows) => (
        <div key={site} style={{ marginTop: "20px" }}>
            <h4>{`${site.toUpperCase()}`} Tickets</h4>
            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead style={{ background: "#053b00ff", color: "white" }}>
                    <tr>
                        <th>Ticket ID</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Type</th>
                        <th>Assigned To</th>
                        <th>For</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((t, idx) => (
                        <tr key={idx}>
                            <td>{t.ticket_id}</td>
                            <td>{t.ticket_subject}</td>
                            <td>{t.ticket_status}</td>
                            <td>{t.ticket_type}</td>
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
