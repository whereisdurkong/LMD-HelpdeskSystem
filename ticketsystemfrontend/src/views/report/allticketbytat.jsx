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

export default function AllTicketByTAT({ filterType }) {
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
        const fetchData = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                let tickets = res.data || [];

                // Filter tickets with both created_at and resolved_at
                tickets = tickets.filter(t => t.created_at && t.resolved_at && isInFilter(t.created_at));

                // Group by subcategory and calculate average TAT (hours)
                const subCategoryMap = {};
                tickets.forEach(ticket => {
                    const createdDate = new Date(ticket.created_at);
                    const resolvedDate = new Date(ticket.resolved_at);
                    const diffMinutesTotal = Math.floor((resolvedDate - createdDate) / (1000 * 60));

                    if (!subCategoryMap[ticket.ticket_SubCategory]) {
                        subCategoryMap[ticket.ticket_SubCategory] = { totalMinutes: 0, count: 0 };
                    }
                    subCategoryMap[ticket.ticket_SubCategory].totalMinutes += diffMinutesTotal;
                    subCategoryMap[ticket.ticket_SubCategory].count += 1;
                });

                const labels = Object.keys(subCategoryMap);
                const data = labels.map(subCat => {
                    const stats = subCategoryMap[subCat];
                    const avgMinutes = stats.totalMinutes / stats.count;
                    return parseFloat((avgMinutes / 60).toFixed(2)); // hours
                });

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: "Average TAT (hours)",
                            data,
                            backgroundColor: "rgba(54, 162, 235, 0.6)",
                            borderColor: "rgba(54, 162, 235, 1)",
                            borderWidth: 1
                        }
                    ]
                });
            } catch (err) {
                console.error("Error fetching TAT data:", err);
            }
        };

        fetchData();
    }, [filterType]);

    return (
        <div style={{ width: "100%" }}>
            {chartData && (
                <Bar
                    data={chartData}
                    options={{
                        indexAxis: "y", // horizontal bars
                        responsive: true,
                        plugins: {
                            legend: { display: true },
                            title: { display: true, text: "Average Turnaround Time by Sub-Category" }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                title: { display: true, text: "Hours" }
                            }
                        }
                    }}
                />
            )}
        </div>
    );
}
