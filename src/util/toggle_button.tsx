import React, { Component } from 'react'
import { Button } from 'semantic-ui-react'
import {FormattedMessage} from "react-intl";

interface ToggleButtonProps {
    checked: boolean
    onClick?: () => void  // Additional callback prop
}

interface ToggleButtonState {
    active: boolean
}

class ToggleButton extends Component<ToggleButtonProps, ToggleButtonState> {
    state: ToggleButtonState = {
        active: this.props.checked
    }

    render() {
        const { active } = this.state
        const label = active ? (
            <FormattedMessage tagName="label" id="config.toogle.HIDE" defaultMessage="Hide" />
        ) : (
            <FormattedMessage tagName="label" id="config.toogle.SHOW" defaultMessage="Show" />
        )
        return (
            <Button
                toggle
                className="min-width-toggle"
                active={active}
                onClick={this.handleClick}
            >
                {label}
            </Button>
        )
    }

    handleClick = () => {
        // Toggle the active state
        this.setState((prevState) => ({ active: !prevState.active }), () => {
            // Call the additional function after toggling if it exists
            if (this.props.onClick) {
                this.props.onClick()
            }
        })
    }
}

export default ToggleButton
