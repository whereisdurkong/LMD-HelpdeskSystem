import { useEffect, useState, useRef } from 'react';
import { Table, Container, Button } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import Openticket from './openticket';
import Alltickets from './alltickets';
import Myticket from './myticket';
import History from './history';
import ArchivedTickets from './archivedtickets';
import { useNavigate } from 'react-router';

import VariableProximity from 'layouts/ReactBits/VariableProximity.jsx'

import AnimatedContent from 'layouts/ReactBits/AnimatedContent';

export default function Tickets() {
    const containerRef = useRef(null);
    const [adminaccess, setadminAccess] = useState(false);
    const [hdaccess, sethdAccess] = useState(false);
    const navigate = useNavigate();

    //Getting user role
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user'));
        if (userInfo.emp_tier === 'helpdesk') {
            sethdAccess(true);
        } if (userInfo.emp_tier === 'user' && userInfo.emp_role === 'admin') {
            setadminAccess(true)
        }
    }, [])

    // Naviagte tp create a ticket base on role
    const HandleRegister = () => {
        const userInfo = JSON.parse(localStorage.getItem('user'));

        if (userInfo.emp_tier === 'helpdesk') {
            navigate(`/create-ticket-hd`)
        } else if (userInfo.emp_tier === 'user') {
            navigate(`/create-ticket-user`)
        }
    }


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
            <div style={{ maxWidth: "1500px", margin: "0 auto", }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }} >
                    <div>
                        {/* <div ref={containerRef}>
                            <VariableProximity
                                label={'Support Tickets'}
                                className={'variable-proximity-demo'}
                                style={{
                                    fontSize: '2rem', // responsive font size
                                    color: "#5d3600ff"
                                }}
                                fromFontVariationSettings="'wght' 800, 'opsz' 9"
                                toFontVariationSettings="'wght' 2000, 'opsz' 30"
                                containerRef={containerRef}
                                radius={50}
                                falloff="linear"
                            />
                        </div> */}
                        <h3 style={{
                            fontSize: '2rem', // responsive font size
                            color: "#5d3600ff"
                        }}
                        ><b>Support Tickets</b>
                        </h3>
                    </div>
                    <Button onClick={HandleRegister}>+ Create Ticket</Button>
                </div>
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
                            <div ref={containerRef}>
                                <VariableProximity
                                    label={'My Tickets'}
                                    className={'variable-proximity-demo'}
                                    style={{
                                        fontSize: '1rem', // responsive font size
                                        color: "#5d3600ff"
                                    }}
                                    fromFontVariationSettings="'wght' 800, 'opsz' 9"
                                    toFontVariationSettings="'wght' 2000, 'opsz' 30"
                                    containerRef={containerRef}
                                    radius={50}
                                    falloff="linear"
                                />
                            </div>
                            // <h3 style={{
                            //     fontSize: '1rem', // responsive font size
                            //     color: "#5d3600ff"
                            // }}
                            // ><b>MY TICKETS</b>
                            // </h3>
                        }
                    >
                        <Myticket />
                    </Tab>

                    {hdaccess && (
                        <Tab
                            eventKey="open"
                            title={
                                <div
                                    ref={containerRef}
                                >
                                    <VariableProximity
                                        label={'Open Tickets'}
                                        className={'variable-proximity-demo'}
                                        style={{
                                            fontSize: '1rem', // responsive font size
                                            color: "#5d3600ff"
                                        }}
                                        fromFontVariationSettings="'wght' 800, 'opsz' 9"
                                        toFontVariationSettings="'wght' 2000, 'opsz' 30"
                                        containerRef={containerRef}
                                        radius={50}
                                        falloff="linear"
                                    />
                                </div>
                            }
                        >
                            <Openticket />
                        </Tab>
                    )}

                    {adminaccess && (
                        <Tab
                            eventKey="all"
                            title={
                                <div
                                    ref={containerRef}
                                >
                                    <VariableProximity
                                        label={'All Tickets'}
                                        className={'variable-proximity-demo'}
                                        style={{
                                            fontSize: '1rem', // responsive font size
                                            color: "#5d3600ff"
                                        }}
                                        fromFontVariationSettings="'wght' 800, 'opsz' 9"
                                        toFontVariationSettings="'wght' 2000, 'opsz' 30"
                                        containerRef={containerRef}
                                        radius={50}
                                        falloff="linear"
                                    />
                                </div>
                            }
                        >
                            <Alltickets />
                        </Tab>
                    )}

                    {hdaccess && (
                        <Tab eventKey="all"
                            title={
                                <div
                                    ref={containerRef}
                                >
                                    <VariableProximity
                                        label={'All Tickets'}
                                        className={'variable-proximity-demo'}
                                        style={{
                                            fontSize: '1rem', // responsive font size
                                            color: "#5d3600ff"
                                        }}
                                        fromFontVariationSettings="'wght' 800, 'opsz' 9"
                                        toFontVariationSettings="'wght' 2000, 'opsz' 30"
                                        containerRef={containerRef}
                                        radius={50}
                                        falloff="linear"
                                    />
                                </div>
                            }
                        >
                            <Alltickets />
                        </Tab>
                    )}

                    <Tab
                        eventKey="history"
                        title={
                            <div
                                ref={containerRef}
                            >
                                <VariableProximity
                                    label={'History'}
                                    className={'variable-proximity-demo'}
                                    style={{
                                        fontSize: '1rem', // responsive font size
                                        color: "#5d3600ff"
                                    }}
                                    fromFontVariationSettings="'wght' 800, 'opsz' 9"
                                    toFontVariationSettings="'wght' 2000, 'opsz' 30"
                                    containerRef={containerRef}
                                    radius={50}
                                    falloff="linear"
                                />
                            </div>
                        }
                    >
                        <History />
                    </Tab>

                    {hdaccess && (
                        <Tab
                            eventKey="archived"
                            title={
                                <div
                                    ref={containerRef}
                                >
                                    <VariableProximity
                                        label={'Archived'}
                                        className={'variable-proximity-demo'}
                                        style={{
                                            fontSize: '1rem', // responsive font size
                                            color: "#5d3600ff"
                                        }}
                                        fromFontVariationSettings="'wght' 800, 'opsz' 9"
                                        toFontVariationSettings="'wght' 2000, 'opsz' 30"
                                        containerRef={containerRef}
                                        radius={50}
                                        falloff="linear"
                                    />
                                </div>
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