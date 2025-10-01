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

export default function AllTicketbyType({ filterType, showChart = true, location, onDataReady }) {
    const [chartData, setChartData] = useState(null);
    const [tickets, setTickets] = useState([]);

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

                if (location === "lmd") {
                    ticketres = ticketres.filter(t => t.assigned_location === "lmd");
                } else if (location === "corp") {
                    ticketres = ticketres.filter(t => t.assigned_location === "corp");
                }

                ticketres = ticketres.filter(t => isInFilter(t.created_at));
                setTickets(ticketres);

                if (filterType === "perMonth") {
                    const monthLabels = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ];
                    const incidentCounts = Array(12).fill(0);
                    const requestCounts = Array(12).fill(0);
                    const inquiryCounts = Array(12).fill(0);

                    ticketres.forEach(ticket => {
                        const monthIndex = new Date(ticket.created_at).getMonth();
                        if (ticket.ticket_type === 'incident') incidentCounts[monthIndex]++;
                        if (ticket.ticket_type === 'request') requestCounts[monthIndex]++;
                        if (ticket.ticket_type === 'inquiry') inquiryCounts[monthIndex]++;
                    });

                    // ✅ Prepare summary
                    const summary = monthLabels.map((m, i) => ({
                        month: m,
                        incident: incidentCounts[i],
                        request: requestCounts[i],
                        inquiry: inquiryCounts[i],
                    }));

                    // send summary to parent
                    onDataReady?.(summary);

                    setChartData({
                        labels: monthLabels,
                        datasets: [
                            { label: 'Incident', data: incidentCounts, backgroundColor: 'rgba(255, 99, 132, 0.5)' },
                            { label: 'Request', data: requestCounts, backgroundColor: 'rgba(54, 162, 235, 0.5)' },
                            { label: 'Inquiry', data: inquiryCounts, backgroundColor: 'rgba(255, 206, 86, 0.5)' }
                        ]
                    });
                } else {
                    const incidentCount = ticketres.filter(i => i.ticket_type === 'incident').length;
                    const requestCount = ticketres.filter(r => r.ticket_type === 'request').length;
                    const inquiryCount = ticketres.filter(q => q.ticket_type === 'inquiry').length;



                    if (onDataReady) {
                        if (filterType === "perMonth") {
                            const monthLabels = [
                                "January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"
                            ];
                            const summary = monthLabels.map((m, i) => ({
                                month: m,
                                incident: incidentCount[i],
                                request: requestCount[i],
                                inquiry: inquiryCount[i],
                                total: incidentCount[i] + requestCount[i] + inquiryCount[i]
                            }));
                            onDataReady(summary);
                        } else {
                            const summary = [
                                { Type: "Incident", Total: incidentCount },
                                { Type: "Request", Total: requestCount },
                                { Type: "Inquiry", Total: inquiryCount }
                            ];
                            onDataReady(summary);
                        }
                    }

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
                                ]
                            }
                        ]
                    });
                }

            } catch (err) {
                console.log('Unable to fetch data: ', err);
            }
        };

        fetch();
    }, [filterType, location]);
    const renderTable = (title, rows) => (
        <div style={{ marginTop: "20px" }}>
            <h4>{title}</h4>
            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: '100%' }}>
                <thead style={{ background: '#053b00ff', color: 'white' }}>
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
        <div style={{ width: '100%', height: '100%' }}>
            {showChart ? (
                chartData && (
                    <Bar
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: true },
                                title: {
                                    display: true,
                                    text: filterType === "perMonth" ? "Tickets by Type per Month" : "Tickets by Type"
                                }
                            },
                            scales: {
                                y: { beginAtZero: true }
                            }
                        }}
                    />
                )
            ) : (
                <>
                    {renderTable("Incident Tickets", tickets.filter(t => t.ticket_type === "incident"))}
                    {renderTable("Request Tickets", tickets.filter(t => t.ticket_type === "request"))}
                    {renderTable("Inquiry Tickets", tickets.filter(t => t.ticket_type === "inquiry"))}
                </>
            )}
        </div>
    );
}
