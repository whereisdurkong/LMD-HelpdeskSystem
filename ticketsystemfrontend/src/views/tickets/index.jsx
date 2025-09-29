import { useEffect, useState } from 'react';
import { Table, Container } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import Openticket from './openticket';
import Alltickets from './alltickets';
import Myticket from './myticket';
import History from './history';
import ArchivedTickets from './archivedtickets';

export default function Tickets() {

    const [adminaccess, setadminAccess] = useState(false);
    const [hdaccess, sethdAccess] = useState(false);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user'));
        if (userInfo.emp_tier === 'helpdesk') {
            sethdAccess(true);
        } if (userInfo.emp_tier === 'user' && userInfo.emp_role === 'admin') {
            setadminAccess(true)
        }
    }, [])
    return (
        <Container
            fluid
            className="pt-100"
            style={{
                background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)',
                minHeight: '100vh',
                paddingTop: '100px',
            }}
        >
            {/* Outer Center Wrapper */}
            <div
                style={{
                    maxWidth: "1500px", // match your table width
                    margin: "0 auto",
                }}
            >
                <Tabs
                    defaultActiveKey="my"
                    transition={false}
                    id="justify-tab-example"
                    justify
                    style={{
                        borderBottom: "2px solid #ddd",
                    }}
                >
                    <Tab
                        eventKey="my"
                        title={
                            <span style={{ color: "#5d3600ff", fontWeight: "bold" }}>
                                My Tickets
                            </span>
                        }
                    >
                        <Myticket />
                    </Tab>

                    {hdaccess && (
                        <Tab
                            eventKey="open"
                            title={
                                <span style={{ color: "#5d3600ff", fontWeight: "bold" }}>
                                    Open Tickets
                                </span>
                            }
                        >
                            <Openticket />
                        </Tab>
                    )}

                    {adminaccess && (
                        <Tab
                            eventKey="all"
                            title={
                                <span style={{ color: "#5d3600ff", fontWeight: "bold" }}>
                                    All Tickets
                                </span>
                            }
                        >
                            <Alltickets />
                        </Tab>
                    )}

                    {hdaccess && (<Tab eventKey="all" title={<span style={{ color: '#5d3600ff', fontWeight: 'bold' }}>All Tickets</span>} > <Alltickets /> </Tab>)}

                    <Tab
                        eventKey="history"
                        title={
                            <span style={{ color: "#5d3600ff", fontWeight: "bold" }}>
                                History
                            </span>
                        }
                    >
                        <History />
                    </Tab>

                    {hdaccess && (
                        <Tab
                            eventKey="archived"
                            title={
                                <span style={{ color: "#5d3600ff", fontWeight: "bold" }}>
                                    Archived
                                </span>
                            }
                        >
                            <ArchivedTickets />
                        </Tab>
                    )}
                </Tabs>
            </div>
        </Container>
    );
}