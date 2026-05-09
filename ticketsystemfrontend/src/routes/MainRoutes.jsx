import { lazy, Suspense } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import MainLayout from 'layouts/MainLayout';
import { Navigate } from 'react-router-dom';
import AllTicketSCAT from 'views/report/allticketSCAT';
import AllDataOwn from 'views/report/alldataown';
import System from 'views/knowledgebase/system';
import SystemArchive from 'views/knowledgebase/systemarchive';
import ViewTicketLogs from 'views/tickets/viewticketlogs';
import EditPassword from 'views/pages/editpassword';
import AddComputer from 'views/assets/add-computer';
import ViewComputers from 'views/assets/view-computers';
import AddLaptop from 'views/assets/add-laptop';
import AddPrinter from 'views/assets/add-printer';
import ReviewComputer from 'views/assets/review-computer';
import ReviewLaptop from 'views/assets/review-laptop';
import ReviewPrinter from 'views/assets/review-printer';
import ArchiveAssets from 'views/assets/archive-index';
import ArchiveReviewComputer from 'views/assets/archive-review-computer';
import ArchiveReviewLaptop from 'views/assets/archive-review-laptop';
import ArchiveReviewPrinter from 'views/assets/archive-review-printer';
import CreateTicketWalkthrough from 'views/tickets/createticket-user-walk';
import CreatePMSUser from 'views/pms/createticket-pms-user';
import PMS from 'views/pms/pms-index';
import ViewPmsTicket from 'views/pms/viewpmsticket';
import ViewHDPmsTicket from 'views/pms/viewpmshdticket';
import PMSReport from 'views/pmsreports';
import PMSbyDept from 'views/pmsreports/pmsbydept';
import PMSbyHD from 'views/pmsreports/pmsbyhd';
import Maintenance from 'views/pages/maintenance';
import PMSList from 'views/pmsreports/pmslist';




// Lazy imports
const Typography = lazy(() => import('../views/ui-elements/basic/BasicTypography'));
const Color = lazy(() => import('../views/ui-elements/basic/BasicColor'));
const FeatherIcon = lazy(() => import('../views/ui-elements/icons/Feather'));
const FontAwesome = lazy(() => import('../views/ui-elements/icons/FontAwesome'));
const MaterialIcon = lazy(() => import('../views/ui-elements/icons/Material'));

const Register = lazy(() => import('views/auth/register'))
const Dashboard = lazy(() => import('views/dashboard'));
const Assets = lazy(() => import('views/assets'))

const Announcements = lazy(() => import('views/announcements'));
const InActiveAnnouncement = lazy(() => import('views/announcements/inactiveannouncement'));

const Knowledgebase = lazy(() => import('views/knowledgebase/knowledgebase'));
const Hardware = lazy(() => import('views/knowledgebase/hardware'));
const AHardware = lazy(() => import('views/knowledgebase/hardwarearchive'));
const Software = lazy(() => import('views/knowledgebase/software'));
const ASoftware = lazy(() => import('views/knowledgebase/softwarearchive'));
const Network = lazy(() => import('views/knowledgebase/network'));
const ANetwork = lazy(() => import('views/knowledgebase/networkarchive'));

const Reports = lazy(() => import('views/report/reports'));
const Test = lazy(() => import('views/pmsreports/pmstatpercategory'));

const Tickets = lazy(() => import('views/tickets'))

const CreateTicket = lazy(() => import('views/tickets/createticket'))
const CreateTicketUser = lazy(() => import('views/tickets/createticket-user'))

const CreateTicketHD = lazy(() => import('views/tickets/createticket-hd'))

const OpenTicket = lazy(() => import('views/tickets/openticket'))
const Alltickets = lazy(() => import('views/tickets/alltickets'));
const ViewTicket = lazy(() => import('views/tickets/viewticket'));
const ViewHDTicket = lazy(() => import('views/tickets/viewhdticket'));
const Myticket = lazy(() => import('views/tickets/myticket'));
const History = lazy(() => import('views/tickets/history'));
const Archived = lazy(() => import('views/tickets/archivedtickets'));

