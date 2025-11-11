import { useEffect, useState, useRef } from 'react';
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
import AnimatedContent from 'layouts/ReactBits/AnimatedContent';

import VariableProximity from 'layouts/ReactBits/VariableProximity.jsx'
import FeatherIcon from 'feather-icons-react';


export default function Assets() {

    const containerRef = useRef(null);
    const [allUsers, setAllUsers] = useState([]);
    const navigate = useNavigate()

    //Fetch all users
    useEffect(() => {
        try {
            axios.get(`${config.baseApi}/authentication/get-all-users`)
                .then((res) => {
                    const justUsers = res.data.filter(
                        (user) => user.emp_tier === 'user'
                    );
                    setAllUsers(justUsers);
                })
                .catch((err) => {
                    console.error('Error fetching users:', err);
                });
        } catch (err) {
            console.log('Unable to fetch all users: ', err)
        }

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

            <AnimatedContent
                distance={100}
                direction="vertical"
                reverse={true}
                duration={0.8}
                ease="power3.out"
                initialOpacity={0}
                animateOpacity
                scale={1.0}
                threshold={0.1}
                delay={0}
            >
                <Row className="justify-content-center">
                    <Col xs={12} md={12} lg={11} xl={11}>
                        <div
                            className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3"
                            style={{
                                gap: '10px',
                            }}
                        >
                            <div>
                                {/* <div ref={containerRef}>
                                    <VariableProximity
                                        label={'Assets'}
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
                                ><b>Assets</b>
                                </h3>
                            </div>
                            <Button
                                onClick={() => navigate('/archive-assets')}
                            ><FeatherIcon icon="archive" />
                                Archive
                            </Button>


                        </div>

                        <Tabs
                            defaultActiveKey="desktop"
                            transition={false}
                            id="assets-tabs"
                            justify
                            style={{ marginBottom: '0' }} // remove space
                        >
                            {/* Desktop Tab */}
                            <Tab
                                eventKey="desktop"
                                title={
                                    <div ref={containerRef}>
                                        <VariableProximity
                                            label={'Desktop'}
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
                                {/* No margin on container */}
                                <div style={{ overflowX: 'auto', width: '100%', marginTop: '0' }}>
                                    <ViewComputers />
                                </div>
                            </Tab>

                            {/* Laptop Tab */}
                            <Tab
                                eventKey="corp"
                                title={
                                    <div ref={containerRef}>
                                        <VariableProximity
                                            label={'Laptop'}
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
                                <div style={{ overflowX: 'auto', width: '100%', marginTop: '0' }}>
                                    <Viewlaptop />
                                </div>
                            </Tab>

                            {/* Printer Tab */}
                            <Tab
                                eventKey="printer"
                                title={
                                    <div ref={containerRef}>
                                        <VariableProximity
                                            label={'Printer'}
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
                                <div style={{ overflowX: 'auto', width: '100%', marginTop: '0' }}>
                                    <ViewPrinter />
                                </div>
                            </Tab>
                        </Tabs>

                    </Col>
                </Row>
            </AnimatedContent>
        </Container >
    );
}
