import ReactDOM from 'react-dom/client';
import 'semantic-ui-css/semantic.min.css';
import './index.css';
import { makeAuthRouting } from './routing';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(makeAuthRouting());
