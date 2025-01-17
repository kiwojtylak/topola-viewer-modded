import React, { useState, useEffect } from 'react';
import { createMedia } from '@artsy/fresnel';
import { Tab, TabProps } from 'semantic-ui-react';

interface SidePanelProps {
    sidePanelTabs: TabProps['panes']; // Tab expects panes to be an array
}

const AppMedia = createMedia({
    breakpoints: {
        large: 1024,
    },
});
const { Media } = AppMedia;

const SidePanel: React.FC<SidePanelProps> = ({ sidePanelTabs }) => {
    const [showSidePanel, setShowSidePanel] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const autoHideDelay = 3000; // Time in milliseconds to auto-hide the panel after inactivity

    useEffect(() => {
        const handleActivity = () => {
            setLastActivity(Date.now());
            setShowSidePanel(true); // Show panel on activity
        };
        // Listen for mouse movement and other activity
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
        };
    }, []);

    useEffect(() => {
        // Auto-hide panel after a delay if not hovered
        const interval = setInterval(() => {
            if (Date.now() - lastActivity > autoHideDelay && !isHovered) {
                setShowSidePanel(false);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [lastActivity, isHovered]);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {showSidePanel ? (
                <Media greaterThanOrEqual="large" className="sidePanel">
                    <Tab panes={sidePanelTabs} />
                </Media>
            ) : null}
        </div>
    );
};

export default SidePanel;
