import { useEffect, useState } from "react";
import axios from "axios";
import config from "config";
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

export default function AllTicketbyType({ filterType }) {
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
                let ticketres = res.data || [];

                // Apply filter
                ticketres = ticketres.filter(t => isInFilter(t.created_at));

                if (filterType === "perMonth") {
                    const monthLabels = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ];

                    // Prepare counts for each month by ticket type
                    const incidentCounts = Array(12).fill(0);
                    const requestCounts = Array(12).fill(0);
                    const inquiryCounts = Array(12).fill(0);

                    ticketres.forEach(ticket => {
                        const monthIndex = new Date(ticket.created_at).getMonth();
                        if (ticket.ticket_type === 'incident') incidentCounts[monthIndex]++;
                        if (ticket.ticket_type === 'request') requestCounts[monthIndex]++;
                        if (ticket.ticket_type === 'inquiry') inquiryCounts[monthIndex]++;
                    });

                    setChartData({
                        labels: monthLabels,
                        datasets: [
                            {
                                label: 'Incident',
                                data: incidentCounts,
                                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                                borderColor: 'rgba(255, 99, 132, 1)',
                                borderWidth: 1
                            },
                            {
                                label: 'Request',
                                data: requestCounts,
                                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 1
                            },
                            {
                                label: 'Inquiry',
                                data: inquiryCounts,
                                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                                borderColor: 'rgba(255, 206, 86, 1)',
                                borderWidth: 1
                            }
                        ]
                    });
                } else {
                    // Default: single totals for all tickets
                    const incidentCount = ticketres.filter(i => i.ticket_type === 'incident').length;
                    const requestCount = ticketres.filter(r => r.ticket_type === 'request').length;
                    const inquiryCount = ticketres.filter(q => q.ticket_type === 'inquiry').length;

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
                }
            } catch (err) {
                console.log('Unable to fetch data: ', err);
            }
        };

        fetch();
    }, [filterType]);

    return (
        <div style={{ width: "100%" }}>
            {chartData && (
                <Bar
                    data={chartData}
                    options={{
                        responsive: true,

                        plugins: {
                            legend: { display: true },
                            title: { display: true, text: filterType === "perMonth" ? "Tickets by Type per Month" : "Tickets by Type" }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }}
                />
            )}
        </div>
    );
}
