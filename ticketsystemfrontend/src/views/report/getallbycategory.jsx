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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function GetAllByCategory({ filterType }) {
    const [chartData, setChartData] = useState(null);

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

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                let tickets = res.data || [];

                // Filter tickets by date range
                tickets = tickets.filter(t => isInFilter(t.created_at));

                if (filterType === "perMonth") {
                    const monthLabels = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ];

                    const hardwareCounts = Array(12).fill(0);
                    const networkCounts = Array(12).fill(0);
                    const softwareCounts = Array(12).fill(0);

                    tickets.forEach(t => {
                        const monthIndex = new Date(t.created_at).getMonth();
                        const category = t.ticket_category?.toLowerCase();
                        if (category === "hardware") hardwareCounts[monthIndex]++;
                        if (category === "network") networkCounts[monthIndex]++;
                        if (category === "software") softwareCounts[monthIndex]++;
                    });

                    setChartData({
                        labels: monthLabels,
                        datasets: [
                            {
                                label: "Hardware",
                                data: hardwareCounts,
                                backgroundColor: "rgba(255, 99, 132, 0.6)",
                                borderColor: "rgba(255, 99, 132, 1)",
                                borderWidth: 1
                            },
                            {
                                label: "Network",
                                data: networkCounts,
                                backgroundColor: "rgba(54, 162, 235, 0.6)",
                                borderColor: "rgba(54, 162, 235, 1)",
                                borderWidth: 1
                            },
                            {
                                label: "Software",
                                data: softwareCounts,
                                backgroundColor: "rgba(75, 192, 192, 0.6)",
                                borderColor: "rgba(75, 192, 192, 1)",
                                borderWidth: 1
                            }
                        ]
                    });
                } else {
                    const hardwareCount = tickets.filter(h => h.ticket_category?.toLowerCase() === "hardware").length;
                    const networkCount = tickets.filter(n => n.ticket_category?.toLowerCase() === "network").length;
                    const softwareCount = tickets.filter(s => s.ticket_category?.toLowerCase() === "software").length;

                    setChartData({
                        labels: ["Hardware", "Network", "Software"],
                        datasets: [
                            {
                                label: "Tickets by Category",
                                data: [hardwareCount, networkCount, softwareCount],
                                backgroundColor: [
                                    "rgba(255, 99, 132, 0.6)",  // Red
                                    "rgba(54, 162, 235, 0.6)", // Blue
                                    "rgba(75, 192, 192, 0.6)"  // Green
                                ],
                                borderColor: [
                                    "rgba(255, 99, 132, 1)",
                                    "rgba(54, 162, 235, 1)",
                                    "rgba(75, 192, 192, 1)"
                                ],
                                borderWidth: 1
                            }
                        ]
                    });
                }
            } catch (err) {
                console.error("Unable to fetch data:", err);
            }
        };
        fetch();
    }, [filterType]);

    return (
        <div style={{ width: "100%" }}>
            {chartData && (
                <Bar
                    data={chartData} style={{ zIndex: 10 }}
                    options={{
                        responsive: true,
                        indexAxis: filterType === "perMonth" ? "y" : "x", // horizontal for perMonth
                        plugins: {
                            legend: { display: true },
                            title: {
                                display: true,
                                text: filterType === "perMonth"
                                    ? "Tickets by Category per Month"
                                    : "Tickets by Category"
                            }
                        },
                        scales: {
                            x: { beginAtZero: true }
                        }
                    }}
                />
            )}
        </div>
    );
}
