import { useEffect, useState } from "react";
import { Pagination } from "react-bootstrap";
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

    // ✅ Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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

                ticketres = ticketres.filter(t => t.is_active === true)

                if (location === "lmd") {
                    ticketres = ticketres.filter(t => t.assigned_location === "lmd");
                } else if (location === "corp") {
                    ticketres = ticketres.filter(t => t.assigned_location === "corp");
                }

                ticketres = ticketres.filter(t => isInFilter(t.created_at));
                setTickets(ticketres);
                setCurrentPage(1); // reset page when data changes

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

                    const summary = monthLabels.map((m, i) => ({
                        month: m,
                        incident: incidentCounts[i],
                        request: requestCounts[i],
                        inquiry: inquiryCounts[i],
                    }));

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
                        const summary = [
                            { Type: "Incident", Total: incidentCount },
                            { Type: "Request", Total: requestCount },
                            { Type: "Inquiry", Total: inquiryCount }
                        ];
                        onDataReady(summary);
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

    // ✅ Table renderer with pagination
    const renderTable = (title, rows) => {
        const totalPages = Math.ceil(rows.length / itemsPerPage);
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentRows = rows.slice(indexOfFirstItem, indexOfLastItem);

        return (
            <div style={{ marginTop: "20px" }}>
                {/* Title + Pagination in same row */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="mb-0">{title}</h4>
                    {totalPages > 1 && (
                        <Pagination className="mb-0" style={{ "--bs-pagination-active-bg": "#053b00ff", "--bs-pagination-active-border-color": "#053b00ff", "--bs-pagination-color": "#053b00ff" }}>
                            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} />

                            {Array.from({ length: totalPages }, (_, i) => (
                                <Pagination.Item
                                    key={i + 1}
                                    active={i + 1 === currentPage}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </Pagination.Item>
                            ))}

                            <Pagination.Next onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                    )}
                </div>

                <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: '100%' }}>
                    <thead style={{ background: '#053b00ff', color: 'white' }}>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Problem/Issue</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Assigned To</th>
                            <th>For</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRows.map((t, idx) => (
                            <tr key={idx}
                                style={{ cursor: "pointer" }}
                                onClick={() => window.location.replace(`view-hd-ticket?id=${t.ticket_id}`)}
                            >
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
    };


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
                            scales: { y: { beginAtZero: true } }
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
