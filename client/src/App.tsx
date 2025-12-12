import Layout from './components/layout/Layout';
import { AppRoutes } from './Routes/AppRoutes';

const App = () => {
  return (
    <Layout children={<AppRoutes />}/>
  );
};

export default App;