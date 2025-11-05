import { useEffect, useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import axios from 'axios';
import config from 'config';
import UsersCORP from 'views/users/users-corp';
import ViewComputers from './view-computers';
import Viewlaptop from './view-laptop';
import ViewPrinter from './view-printer';

import { useNavigate } from 'react-router';
import ArchiveViewComputers from './archive-view-computer';
import ArchiveViewlaptop from './archive-view-laptop';
import ArchiveViewPrinter from './archive-view-printer';

export default function ArchiveAssets() {
    const [allUsers, setAllUsers] = useState([]);
    const navigate = useNavigate()

    useEffect(() => {
        axios
            .get(`${config.baseApi}/authentication/get-all-users`)
            .then((res) => {
                const justUsers = res.data.filter(
                    (user) => user.emp_tier === 'user'
                );
                setAllUsers(justUsers);
            })
            .catch((err) => {
                console.error('Error fetching users:', err);
            });
    }, []);

    return (
        <Container
            fluid
            style={{
                background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)',
                paddingTop: '100px',
                minHeight: '100vh',
            }}
        >
            <Row className="justify-content-center">
                <Col xs={12} md={12} lg={11} xl={11}>
                    <div
                        className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3"
                        style={{
                            gap: '10px',
                        }}
                    >
                        <h3 className="text-dark m-0 fw-bold">Archive Assets</h3>

                    </div>

                    <Tabs
                        defaultActiveKey="desktop"
                        transition={false}
                        id="assets-tabs"
                        justify
                        style={{ marginBottom: '0' }} // ✅ remove space
                    >
                        {/* Desktop Tab */}
                        <Tab
                            eventKey="desktop"
                            title={
                                <span style={{ color: '#5d3600ff', fontWeight: 'bold' }}>
                                    Desktop
                                </span>
                            }
                        >
                            {/* ✅ No margin on container */}
                            <div style={{ overflowX: 'auto', width: '100%', marginTop: '0' }}>
                                <ArchiveViewComputers />
                            </div>
                        </Tab>

                        {/* Laptop Tab */}
                        <Tab
                            eventKey="corp"
                            title={
                                <span style={{ color: '#5d3600ff', fontWeight: 'bold' }}>
                                    Laptop
                                </span>
                            }
                        >
                            <div style={{ overflowX: 'auto', width: '100%', marginTop: '0' }}>
                                <ArchiveViewlaptop />
                            </div>
                        </Tab>

                        {/* Printer Tab */}
                        <Tab
                            eventKey="printer"
                            title={
                                <span style={{ color: '#5d3600ff', fontWeight: 'bold' }}>
                                    Printer
                                </span>
                            }
                        >
                            <div style={{ overflowX: 'auto', width: '100%', marginTop: '0' }}>
                                <ArchiveViewPrinter />
                            </div>
                        </Tab>
                    </Tabs>

                </Col>
            </Row>
        </Container>
    );
}
