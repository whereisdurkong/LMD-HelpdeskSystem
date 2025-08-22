import { useEffect, useState } from "react";
import axios from "axios";
import config from "config";

export default function AllData() {
    const [stats, setStats] = useState([]);

    // Helper: calculate difference between two dates
    const calcTAT = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return { diffMs, text: `${diffDays}d ${diffHours}h ${diffMinutes}m` };
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
                const data = res.data || [];

                // Group tickets by subcategory with counts per status and TATs
                const grouped = data.reduce((acc, ticket) => {
                    const subCat = ticket.ticket_SubCategory || "Unknown";
                    const status = ticket.ticket_status?.toLowerCase() || "unknown";

                    if (!acc[subCat]) {
                        acc[subCat] = {
                            subcategory: subCat,
                            total: 0,
                            resolved: 0,
                            closed: 0,
                            open: 0,
                            tatTimes: []
                        };
                    }

                    acc[subCat].total += 1;

                    if (status === "resolved") {
                        acc[subCat].resolved += 1;
                    } else if (status === "closed") {
                        acc[subCat].closed += 1;
                    } else if (status === "open") {
                        acc[subCat].open += 1;
                    }

                    // Calculate TAT only if both dates exist
                    if (ticket.created_at && ticket.resolved_at) {
                        const tat = calcTAT(ticket.created_at, ticket.resolved_at);
                        acc[subCat].tatTimes.push(tat.diffMs);
                    }

                    return acc;
                }, {});

                // Calculate average TAT per subcategory
                const result = Object.values(grouped).map(item => {
                    if (item.tatTimes.length > 0) {
                        const avgMs = item.tatTimes.reduce((a, b) => a + b, 0) / item.tatTimes.length;
                        const diffDays = Math.floor(avgMs / (1000 * 60 * 60 * 24));
                        const diffHours = Math.floor((avgMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const diffMinutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
                        item.avgTAT = `${diffDays}d ${diffHours}h ${diffMinutes}m`;
                    } else {
                        item.avgTAT = "N/A";
                    }
                    return item;
                });

                setStats(result);
            } catch (err) {
                console.log("Unable to fetch Data: ", err);
            }
        };
        fetch();
    }, []);

    // Calculate total row
    const totalRow = stats.reduce(
        (totals, row) => {
            totals.total += row.total;
            totals.resolved += row.resolved;
            totals.closed += row.closed;
            totals.open += row.open;
            return totals;
        },
        { total: 0, resolved: 0, closed: 0, open: 0 }
    );

    return (
        <div style={{ width: "100%", overflowY: "auto", }}>
            <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%", }}>
                <thead style={{ background: '#053b00ff', color: 'white', }}>
                    <tr>
                        <th>Subcategory</th>
                        <th>Total</th>
                        <th>Resolved</th>
                        <th>Closed</th>
                        <th>Open</th>
                        <th>Average TAT</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.map((row, index) => (
                        <tr key={index}>
                            <td>{row.subcategory}</td>
                            <td>{row.total}</td>
                            <td>{row.resolved}</td>
                            <td>{row.closed}</td>
                            <td>{row.open}</td>
                            <td>{row.avgTAT}</td>
                        </tr>
                    ))}

                    {/* Total Row */}
                    <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                        <td>Total</td>
                        <td>{totalRow.total}</td>
                        <td>{totalRow.resolved}</td>
                        <td>{totalRow.closed}</td>
                        <td>{totalRow.open}</td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
