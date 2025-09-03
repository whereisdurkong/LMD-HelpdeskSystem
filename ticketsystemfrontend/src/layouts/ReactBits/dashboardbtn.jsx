import './dashboardbtn.css';

const Dashboardbtn = ({ label = 'Create A Ticket', onClick }) => {
    return (
        <button className="blob-splash-btn mt-4" onClick={onClick} >
            <span className="blob-splash-bg" />
            <span className="blob-splash-label"><b>{label}</b></span>
        </button>
    );
};

export default Dashboardbtn;