const AllTicketsByUser = lazy(() => import('views/report/allticketsbyuser'));
const AllTicketsBySite = lazy(() => import('views/report/allticketbysite'));
const AllTicketsByStatus = lazy(() => import('views/report/allticketsbystatus'));
const AllTicketsByCategory = lazy(() => import('views/report/getallbycategory'));
const AllTicketbyType = lazy(() => import('views/report/allticketbytype'));
const AllTicketByTAT = lazy(() => import('views/report/allticketbytat'));
const AllData = lazy(() => import('views/report/alldata'));


const SubCatDepartment = lazy(() => import('views/report/subcat_department'));
const SubCatDepartmentTable = lazy(() => import('views/report/subcat_departmentTable'));


const UserDashboard = lazy(() => import('views/dashboard/userdashboard'));
const HDDashboard = lazy(() => import('views/dashboard/hddashboard'));

const Profile = lazy(() => import('views/pages/profile'));
const Users = lazy(() => import('views/users'))

const TATCategory = lazy(() => import('views/report/tatpercategory'));
const UsersView = lazy(() => import('views/users/users-view'))

// Spinner fallback
const LoadingSpinner = (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
    <Spinner animation="border" role="status" variant="primary">
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  </div>
);

// Suspense wrapper
const withSpinner = (Component) => <Suspense fallback={LoadingSpinner}>{Component}</Suspense>;

const RoleAccess = () => {
  console.log
  if (localStorage.getItem("user") === null) {
    return <Navigate to="/" replace />
  } else {
    return <MainLayout />
  }
}

