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

export default function GetAllByCategory({ filterType, showChart = true }) {
    const [chartData, setChartData] = useState(null);
    const [hardwareTickets, setHardwareTickets] = useState([]);
    const [networkTickets, setNetworkTickets] = useState([]);
    const [softwareTickets, setSoftwareTickets] = useState([]);

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

                // Separate into categories
                const hardware = tickets.filter(t => t.ticket_category?.toLowerCase() === "hardware");
                const network = tickets.filter(t => t.ticket_category?.toLowerCase() === "network");
                const software = tickets.filter(t => t.ticket_category?.toLowerCase() === "software");

                setHardwareTickets(hardware);
                setNetworkTickets(network);
                setSoftwareTickets(software);

                // Chart setup
                if (showChart) {
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
                                { label: "Hardware", data: hardwareCounts, backgroundColor: "rgba(255,99,132,0.6)" },
                                { label: "Network", data: networkCounts, backgroundColor: "rgba(54,162,235,0.6)" },
                                { label: "Software", data: softwareCounts, backgroundColor: "rgba(75,192,192,0.6)" }
                            ]
                        });
                    } else {
                        setChartData({
                            labels: ["Hardware", "Network", "Software"],
                            datasets: [
                                {
                                    label: "Tickets by Category",
                                    data: [hardware.length, network.length, software.length],
                                    backgroundColor: [
                                        "rgba(255, 99, 132, 0.6)",
                                        "rgba(54, 162, 235, 0.6)",
                                        "rgba(75, 192, 192, 0.6)"
                                    ]
                                }
                            ]
                        });
                    }
                }
            } catch (err) {
                console.error("Unable to fetch data:", err);
            }
        };
        fetch();
    }, [filterType, showChart]);

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
                    {renderTable("Software Tickets", softwareTickets)}
                </>
            )}
        </div>
    );
}
