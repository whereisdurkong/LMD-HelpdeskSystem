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

export default function LocationTicketsChart({ filterType }) {
    const [chartData, setChartData] = useState(null);

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

                let labels = [];
                let datasets = [];

                if (filterType === "perMonth") {
                    // Show all months Jan–Dec
                    labels = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ];

                    // Group tickets by site and month
                    const siteNames = [...new Set(tickets.map(t => t.assigned_location?.trim() || "Unknown"))];

                    datasets = siteNames.map(site => {
                        const countsPerMonth = labels.map((_, monthIndex) =>
                            tickets.filter(t =>
                                (t.assigned_location?.trim() || "Unknown") === site &&
                                new Date(t.created_at).getMonth() === monthIndex
                            ).length
                        );

                        return {
                            label: site,
                            data: countsPerMonth,
                            backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`
                        };
                    });

                } else {
                    // Default: just show total tickets per site
                    const siteCounts = tickets.reduce((acc, ticket) => {
                        const site = ticket.assigned_location?.trim() || "Unknown";
                        acc[site] = (acc[site] || 0) + 1;
                        return acc;
                    }, {});

                    labels = Object.keys(siteCounts);
                    datasets = [
                        {
                            label: "Tickets",
                            data: Object.values(siteCounts),
                            backgroundColor: "rgba(54, 162, 235, 0.6)",
                            borderColor: "rgba(54, 162, 235, 1)",
                            borderWidth: 1
                        }
                    ];
                }

                setChartData({ labels, datasets });

            } catch (err) {
                console.error("Unable to fetch tickets:", err);
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
                        responsive: true,

                        plugins: {
                            legend: { position: "top" },
                            title: { display: true, text: "Tickets per Site" }
                        },
                        scales: { y: { beginAtZero: true } }
                    }}
                />
            )}
        </div>
    );
}
