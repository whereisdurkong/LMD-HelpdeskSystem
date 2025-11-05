import './BTN.css';

const BTN = ({ label, onClick }) => {
    return (
        <button className="blob-splash-btn1" onClick={onClick} >
            <span className="blob-splash-bg1" />
            <span className="blob-splash-label1"><b>{label}</b></span>
        </button>
    );
};

export default BTN;
