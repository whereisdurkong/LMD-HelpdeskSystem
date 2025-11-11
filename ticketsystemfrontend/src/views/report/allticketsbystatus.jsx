import { useEffect, useState } from "react";
import axios from "axios";
import config from "config";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function AllTicketsByStatus({ filterType }) {
    const [chartData, setChartData] = useState(null);

    //Filter Function
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

    //Get all tickets
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                const revRes = await axios.get(`${config.baseApi}/ticket/get-all-feedback`);
                let tickets = res.data || [];
                const feedback = revRes.data || [];

                // Filter tickets for time range
                tickets = tickets.filter(t => isInFilter(t.created_at));

                if (filterType === "perMonth") {
                    const monthLabels = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ];

                    const reviewedCounts = Array(12).fill(0);
                    const resolvedCounts = Array(12).fill(0);
                    const closedCounts = Array(12).fill(0);
                    const openCounts = Array(12).fill(0);

                    tickets.forEach(ticket => {
                        const monthIndex = new Date(ticket.created_at).getMonth();
                        if (ticket.ticket_status === "resolved") resolvedCounts[monthIndex]++;
                        if (ticket.ticket_status === "closed") closedCounts[monthIndex]++;
                        if (ticket.ticket_status === "open") openCounts[monthIndex]++;
                    });

                    feedback.forEach(fb => {
                        const t = tickets.find(t => t.ticket_id === fb.ticket_id);
                        if (t) {
                            const monthIndex = new Date(t.created_at).getMonth();
                            reviewedCounts[monthIndex]++;
                        }
                    });

                    setChartData({
                        labels: monthLabels,
                        datasets: [
                            {
                                label: "Reviewed",
                                data: reviewedCounts,
                                borderColor: "rgba(255, 206, 86, 1)",
                                backgroundColor: "rgba(255, 206, 86, 0.3)",
                                tension: 0.3
                            },
                            {
                                label: "Resolved",
                                data: resolvedCounts,
                                borderColor: "rgba(13, 127, 0, 1)",
                                backgroundColor: "rgba(30, 150, 0, 0.3)",
                                tension: 0.3
                            },
                            {
                                label: "Closed",
                                data: closedCounts,
                                borderColor: "rgba(54, 162, 235, 1)",
                                backgroundColor: "rgba(54, 162, 235, 0.3)",
                                tension: 0.3
                            },
                            {
                                label: "Open",
                                data: openCounts,
                                borderColor: "rgba(255, 99, 132, 1)",
                                backgroundColor: "rgba(255, 99, 132, 0.3)",
                                tension: 0.3
                            }
                        ]
                    });
                } else {
                    const resolvedCount = tickets.filter(t => t.ticket_status === "resolved").length;
                    const closedCount = tickets.filter(t => t.ticket_status === "closed").length;
                    const openCount = tickets.filter(t => t.ticket_status === "open").length;

                    const uniqueIds = [...new Set(feedback.map(a => a.ticket_id))];
                    const reviewedCount = uniqueIds.length;

                    const labels = ["Reviewed", "Resolved", "Closed", "Open"];
                    setChartData({
                        labels,
                        datasets: [
                            {
                                label: "Tickets",
                                data: [reviewedCount, resolvedCount, closedCount, openCount],
                                borderColor: "rgba(13, 127, 0, 1)",
                                backgroundColor: "rgba(30, 150, 0, 0.5)",
                                tension: 0.3
                            }
                        ]
                    });
                }
            } catch (err) {
                console.log("Unable to fetch data: ", err);
            }
        };
        fetch();
    }, [filterType]);

    return (
        <div style={{ width: "100%" }}>
            {chartData && (
                <Line
                    data={chartData}
                    options={{
                        responsive: true,
                        plugins: {
                            legend: { display: true },
                            title: {
                                display: true,
                                text: filterType === "perMonth"
                                    ? "Tickets by Status per Month"
                                    : "Tickets by Status"
                            },
                        },
                        scales: {
                            y: { beginAtZero: true },
                        },
                    }}
                />
            )}
        </div>
    );
}
