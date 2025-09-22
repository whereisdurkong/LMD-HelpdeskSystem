import { Container } from 'react-bootstrap';
import img from 'assets/images/maintenance.png'; // ✅ use forward slash

export default function Assets() {
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
            <div
                className="d-flex flex-column justify-content-center align-items-center"
                style={{ minHeight: '80vh' }}
            >
                <img
                    src={img}
                    alt="Maintenance"
                    style={{ maxWidth: '600px', width: '100%', height: 'auto' }}
                />
                <h3 style={{ color: '#042b00ff', marginTop: '0' }}>
                    <b>This Page is Under Maintenance</b>
                </h3>
            </div>
        </Container>
    );
}
