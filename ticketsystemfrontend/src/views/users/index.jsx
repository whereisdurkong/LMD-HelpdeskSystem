import { useEffect, useState, useRef } from 'react';
import { Container, Button } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import axios from 'axios';
import config from 'config';

import UserLMD from './users-lmd'
import UserCORP from './users-corp'

import VariableProximity from 'layouts/ReactBits/VariableProximity.jsx'

import AnimatedContent from 'layouts/ReactBits/AnimatedContent';

export default function Users() {
    const containerRef = useRef(null);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        axios.get(`${config.baseApi}/authentication/get-all-users`)
            .then((res) => {
                const justUsers = res.data.filter(user => user.emp_tier === 'user');
                setAllUsers(justUsers);
            })
            .catch((err) => {
                console.error("Error fetching users:", err);
            });
    }, []);

    const getFullName = (user) => {
        if (!user.emp_FirstName || !user.emp_LastName) return '';
        const first = user.emp_FirstName.charAt(0).toUpperCase() + user.emp_FirstName.slice(1).toLowerCase();
        const last = user.emp_LastName.charAt(0).toUpperCase() + user.emp_LastName.slice(1).toLowerCase();
        return `${first} ${last}`;
    };

    const HandleView = (user) => {
        const params = new URLSearchParams({ id: user.user_id })
        window.location.replace(`/ticketsystem/users-view?${params.toString()}`)
    }
    const HandleRegister = () => {

        window.location.replace(`/ticketsystem/register`)
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

                <div
                    style={{
                        maxWidth: "1500px", // match your table width
                        margin: "0 auto",
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }} >
                        <div><div ref={containerRef}>
                            <VariableProximity
                                label={'USERS'}
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
                        </div></div>
                        <Button onClick={HandleRegister}>+ Register</Button>
                    </div>
                    <Tabs
                        defaultActiveKey="lmd"
                        transition={false}
                        id="justify-tab-example"
                        justify
                        style={{
                            borderBottom: "2px solid #ddd",
                        }}
                    >
                        {/* LMD */}
                        <Tab
                            eventKey="lmd"
                            title={
                                <div ref={containerRef}>
                                    <VariableProximity
                                        label={'LMD'}
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
                            <UserLMD />
                        </Tab>
                        {/* LMD */}
                        <Tab
                            eventKey="corp"
                            title={
                                <div ref={containerRef}>
                                    <VariableProximity
                                        label={'CORP'}
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
                            <UserCORP />
                        </Tab>
                    </Tabs>
                </div>
            </AnimatedContent>
        </Container>
    );
}
