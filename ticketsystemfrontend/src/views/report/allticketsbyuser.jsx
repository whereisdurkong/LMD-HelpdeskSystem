import { useEffect, useState } from "react";
import axios from "axios";
import config from "config";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Pagination } from "react-bootstrap";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AllTicketsByUser({ filterType, showChart = true, onDataReady, location }) {
    const [alluser, setAllUser] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [userTickets, setUserTickets] = useState({});

    const [currentPage, setCurrentPage] = useState({}); // <-- holds pagination state for each user
    const itemsPerPage = 5;

    // ---- date filter
    const isInFilter = (date) => {
        const d = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filterType) {
            case "today":
                return d.toDateString() === today.toDateString();
            case "thisWeek": {
                const firstDay = new Date(today);
                firstDay.setDate(today.getDate() - today.getDay());
                const lastDay = new Date(firstDay);
                lastDay.setDate(firstDay.getDate() + 6);
                return d >= firstDay && d <= lastDay;
            }
            case "lastWeek": {
                const firstDay = new Date(today);
                firstDay.setDate(today.getDate() - today.getDay() - 7);
                const lastDay = new Date(firstDay);
                lastDay.setDate(firstDay.getDate() + 6);
                return d >= firstDay && d <= lastDay;
            }
            case "thisMonth":
                return (
                    d.getFullYear() === today.getFullYear() &&
                    d.getMonth() === today.getMonth()
                );
            case "perMonth":
                return d.getFullYear() === today.getFullYear();
            case "perYear":
                return true;
            case "all":
            default:
                return true;
        }
    };

    // ---- fetch helpdesk users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/authentication/get-all-users`);
                setAllUser(res.data.filter(u => 'helpdesk'.includes(u.emp_tier)));
            } catch (err) {
                console.error("Unable to fetch users:", err);
            }
        };
        fetchUsers();
    }, []);

    // ---- fetch tickets/notes + prepare data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const ticketRes = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                const noteRes = await axios.get(`${config.baseApi}/authentication/get-all-notes`);

                let tickets = ticketRes.data || [];

                // ✅ Filter by location if not "all"
                if (location && location.toLowerCase() !== "all") {
                    tickets = tickets.filter(
                        t => t.assigned_location?.toLowerCase() === location.toLowerCase()
                    );
                }

                // ✅ Then apply the date filter
                const allTickets = tickets.filter(t => isInFilter(t.created_at));
                const notes = noteRes.data || [];

                const labels =
                    filterType === "perMonth"
                        ? ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"]
                        : filterType === "perYear"
                            ? [...new Set(allTickets.map(t => new Date(t.created_at).getFullYear()))].sort()
                            : [filterType === "all" ? "All" : filterType];

                const ticketsPerUser = {};
                const datasets = alluser.map(user => {
                    const name = user.user_name;
                    const noteIds = [
                        ...new Set(notes.filter(n => n.created_by === name).map(n => n.ticket_id))
                    ];

                    const worked = allTickets.filter(ticket => {
                        const collab = ticket.assigned_collaborators
                            ?.split(",").map(s => s.trim()) || [];
                        return (
                            noteIds.includes(ticket.ticket_id) ||
                            collab.includes(name) ||
                            [ticket.assigned_to, ticket.created_by, ticket.updated_by].includes(name)
                        );
                    });

                    ticketsPerUser[name] = worked;

                    let counts;
                    if (filterType === "perMonth") {
                        counts = labels.map((_, i) =>
                            worked.filter(t => new Date(t.created_at).getMonth() === i).length
                        );
                    } else if (filterType === "perYear") {
                        counts = labels.map(y =>
                            worked.filter(t => new Date(t.created_at).getFullYear() === y).length
                        );
                    } else {
                        counts = [worked.length];
                    }

                    return {
                        label: name,
                        data: counts,
                        backgroundColor: `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},0.6)`
                    };
                });

                setUserTickets(ticketsPerUser);
                if (showChart) setChartData({ labels, datasets });
                if (onDataReady) {
                    let summary;

                    if (filterType === "perMonth") {
                        const monthLabels = [
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                        ];

                        const users = Object.keys(ticketsPerUser);

                        summary = monthLabels.map((label, i) => {
                            const row = { month: label };
                            users.forEach(user => {
                                const tickets = ticketsPerUser[user] || [];
                                row[user] = tickets.filter(t => new Date(t.created_at).getMonth() === i).length;
                            });
                            row.total = users.reduce((sum, u) => sum + (row[u] || 0), 0);
                            return row;
                        });
                    } else {
                        summary = Object.entries(ticketsPerUser).map(([username, tickets]) => ({
                            user: username,
                            total: tickets.length
                        }));
                    }


                    onDataReady(summary);
                }

            } catch (err) {
                console.error("Unable to fetch data:", err);
            }
        };
        if (alluser.length) fetchData();
    }, [alluser, filterType, showChart, location]);

    const handlePageChange = (username, page) => {
        setCurrentPage(prev => ({ ...prev, [username]: page }));
    };

    // ---- table rendering
    const renderTables = () => (
        <>
            {Object.entries(userTickets).map(([username, tickets]) => {
                const current = currentPage[username] || 1;
                const totalPages = Math.ceil(tickets.length / itemsPerPage);
                const startIdx = (current - 1) * itemsPerPage;
                const currentTickets = tickets.slice(startIdx, startIdx + itemsPerPage);

                return (
                    <div key={username} style={{ marginBottom: 30 }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h4>
                                Tickets of {username.charAt(0).toUpperCase() + username.slice(1).toLowerCase()}
                            </h4>
                            {/* Pagination controls */}
                            {totalPages > 1 && (
                                <Pagination className="mb-0" style={{ "--bs-pagination-active-bg": "#053b00ff", "--bs-pagination-active-border-color": "#053b00ff", "--bs-pagination-color": "#053b00ff" }}>
                                    <Pagination.First onClick={() => handlePageChange(username, 1)} disabled={current === 1} />
                                    <Pagination.Prev onClick={() => handlePageChange(username, current - 1)} disabled={current === 1} />
                                    {[...Array(totalPages)].map((_, i) => (
                                        <Pagination.Item
                                            key={i + 1}
                                            active={i + 1 === current}
                                            onClick={() => handlePageChange(username, i + 1)}
                                        >
                                            {i + 1}
                                        </Pagination.Item>
                                    ))}
                                    <Pagination.Next onClick={() => handlePageChange(username, current + 1)} disabled={current === totalPages} />
                                    <Pagination.Last onClick={() => handlePageChange(username, totalPages)} disabled={current === totalPages} />
                                </Pagination>
                            )}
                        </div>


                        <table
                            border="1"
                            cellPadding="5"
                            style={{ width: "100%", borderCollapse: "collapse" }}
                        >
                            <thead style={{ background: "#053b00ff", color: "white" }}>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Problem/Issue</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentTickets.map(t => (
                                    <tr key={t.ticket_id}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => window.location.replace(`view-hd-ticket?id=${t.ticket_id}`)}>
                                        <td>{t.ticket_id}</td>
                                        <td>{t.ticket_subject}</td>
                                        <td>{t.ticket_status}</td>
                                        <td>{new Date(t.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {tickets.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: "center" }}>No tickets found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>


                    </div>
                );
            })}
        </>
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
                            legend: { display: true },
                            title: {
                                display: true,
                                text: 'Tickets of Helpdesk Users',
                            }
                        },
                        scales: { y: { beginAtZero: true } }
                    }}
                />
            )}

            {!showChart && renderTables()}
        </div>
    );
}