const MainRoutes = {
  path: '/',
  element: <RoleAccess />,
  children: [
    {
      path: '/sample',
      element: withSpinner(<Maintenance />)
    },
    {
      path: '/sample1',
      element: withSpinner(<AllTicketsBySite />)
    },
    {
      path: '/sample2',
      element: withSpinner(<AllTicketsByStatus />)
    },
    {
      path: '/sample3',
      element: withSpinner(<AllTicketsByCategory />)
    },
    {
      path: '/sample4',
      element: withSpinner(<AllTicketbyType />)
    },
    {
      path: '/sample5',
      element: withSpinner(<AllTicketByTAT />)
    },
    {
      path: '/sample6',
      element: withSpinner(<AllTicketSCAT />)
    },
    {
      path: '/sample7',
      element: withSpinner(<AllDataOwn />)
    },
    {
      path: '/1',
      element: withSpinner(<SubCatDepartment />)
    },
    {
      path: '/2',
      element: withSpinner(<SubCatDepartmentTable />)
    },
    {
      path: '/pmslist',
      element: withSpinner(<PMSList />)
    },
    {
      path: '/dashboard',
      element: withSpinner(<Dashboard />)
    },
    {
      path: '/dashboard-user',
      element: withSpinner(<UserDashboard />)
    },
    {
      path: '/dashboard-hd',
      element: withSpinner(<HDDashboard />)
    },
    {
      path: '/register',
      element: withSpinner(<Register />)
    },
    {
      path: '/typography',
      element: withSpinner(<Typography />)
    },
    {
      path: '/color',
      element: withSpinner(<Color />)
    },
    {
      path: '/icons/Feather',
      element: withSpinner(<FeatherIcon />)
    },
    {
      path: '/icons/font-awesome-5',
      element: withSpinner(<FontAwesome />)
    },
    {
      path: '/icons/material',
      element: withSpinner(<MaterialIcon />)
    },
    {
      path: '/create-ticket',
      element: withSpinner(<CreateTicket />)
    },
    {
      path: '/archived-tickets',
      element: withSpinner(<Archived />)
    },
    {
      path: '/create-ticket-user',
      element: withSpinner(<CreateTicketUser />)
    },
    {
      path: '/create-ticket-user-walkthrough',
      element: withSpinner(<CreateTicketWalkthrough />)
    },
    {
      path: '/create-ticket-hd',
      element: withSpinner(<CreateTicketHD />)
    },
    {
      path: '/pms',
      element: withSpinner(<PMS />)
    },
    {
      path: '/create-pms-user',
      element: withSpinner(<CreatePMSUser />)
    },
    {
      path: '/view-pms-user-ticket',
      element: withSpinner(<ViewPmsTicket />)
    },
    {
      path: '/view-pms-hd-ticket',
      element: withSpinner(<ViewHDPmsTicket />)
    },
    {
      path: '/open-ticket',
      element: withSpinner(<OpenTicket />)
    },
    {
      path: '/assets',
      element: withSpinner(<Assets />)
    },
    {
      path: '/archive-assets',
      element: withSpinner(<ArchiveAssets />)
    },
    {
      path: '/assets-add-computer',
      element: withSpinner(<AddComputer />)
    },
    {
      path: '/assets-computer',
      element: withSpinner(<ReviewComputer />)
    },
    {
      path: '/assets-add-laptop',
      element: withSpinner(<AddLaptop />)
    },
    {
      path: '/assets-laptop',
      element: withSpinner(<ReviewLaptop />)
    },
    {
      path: '/assets-add-printer',
      element: withSpinner(<AddPrinter />)
    },
    {
      path: '/assets-printer',
      element: withSpinner(<ReviewPrinter />)
    },
    {
      path: '/assets-archive-computer',
      element: withSpinner(<ArchiveReviewComputer />)
    },
    {
      path: '/assets-archive-laptop',
      element: withSpinner(<ArchiveReviewLaptop />)
    },
    {
      path: '/assets-archive-printer',
      element: withSpinner(<ArchiveReviewPrinter />)
    },

    {
      path: '/announcements',
      element: withSpinner(<Announcements />)
    },
    {
      path: '/inactive-announcements',
      element: withSpinner(<InActiveAnnouncement />)
    },
    {
      path: '/knowledgebase',
      element: withSpinner(<Knowledgebase />)
    },
    {
      path: '/hardware',
      element: withSpinner(<Hardware />)
    },
    {
      path: '/hardwarearchive',
      element: withSpinner(<AHardware />)
    },
    {
      path: '/network',
      element: withSpinner(<Network />)
    },
    {
      path: '/networkarchive',
      element: withSpinner(<ANetwork />)
    },
    {
      path: '/application',
      element: withSpinner(<Software />)
    },
    {
      path: '/applicationarchive',
      element: withSpinner(<ASoftware />)
    },
    {
      path: '/system',
      element: withSpinner(<System />)
    },
    {
      path: '/systemarchive',
      element: withSpinner(<SystemArchive />)
    },
    {
      path: '/test',
      element: withSpinner(<PMSbyHD />)
    },
    {
      path: '/reports',
      element: withSpinner(<Reports />)
    },
    {
      path: '/all-tickets',
      element: withSpinner(<Alltickets />)
    },
    {
      path: '/profile',
      element: withSpinner(<Profile />)
    },
    {
      path: '/edit-password',
      element: withSpinner(<EditPassword />)
    },
    {
      path: '/my-ticket',
      element: withSpinner(<Myticket />)
    },
    {
      path: '/view-ticket',
      element: withSpinner(<ViewTicket />)
    },
    {
      path: '/view-hd-ticket',
      element: withSpinner(<ViewHDTicket />)
    },
    {
      path: '/users',
      element: withSpinner(<Users />)
    },
    {
      path: '/users-view',
      element: withSpinner(<UsersView />)
    },
    {
      path: '/tickets',
      element: <Tickets />
    },
    {
      path: '/history',
      element: <History />
    },
    {
      path: '/pmsreport',
      element: <PMSReport />
    },
    {
      path: '/tatpercategory',
      element: <TATCategory />
    }





  ]
};

export default MainRoutes;
