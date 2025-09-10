import { useEffect, useState } from "react";
import axios from 'axios';
import config from 'config';
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

export default function AllTicketsByUser({ filterType }) {
    const [alluser, setAllUser] = useState([]);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const getalluser = await axios.get(`${config.baseApi}/authentication/get-all-users`);
                const tiers = 'helpdesk';
                setAllUser(getalluser.data.filter(hd => tiers.includes(hd.emp_tier)));
            } catch (err) {
                console.log("Unable to fetch users: ", err);
            }
        };
        fetchUsers();
    }, []);

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
        const FetchData = async () => {
            const ticketRes = await axios.get(`${config.baseApi}/ticket/get-all-ticket`);
            let allTickets = ticketRes.data || [];

            const notesRes = await axios.get(`${config.baseApi}/authentication/get-all-notes`);
            const notes = notesRes.data || [];

            // Filter tickets by selected time range
            allTickets = allTickets.filter(t => isInFilter(t.created_at));

            let labels = [];
            let datasets = [];
            const today = new Date();

            if (filterType === "perMonth") {
                labels = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
            } else if (filterType === "perYear") {
                labels = [...new Set(allTickets.map(t => new Date(t.created_at).getFullYear()))].sort();
            } else if (filterType === "thisMonth") {
                labels = [`${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`];
            } else {
                labels = [filterType === "all" ? "All" : filterType];
            }

            datasets = alluser.map(user => {
                const username = user.user_name;
                const createdNotes = notes.filter(note => note.created_by === username);
                const uniqueIds = [...new Set(createdNotes.map(note => note.ticket_id))];

                const worked = allTickets.filter(ticket => {
                    const isUniqueId = uniqueIds.includes(ticket.ticket_id);
                    const isCollaborator = ticket.assigned_collaborators
                        ?.split(',')
                        .map(name => name.trim())
                        .includes(username);

                    const isAssignedOrCreatedByUser =
                        ticket.assigned_to === username ||
                        ticket.created_by === username ||
                        ticket.updated_by === username;

                    return (
                        isUniqueId ||
                        isCollaborator ||
                        ((isUniqueId || isCollaborator || isAssignedOrCreatedByUser) && ticket.is_reviewed === true)
                    );
                });

                let counts;
                if (filterType === "perMonth") {
                    counts = labels.map((_, monthIndex) =>
                        worked.filter(t => new Date(t.created_at).getMonth() === monthIndex).length
                    );
                } else if (filterType === "perYear") {
                    counts = labels.map(year =>
                        worked.filter(t => new Date(t.created_at).getFullYear() === year).length
                    );
                } else {
                    counts = [worked.length];
                }

                return {
                    label: username,
                    data: counts,
                    backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
                        Math.random() * 255
                    )}, ${Math.floor(Math.random() * 255)}, 0.6)`
                };
            });

            setChartData({ labels, datasets });
        };

        if (alluser.length > 0) {
            FetchData();
        }
    }, [alluser, filterType]);

    if (!chartData) {
        return <div className="bento-loading">Loading chart data...</div>;
    }

    return (
        <Bar
            data={chartData}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: 11
                            }
                        }
                    },
                    title: {
                        display: false // Title handled by parent container
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }}
        />
    );
}

