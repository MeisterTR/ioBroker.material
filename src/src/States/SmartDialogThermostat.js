import React, {Component} from 'react';
import Theme from '../theme';
import I18n from '../i18n';
import ThermostatControl from '../basic-controls/react-nest-thermostat';
import Button from '@material-ui/core/Button';

class SmartDialogThermostat extends Component  {
    static buttonBoostStyle = {
        position: 'absolute',
        left: 'calc(50% - 2em)',
        height: '1.3em',
        width: '4em',
        borderRadius: '1em',
        background: 'white',
        border: '1px solid #b5b5b5',
        paddingTop: '0.1em',
        fontSize: '2em',
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: '0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 6px 10px 0px rgba(0, 0, 0, 0.14), 0px 1px 18px 0px rgba(0, 0, 0, 0.12)'
    };
    // expected:
    // startValue
    // actualValue
    // onValueChange
    // onClose
    // objects
    // states
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.startValue || 0,
            boostValue: this.props.boostValue,
            toast: ''
        };
        this.min = this.props.min;
        if (this.min > this.props.actualValue) {
            this.min = this.props.actualValue
        }
        if (this.min > this.props.startValue) {
            this.min = this.props.startValue
        }
        this.max = this.props.max;
        if (this.max < this.props.actualValue) {
            this.max = this.props.actualValue
        }
        if (this.max < this.props.startValue) {
            this.max = this.props.startValue
        }

        this.mouseUpTime = 0;
        this.onMouseMoveBind = this.onMouseMove.bind(this);
        this.onMouseUpBind   = this.onMouseUp.bind(this);
        this.onMouseDownBind = this.onMouseDown.bind(this);

        // disable context menu after long click
        window.addEventListener('contextmenu', SmartDialogThermostat.onContextMenu, false);

        this.refDialog = React.createRef();
        this.refPanel = React.createRef();
        this.svgControl = null;
    }

    static onContextMenu(e) {
        if (!e.shiftKey && !e.ctrlKey) {
            e.preventDefault();
            console.log('Ignore context menu' + e);
            return false;
        }
    }

    componentDidMount() {
        // move this element to the top of body
        this.savedParent = this.refDialog.current.parentElement;
        document.body.appendChild(this.refDialog.current);
        this.svgControl = this.refPanel.current.getElementsByTagName('svg')[0];
        this.svgWidth = this.svgControl.clientWidth;
        this.svgHeight = this.svgControl.clientHeight;
        this.svgCenterX = this.svgWidth / 2;
        this.svgCenterY = this.svgHeight / 2;
        this.svgRadius = this.svgCenterX > this.svgCenterY ? this.svgCenterY : this.svgCenterX;
        this.rect = this.svgControl.getBoundingClientRect();

        this.svgControl.addEventListener('mousedown', this.onMouseDownBind, {passive: false, capture: true});
        this.svgControl.addEventListener('touchstart', this.onMouseDownBind, {passive: false, capture: true});
    }

    componentWillUnmount() {
        this.savedParent.appendChild(this.refDialog.current);
    }

    static roundValue(value, round) {
        round = round || 0.5;
        return Math.round(value / round) * round;
    }
    posToTemp(x, y) {
        let h;
        if (x < 0) {
            h = Math.atan2(y, -x) * 180 / Math.PI;
            if (y > 0) {
                h = 180 - h;
            } else{
                h = 180 - h;
            }
        } else {
            h = Math.atan2(y, x) * 180 / Math.PI;
        }
        h = h * -1;
        if (h < 0) h += 360;
        h = 360 - h;
        // owr sector
        // 60 => 100%
        // 120 => 0%
        // 270 => 50%
        if (h > 60 && h < 90) {
            h = 60;
        }
        if (h > 90 && h < 120) {
            h = 120;
        }
        if (h < 90) {
            h += 360;
        }
        h -= 120;
        h /= 360 - 60;
        return SmartDialogThermostat.roundValue((this.max - this.min) * h + this.min);
    }

    eventToValue(e, checkRadius) {
        let pageY = e.touches ? e.touches[e.touches.length - 1].clientY : e.pageY;
        let pageX = e.touches ? e.touches[e.touches.length - 1].clientX : e.pageX;
        const x = pageX - this.rect.left - this.svgCenterX;
        const y = pageY - this.rect.top - this.svgCenterY;
        if (checkRadius) {
            const radius = Math.sqrt(x * x + y * y);
            if (radius > this.svgRadius * 1.1) {
                return false;
            }
        }

        this.setState({value: this.posToTemp(x, y)});

        return true;
    }

    onMouseMove(e) {
        e.preventDefault();
        e.stopPropagation();
        this.eventToValue(e);
    }

    onMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.eventToValue(e, true)) {
            document.addEventListener('mousemove',  this.onMouseMoveBind,   {passive: false, capture: true});
            document.addEventListener('mouseup',    this.onMouseUpBind,     {passive: false, capture: true});
            document.addEventListener('touchmove',  this.onMouseMoveBind,   {passive: false, capture: true});
            document.addEventListener('touchend',   this.onMouseUpBind,     {passive: false, capture: true});
        } else {
            this.onClose();
        }
    }

    onMouseUp(e) {
        e.preventDefault();
        e.stopPropagation();
        this.mouseUpTime = Date.now();
        document.removeEventListener('mousemove',   this.onMouseMoveBind,   {passive: false, capture: true});
        document.removeEventListener('mouseup',     this.onMouseUpBind,     {passive: false, capture: true});
        document.removeEventListener('touchmove',   this.onMouseMoveBind,   {passive: false, capture: true});
        document.removeEventListener('touchend',    this.onMouseUpBind,     {passive: false, capture: true});

        this.props.onValueChange && this.props.onValueChange(this.state.value);
    }


    onClose() {
        if (!this.mouseUpTime || Date.now() - this.mouseUpTime > 100) {
            window.removeEventListener('contextmenu', SmartDialogThermostat.onContextMenu, false);
            this.props.onClose && this.props.onClose();
        }
    }

    handleToastClose() {
        this.setState({toast: ''});
    }

    onBoostMode() {
        this.props.onBoostToggle && this.props.onBoostToggle(!this.state.boostValue);
        this.setState({boostValue: !this.state.boostValue});
    }

    render() {
        return (<div key={'thermo_dialog'} ref={this.refDialog}
             onClick={this.onClose.bind(this)}
             style={Theme.dialog.back}>
            <div style={Object.assign({}, Theme.dialog.inner, {overflowY: 'hidden'})} ref={this.refPanel}>
                {this.state.boostValue !== null && this.state.boostValue !== undefined ?
                    (<Button variant="contained" color={this.state.boostValue ? 'secondary' : ''} onClick={this.onBoostMode.bind(this)}
                          style={{top: '1.3em'}}
                          className="boost-button">{I18n.t('Boost')}
                    </Button>) : null
                }

                <ThermostatControl
                    minValue={this.min}
                    maxValue={this.max}
                    hvacMode={'heating'}
                    ambientTemperature={this.props.actualValue}
                    targetTemperature={this.state.value}
                />
            </div>
        </div>);
    }
}

export default SmartDialogThermostat;