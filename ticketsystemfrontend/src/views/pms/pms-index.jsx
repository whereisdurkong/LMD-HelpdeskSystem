import { useEffect, useState, useRef } from 'react';
import { Table, Container, Button } from 'react-bootstrap';
import axios from 'axios';
import config from 'config';

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import Openticket from '../tickets/openticket';
import Alltickets from '../tickets/alltickets';
import Myticket from '../tickets/myticket';
import History from '../tickets/history';
import ArchivedTickets from '../tickets/archivedtickets';
import MyPmsTicket from './mypmsticket';
import OpenPMSticket from './openpmsticket';
import AllPMSTicket from './allpmsticket';
import AllPMStickets from './allpmsticket';
import HistoryPMSTicket from './historypmsticket';
import ArchivePMSTicket from './archivedpmsticket';
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';
import { useNavigate } from 'react-router';

import VariableProximity from 'layouts/ReactBits/VariableProximity.jsx'
export default function PMS() {
    const containerRef = useRef(null);
    const [adminaccess, setadminAccess] = useState(false);
    const [hdaccess, sethdAccess] = useState(false);
    const navigate = useNavigate();

    //Setting access
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('user'));
        if (userInfo.emp_tier === 'helpdesk') {
            sethdAccess(true);
        } if (userInfo.emp_tier === 'user' && userInfo.emp_role === 'admin') {
            setadminAccess(true)
        }
    }, [])
    // navigate to create a user
    const handleView = () => {
        navigate('/create-pms-user');
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
            <div
                style={{
                    maxWidth: "1500px", // match your table width
                    margin: "0 auto",
                }}
            >

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }} >
                    <div>
                        <div ref={containerRef}>
                            {/* <VariableProximity
                                label={'Preventive Maintenance Schedule Tickets'}
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
                            /> */}
                            <h3 style={{
                                fontSize: '2rem', // responsive font size
                                color: "#5d3600ff"
                            }}
                            ><b>Preventive Maintenance Schedule Tickets</b>
                            </h3>
                        </div>
                    </div>
                    <Button onClick={handleView}>+ Create Ticket</Button>
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
                                    label={'My PMS Tickets'}
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
                        <MyPmsTicket />
                    </Tab>

                    {hdaccess && (
                        <Tab
                            eventKey="open"
                            title={
                                <div ref={containerRef}>
                                    <VariableProximity
                                        label={'Open PMS Tickets'}
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
                            <OpenPMSticket />
                        </Tab>
                    )}

                    {adminaccess && (
                        <Tab
                            eventKey="all"
                            title={
                                <div ref={containerRef}>
                                    <VariableProximity
                                        label={'All PMS Tickets'}
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
                            <AllPMStickets />
                        </Tab>
                    )}

                    {hdaccess && (<Tab eventKey="all" title={<div ref={containerRef}>
                        <VariableProximity
                            label={'All PMS Tickets'}
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
                    </div>} > <AllPMStickets /> </Tab>)}

                    <Tab
                        eventKey="history"
                        title={
                            <div ref={containerRef}>
                                <VariableProximity
                                    label={'History PMS Tickets'}
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
                        <HistoryPMSTicket />
                    </Tab>

                    {hdaccess && (
                        <Tab
                            eventKey="archived"
                            title={
                                <div ref={containerRef}>
                                    <VariableProximity
                                        label={'Archived PMS Tickets'}
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
                            <ArchivePMSTicket />
                        </Tab>
                    )}
                </Tabs>
            </div>

        </Container>
    );
}