import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Theme from './theme';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';

/*const muiTheme = getMuiTheme({
    appBar: {
        //color: 'rgba(128, 128, 128, 0.8)',//''#337ab7',
        height: 48
    },
    refreshIndicator: {
        strokeColor: '#337ab7',
        loadingStrokeColor: '#337ab7'
    }
});*/

injectTapEventPlugin();

ReactDOM.render(
    <MuiThemeProvider theme={createMuiTheme(Theme)}>
        <App />
    </MuiThemeProvider>,

    document.getElementById('root')
);

registerServiceWorker();
