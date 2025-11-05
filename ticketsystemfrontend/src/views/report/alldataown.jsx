import axios from "axios";
import config from "config";
import { useEffect, useState } from "react";
import { Pagination } from "react-bootstrap";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
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

export default function AllDataOwn({ filterType, location, showChart = true, helpdesk }) {
    const [userData, setUserData] = useState([]);
    const [workedTickets, setWorkedTickets] = useState([]);
    const [onGoingTickets, setOnGoingTickets] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [percentage, setPercentage] = useState(0);
    const [monthlyPercentages, setMonthlyPercentages] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem("user"));
        setUserData(empInfo);
    }, []);

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
                return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
            case "perMonth":
                return d.getFullYear() === today.getFullYear();
            case "perYear":
            case "all":
            default:
                return true;
        }
    };

    useEffect(() => {
        // if (!userData || !userData.user_name) return;

        const fetchData = async () => {
            try {
                const ticketRes = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                const notesRes = await axios.get(`${config.baseApi}/authentication/get-all-notes`);
                const notes = notesRes.data || [];

                const filteredTickets = ticketRes.data.filter((t) => isInFilter(t.created_at));
                const activeTickets = filteredTickets.filter((t) => t.is_active === true);
                const noteFilter = notes.filter((t) => isInFilter(t.created_at));

                const calluser = helpdesk || userData.user_name
                const a = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                    params: { user_name: calluser }
                })
                const userhd = a.data || userData

                const createdNotes = noteFilter.filter((n) => n.created_by === userhd.user_name);
                const uniqueIds = [...new Set(createdNotes.map((n) => n.ticket_id))];
                console.log(uniqueIds)
                const worked = activeTickets.filter((t) => {
                    const isUniqueId = uniqueIds.includes(t.ticket_id);
                    const collaborators = t.assigned_collaborators?.split(",").map((n) => n.trim()) || [];
                    const isCollaborator = collaborators.includes(userhd.user_name);
                    const isAssignedOrCreatedByUser =
                        t.assigned_to === userhd.user_name ||
                        t.created_by === userhd.user_name ||
                        t.resolved_by === userhd.user_name ||
                        t.updated_by === userhd.user_name;
                    return isUniqueId || isCollaborator || isAssignedOrCreatedByUser;
                });

                setAllTickets(worked);


                const resolvedTickets = worked.filter(
                    (t) => t.ticket_status === "closed" || t.ticket_status === "resolved"
                );
                setWorkedTickets(resolvedTickets);

                const ongoingTickets = worked.filter(
                    (t) => !["closed", "resolved"].includes(t.ticket_status.toLowerCase())
                );
                setOnGoingTickets(ongoingTickets);

                const percent = worked.length > 0 ? ((resolvedTickets.length / worked.length) * 100).toFixed(2) : 0;
                setPercentage(percent);

                if (filterType === "perMonth") {
                    // use all activeTickets from the whole year, not just filtered
                    const yearTickets = ticketRes.data.filter(
                        (t) => new Date(t.created_at).getFullYear() === new Date().getFullYear()
                    );

                    const activeYearTickets = yearTickets.filter((t) => t.is_active === true);

                    // same worked-tickets logic applied on year data
                    const workedYear = activeYearTickets.filter((t) => {
                        const collaborators = t.assigned_collaborators?.split(",").map((n) => n.trim()) || [];
                        const isCollaborator = collaborators.includes(userhd.user_name);
                        const isAssignedOrCreatedByUser =
                            t.assigned_to === userhd.user_name ||
                            t.created_by === userhd.user_name ||
                            t.resolved_by === userhd.user_name ||
                            t.updated_by === userhd.user_name;
                        return isCollaborator || isAssignedOrCreatedByUser;
                    });

                    // compute per-month %
                    const monthly = Array.from({ length: 12 }, (_, i) => {
                        const monthTickets = workedYear.filter((t) => new Date(t.created_at).getMonth() === i);

                        if (monthTickets.length === 0) return { month: i, percent: 0 };

                        const resolved = monthTickets.filter(
                            (t) =>
                                t.ticket_status.toLowerCase() === "closed" ||
                                t.ticket_status.toLowerCase() === "resolved"
                        );

                        const percent = ((resolved.length / monthTickets.length) * 100).toFixed(2);
                        return { month: i, percent: Number(percent) };
                    });

                    setMonthlyPercentages(monthly);
                } else {
                    setMonthlyPercentages([]);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [userData, filterType, helpdesk]);

    const totalPages = Math.ceil(onGoingTickets.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = onGoingTickets.slice(indexOfFirstItem, indexOfLastItem);
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const getColor = (value) => {
        if (value >= 80) return "#27ae60";
        if (value >= 60) return "#2ecc71";
        if (value >= 40) return "#f1c40f";
        if (value >= 20) return "#e67e22";
        return "#e74c3c";
    };

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const chartData = {
        labels: monthNames,
        datasets: [
            {
                label: "Completion %",
                data: monthlyPercentages.map((m) => m.percent),
                backgroundColor: monthlyPercentages.map((m) => getColor(m.percent)),
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: { stepSize: 20 },
                title: { display: true, text: "Completion (%)" },
            },
        },
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: filterType === "perMonth" ? "Tickets Rate per Month" : "Tickets by Rate"
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.parsed.y.toFixed(1)}%`,
                },
            },
        },
    };

    return (
        <>
            {filterType === "perMonth" && showChart ? (
                // Bar chart display
                <div style={{ width: "100%", height: "400px", alignContent: 'center' }}>
                    <Bar data={chartData} options={chartOptions} />
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "40px",
                            marginTop: "10px",
                            flexWrap: "nowrap",
                        }}
                    >
                        <p>All Tickets: <strong>{allTickets.length}</strong></p>
                        <p>On-Going: <strong>{onGoingTickets.length}</strong></p>
                        <p>Resolved: <strong>{workedTickets.length}</strong></p>
                    </div>
                </div>
            ) : (
                // Circular progress display
                showChart && (
                    <div
                        className="text-center mb-3"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            padding: "10px 0",
                        }}
                    >
                        <div style={{ width: "80%", height: "80%", marginBottom: "10px" }}>
                            <CircularProgressbar
                                value={percentage}
                                text={`${percentage}%`}
                                maxValue={100}
                                circleRatio={1}
                                styles={buildStyles({
                                    textColor: "#030302ff",
                                    pathColor: getColor(percentage),
                                    trailColor: "#e0e0e0",
                                    textSize: "18px",
                                })}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "40px",
                                marginTop: "10px",
                                flexWrap: "nowrap",
                            }}
                        >
                            <p>All Tickets: <strong>{allTickets.length}</strong></p>
                            <p>On-Going: <strong>{onGoingTickets.length}</strong></p>
                            <p>Resolved: <strong>{workedTickets.length}</strong></p>
                        </div>
                    </div>
                )
            )}

            {/* TABLE */}
            {!showChart && (
                <div className="table-responsive">
                    <table
                        border="1"
                        cellPadding="5"
                        style={{
                            borderCollapse: "collapse",
                            width: "100%",
                            minWidth: "700px",
                            textAlign: "center",
                        }}
                    >
                        <thead style={{ background: "#053b00ff", color: "white" }}>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Problem/Issue</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Updated By</th>
                                <th>Collaborators</th>
                                <th>Resolved By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((t) => (
                                    <tr key={t.ticket_id}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => window.location.replace(`view-hd-ticket?id=${t.ticket_id}`)}
                                    >
                                        <td>{t.ticket_id}</td>
                                        <td>{t.ticket_subject || "-"}</td>
                                        <td>{t.ticket_status || "-"}</td>
                                        <td>{t.assigned_to || "-"}</td>
                                        <td>{t.updated_by || "-"}</td>
                                        <td>{t.assigned_collaborators || "-"}</td>
                                        <td>{t.resolved_by || "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "10px" }}>
                                        No tickets found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-3">
                            <Pagination
                                style={{
                                    "--bs-pagination-active-bg": "#053b00ff",
                                    "--bs-pagination-active-border-color": "#053b00ff",
                                    "--bs-pagination-color": "#053b00ff",
                                    flexWrap: "wrap",
                                }}
                            >
                                <Pagination.First
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                />
                                <Pagination.Prev
                                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                                    disabled={currentPage === 1}
                                />
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <Pagination.Item
                                        key={i + 1}
                                        active={i + 1 === currentPage}
                                        onClick={() => handlePageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next
                                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                />
                                <Pagination.Last
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                />
                            </Pagination>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
