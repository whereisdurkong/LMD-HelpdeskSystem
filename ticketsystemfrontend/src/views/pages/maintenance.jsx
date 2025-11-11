export default function Maintenance() {

    return (
        <div
            className="auth-wrapper d-flex align-items-center justify-content-center min-vh-100"
            style={{
                background: 'linear-gradient(to bottom, #ffe798ff, #b8860b)',
                padding: '20px',

            }}
        >
            <div
                className="auth-content text-center"
                style={{
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                <div
                >
                    <img src={'SRC/assets/images/maintenance.png'} alt="userimage" className="user-avatar" style={{ width: '700px', height: '500px ', paddingBottom: '10px' }} />
                    <h3><b>THIS PAGE IS UNDER MAINTENANCE.</b></h3>
                </div>

            </div>
        </div>

    )
}