import axios from "axios";
import { Table, Pagination } from "react-bootstrap";
import config from "config";
import { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AllTicketSCAT({ filterType, location, showChart = true, helpdesk }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [avgScore, setAvgScore] = useState(null);
    const [monthlyScores, setMonthlyScores] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const getSatisfactionScale = (score) => {
        if (score === null) return "No Review";
        const s = Number(score);
        if (s >= 0 && s < 2) return "Very Dissatisfied";
        if (s >= 2 && s < 3) return "Dissatisfied";
        if (s >= 3 && s < 4) return "Neutral";
        if (s >= 4 && s < 5) return "Satisfied";
        if (s === 5) return "Very Satisfied";
        return "";
    };

    const getScoreColor = (score) => {
        if (score === null) return "#bdc3c7";
        const s = Number(score);
        if (s >= 0 && s < 2) return "#e74c3c";
        if (s >= 2 && s < 3) return "#e67e22";
        if (s >= 3 && s < 4) return "#f1c40f";
        if (s >= 4 && s < 5) return "#2ecc71";
        if (s === 5) return "#27ae60";
        return "#bdc3c7";
    };

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
                return true;
            default:
                return true;
        }
    };

    useEffect(() => {
        const empInfo = JSON.parse(localStorage.getItem("user"));
        console.log(filterType)
        const fetchData = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-feedback`);
                const data = res.data || [];

                const filteredTickets = data.filter((t) => isInFilter(String(t.created_at)));

                const calluser = helpdesk || empInfo.user_name

                const a = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                    params: { user_name: calluser }
                })
                const userhd = a.data || empInfo

                const feedback = filteredTickets.filter(
                    (s) => String(s.user_id) === String(userhd.user_id)

                );
                setFeedbacks(feedback);

                if (filterType === "perMonth") {
                    const monthlyData = Array.from({ length: 12 }, (_, i) => {
                        const monthFeedbacks = feedback.filter(
                            (f) => new Date(f.created_at).getMonth() === i
                        );
                        if (monthFeedbacks.length === 0) return { month: i, avg: null };

                        const total = monthFeedbacks.reduce((sum, f) => sum + Number(f.score), 0);
                        const avg = total / monthFeedbacks.length;
                        return { month: i, avg: Number(avg.toFixed(2)) };
                    });
                    setMonthlyScores(monthlyData);
                } else {
                    if (feedback.length > 0) {
                        const total = feedback.reduce((sum, f) => sum + Number(f.score), 0);
                        const avg = total / feedback.length;
                        setAvgScore(avg.toFixed(2));
                    } else {
                        setAvgScore(null);
                    }
                    setMonthlyScores([]);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [filterType, helpdesk]);

    const totalPages = Math.ceil(feedbacks.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = feedbacks.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const progressValue = avgScore ? (Number(avgScore) / 5) * 100 : 0;
    const scoreColor = getScoreColor(avgScore);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // === Chart.js Data ===
    const chartData = {
        labels: monthNames,
        datasets: [
            {
                label: "Average CSAT Score",
                data: monthlyScores.map((m) => m.avg || 0),
                backgroundColor: monthlyScores.map((m) => getScoreColor(m.avg)),
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 5,
                ticks: {
                    stepSize: 1,
                },
                title: {
                    display: true,
                    text: "Score (0–5)",
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context) => `Average: ${context.parsed.y.toFixed(2)}`,
                },
            },
        },
    };

    return (
        <>
            {/* PER MONTH CHART.JS BAR CHART */}
            {filterType === "perMonth" && showChart ? (
                <div style={{ width: "100%", height: "400px", alignContent: 'center' }}>
                    <Bar data={chartData} options={chartOptions} />
                </div>
            ) : (
                // CIRCULAR CHART DISPLAY
                showChart && (
                    <div className="text-center mb-3">
                        <div style={{ width: "100%", height: "100%", margin: "0 auto" }}>
                            <CircularProgressbar
                                value={progressValue}
                                maxValue={100}
                                text={avgScore ? `${avgScore}` : "0"}
                                circleRatio={1}
                                styles={buildStyles({
                                    rotation: 0.75,
                                    strokeLinecap: "round",
                                    pathTransitionDuration: 0.5,
                                    pathColor: scoreColor,
                                    trailColor: "#f0f0f0",
                                    textColor: "#000",
                                    textSize: "24px",
                                })}
                            />
                        </div>
                        <div className="fw-bold mt-2" style={{ color: scoreColor }}>
                            {getSatisfactionScale(avgScore)}
                        </div>
                    </div>
                )
            )}

            {/* TABLE VIEW */}
            {!showChart && (
                <div className="table-responsive">
                    <table
                        border="1"
                        cellPadding="5"
                        style={{
                            borderCollapse: "collapse",
                            width: "100%",
                            minWidth: "600px",
                            textAlign: "center",
                        }}
                    >
                        <thead style={{ background: "#053b00ff", color: "white" }}>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Review</th>
                                <th>Score</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((f) => (
                                    <tr key={f.review_id}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => window.location.replace(`view-hd-ticket?id=${f.ticket_id}`)}
                                    >
                                        <td>{f.ticket_id}</td>
                                        <td className="text-truncate" style={{ maxWidth: "150px" }}>
                                            {f.review}
                                        </td>
                                        <td className="fw-bold text-primary">{f.score}</td>
                                        <td>{new Date(f.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-3 text-muted">
                                        No feedback found
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
