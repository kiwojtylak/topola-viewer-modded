import {Dropdown, Icon, Menu} from 'semantic-ui-react';
import {FormattedMessage} from 'react-intl';
import {Media} from '../util/media';
import {MenuType} from './menu_item';
import {SearchBar} from './search';
import {UploadMenu} from './upload_menu';
import {UrlMenu} from './url_menu';
import {useHistory, useLocation} from 'react-router';
import {IndiInfo, JsonGedcomData} from '../lib/topola';
import {useRef, useState} from "react";
import {ConvertCSVMenu} from "./convert_menu";

enum ScreenSize {
    LARGE,
    SMALL,
}

interface EventHandlers {
    onSelection: (indiInfo: IndiInfo) => void;
    onDownloadPdf: () => void;
    onDownloadPng: () => void;
    onDownloadSvg: () => void;
    onDownloadGedcom: () => void;
    onCenterView: () => void;
}

interface Props {
    showingChart: boolean;
    data?: JsonGedcomData;
    standalone: boolean;
    eventHandlers: EventHandlers;
}

export function TopBar(props: Props) {
    useHistory();
    useLocation();

    function FileMenus(screenSize: ScreenSize) {
        const [menuOpen, setMenuOpen] = useState(false);
        const cooldown = useRef(false);

        // Debug handler
        const toggleMenu = (state: boolean) => {
            if (!state) {
                cooldown.current = true;
                setMenuOpen(false);
                setTimeout(() => {
                    cooldown.current = false;
                }, 150);
            } else if (!cooldown.current) {
                setMenuOpen(true);
            }
        };

        // Don't show "open" menus in non-standalone mode.
        if (!props.standalone) {
            return null;
        }
        switch (screenSize) {
            case ScreenSize.LARGE:
                return (
                    <Dropdown
                        onOpen={() => toggleMenu(true)}
                        onClose={() => toggleMenu(false)}
                        open={menuOpen}
                        trigger={
                            <div>
                                <Icon name="folder open"/>
                                <FormattedMessage id="menu.open" defaultMessage="Open"/>
                            </div>
                        }
                        className="item">
                        <Dropdown.Menu onClick={() => toggleMenu(false)}>
                            <UploadMenu menuType={MenuType.Dropdown} {...props} />
                            <UrlMenu menuType={MenuType.Dropdown} {...props} />
                            <ConvertCSVMenu menuType={MenuType.Dropdown} {...props} />
                        </Dropdown.Menu>
                    </Dropdown>
                );
            case ScreenSize.SMALL:
                return (
                    <>
                        <UploadMenu menuType={MenuType.Dropdown} {...props} />
                        <UrlMenu menuType={MenuType.Dropdown} {...props} />
                        {/*<ConvertCSVMenu menuType={MenuType.Dropdown} {...props} />*/}
                    </>
                );
        }
    }

    function ChartMenus(screenSize: ScreenSize) {
        if (!props.showingChart) {
            return null;
        }
        switch (screenSize) {
            case ScreenSize.LARGE:
                return (
                    <>
                        <Dropdown
                            trigger={
                                <div>
                                    <Icon name="download"/>
                                    <FormattedMessage id="menu.download" defaultMessage="Download"/>
                                </div>
                            }
                            className="item">
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={props.eventHandlers.onDownloadPdf}>
                                    <FormattedMessage id="menu.download_pdf" defaultMessage="Download PDF"/>
                                </Dropdown.Item>
                                <Dropdown.Item onClick={props.eventHandlers.onDownloadPng}>
                                    <FormattedMessage id="menu.download_png" defaultMessage="Download PNG"/>
                                </Dropdown.Item>
                                <Dropdown.Item onClick={props.eventHandlers.onDownloadSvg}>
                                    <FormattedMessage id="menu.download_svg" defaultMessage="Download SVG"/>
                                </Dropdown.Item>
                                <Dropdown.Divider/>
                                <Dropdown.Item onClick={props.eventHandlers.onDownloadGedcom}>
                                    <FormattedMessage id="menu.download_gedcom" defaultMessage="Download GEDCOM"/>
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>

                        <Menu.Item onClick={props.eventHandlers.onCenterView}>
                            <Icon name="target" />
                            <FormattedMessage id="menu.view" defaultMessage="Center view" />
                        </Menu.Item>

                        <Menu.Menu position="right">
                            <SearchBar
                                data={props.data!}
                                onSelection={props.eventHandlers.onSelection}
                                {...props}
                            />
                        </Menu.Menu>
                    </>
                );
            case ScreenSize.SMALL:
                if (!props.showingChart) {
                    return (
                        <>
                            <UrlMenu menuType={MenuType.Dropdown} {...props} />
                        </>
                    );
                } else {
                    return (
                        <>
                            <Dropdown.Divider/>
                            <Dropdown.Item onClick={props.eventHandlers.onDownloadPdf}>
                                <Icon name="download"/>
                                <FormattedMessage id="menu.download_pdf" defaultMessage="Download PDF"/>
                            </Dropdown.Item>
                            <Dropdown.Item onClick={props.eventHandlers.onDownloadPng}>
                                <Icon name="download"/>
                                <FormattedMessage id="menu.download_png" defaultMessage="Download PNG"/>
                            </Dropdown.Item>
                            <Dropdown.Item onClick={props.eventHandlers.onDownloadSvg}>
                                <Icon name="download"/>
                                <FormattedMessage id="menu.download_svg" defaultMessage="Download SVG"/>
                            </Dropdown.Item>
                            <Dropdown.Divider/>
                            <Dropdown.Item onClick={props.eventHandlers.onDownloadGedcom}>
                                <FormattedMessage id="menu.download_gedcom" defaultMessage="Download GEDCOM"/>
                            </Dropdown.Item>
                            <Dropdown.Divider/>
                            <Menu.Item onClick={props.eventHandlers.onCenterView}>
                                <Icon name="eye" />
                                <FormattedMessage id="menu.view" defaultMessage="Center view" />
                            </Menu.Item>
                        </>
                    );
                }
        }
    }

    function desktopMenus() {
        return (
            <>
                {FileMenus(ScreenSize.LARGE)}
                {ChartMenus(ScreenSize.LARGE)}
            </>
        );
    }

    function mobileMenus() {
        return (
            <>
                <Dropdown
                    trigger={
                        <div>
                            <Icon name="sidebar"/>
                        </div>
                    }
                    className="item"
                    icon={null}
                >
                    <Dropdown.Menu>
                        {FileMenus(ScreenSize.SMALL)}
                        {ChartMenus(ScreenSize.SMALL)}
                    </Dropdown.Menu>
                </Dropdown>
            </>
        );
    }

    return (
        <>
            <Menu as={Media} greaterThanOrEqual="large" attached="top" inverted color="blue" size="large">
                {desktopMenus()}
            </Menu>
            <Menu as={Media} at="small" attached="top" inverted color="blue" size="large">
                {mobileMenus()}
            </Menu>
        </>
    );
}
