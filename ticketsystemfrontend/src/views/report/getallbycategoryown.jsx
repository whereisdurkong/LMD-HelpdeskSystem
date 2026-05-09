import { useEffect, useState } from "react";
import { Pagination } from "react-bootstrap";
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
import { useNavigate } from 'react-router';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function GetAllByCategoryOwn({ filterType, showChart = true, location, onDataReady, helpdesk }) {
    const [chartData, setChartData] = useState(null);
    const [hardwareTickets, setHardwareTickets] = useState([]);
    const [networkTickets, setNetworkTickets] = useState([]);
    const [applicationTickets, setapplicationTickets] = useState([]);
    const [systemTickets, setSystemTickets] = useState([]);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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
                const empInfo = JSON.parse(localStorage.getItem("user"));
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                let tickets = res.data || [];

                const calluser = helpdesk || empInfo.user_name

                const a = await axios.get(`${config.baseApi}/authentication/get-by-username`, {
                    params: { user_name: calluser }
                })
                const userhd = a.data || empInfo

                // Filter tickets by date range
                tickets = tickets.filter(t => isInFilter(t.created_at) && t.assigned_to === userhd.user_name);

                // Separate into categories
                const hardware = tickets.filter(t => t.ticket_category?.toLowerCase() === "hardware");
                const network = tickets.filter(t => t.ticket_category?.toLowerCase() === "network");
                const application = tickets.filter(t => t.ticket_category?.toLowerCase() === "application");
                const system = tickets.filter(t => t.ticket_category?.toLowerCase() === "system");

                setHardwareTickets(hardware);
                setNetworkTickets(network);
                setapplicationTickets(application);
                setSystemTickets(system);

                // Chart setup
                if (showChart) {
                    if (filterType === "perMonth") {
                        const monthLabels = [
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                        ];

                        const hardwareCounts = Array(12).fill(0);
                        const networkCounts = Array(12).fill(0);
                        const applicationCounts = Array(12).fill(0);
                        const systemCounts = Array(12).fill(0);

                        tickets.forEach(t => {
                            const monthIndex = new Date(t.created_at).getMonth();
                            const category = t.ticket_category?.toLowerCase();
                            if (category === "hardware") hardwareCounts[monthIndex]++;
                            if (category === "network") networkCounts[monthIndex]++;
                            if (category === "application") applicationCounts[monthIndex]++;
                            if (category === "system") systemCounts[monthIndex]++;
                        });

                        setChartData({
                            labels: monthLabels,
                            datasets: [
                                { label: "Hardware", data: hardwareCounts, backgroundColor: "rgba(255,99,132,0.6)" },
                                { label: "Network", data: networkCounts, backgroundColor: "rgba(54,162,235,0.6)" },
                                { label: "Application", data: applicationCounts, backgroundColor: "rgba(75,192,192,0.6)" },
                                { label: "System", data: systemCounts, backgroundColor: "rgba(75,192,192,0.6)" }
                            ]
                        });
                        // Send summary to parent
                        if (onDataReady) {
                            const summary = monthLabels.map((m, i) => ({
                                month: m,
                                category: "All",
                                hardware: hardwareCounts[i],
                                network: networkCounts[i],
                                application: applicationCounts[i],
                                system: systemCounts[i],
                                total: hardwareCounts[i] + networkCounts[i] + applicationCounts[i] + systemCounts[i]
                            }));
                            onDataReady(summary);
                        }
                    } else {
                        setChartData({
                            labels: ["Hardware", "Network", "Application", "System"],
                            datasets: [
                                {
                                    label: "Tickets by Category",
                                    data: [hardware.length, network.length, application.length, system.length],
                                    backgroundColor: [
                                        "rgba(255, 99, 132, 0.6)",
                                        "rgba(54, 162, 235, 0.6)",
                                        "rgba(75, 192, 192, 0.6)",
                                        "rgba(136, 141, 64, 0.6)"
                                    ]
                                }
                            ]
                        });

                        if (onDataReady) {
                            const summary = [
                                { category: "Hardware", count: hardware.length },
                                { category: "Network", count: network.length },
                                { category: "application", count: application.length },
                                { category: "System", count: system.length }
                            ];
                            onDataReady(summary);
                        }
                    }
                }
            } catch (err) {
                console.error("Unable to fetch data:", err);
            }
        };
        fetch();
    }, [filterType, showChart, location, helpdesk]);

    //Render table
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
                            {/* <th>Type</th> */}
                            <th>Assigned To</th>
                            <th>For</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRows.map((t, idx) => (
                            <tr key={idx}
                                style={{ cursor: "pointer" }}
                                onClick={() => navigate(`view-hd-ticket?id=${t.ticket_id}`)}
                            >
                                <td>{t.ticket_id}</td>
                                <td>{t.ticket_subject}</td>
                                <td>{t.ticket_status}</td>
                                {/* <td>{t.ticket_type}</td> */}
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
            {showChart && chartData && (
                <Bar
                    data={chartData}
                    style={{ zIndex: 10 }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: filterType === "perMonth" ? "y" : "x",
                        plugins: {
                            legend: { display: true },
                            title: {
                                display: true,
                                text: filterType === "perMonth"
                                    ? "Tickets by Category per Month"
                                    : "Tickets by Category"
                            }
                        },
                        scales: { x: { beginAtZero: true } }
                    }}
                />
            )}

            {!showChart && (
                <>
                    {renderTable("Hardware Tickets", hardwareTickets)}
                    {renderTable("Network Tickets", networkTickets)}
                    {renderTable("Application Tickets", applicationTickets)}
                    {renderTable("System Tickets", systemTickets)}
                </>
            )}
        </div>
    );
}
