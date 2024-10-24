import {Dropdown, Icon, Menu} from 'semantic-ui-react';
import {FormattedMessage} from 'react-intl';
import {Media} from '../util/media';
import {MenuType} from './menu_item';
import {SearchBar} from './search';
import {UploadMenu} from './upload_menu';
import {UrlMenu} from './url_menu';
import {useHistory, useLocation} from 'react-router';
import {IndiInfo, JsonGedcomData} from '../lib/topola';

enum ScreenSize {
    LARGE,
    SMALL,
}

interface EventHandlers {
    onSelection: (indiInfo: IndiInfo) => void;
    onDownloadPdf: () => void;
    onDownloadPng: () => void;
    onDownloadSvg: () => void;
    onCenterView: () => void;
}

interface Props {
    /** True if the application is currently showing a chart. */
    showingChart: boolean;
    /** Data used for the search index. */
    data?: JsonGedcomData;
    standalone: boolean;
    eventHandlers: EventHandlers;
}

export function TopBar(props: Props) {
    useHistory();
    useLocation();
    function chartMenus(screenSize: ScreenSize) {
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
                            className="item"
                        >
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={props.eventHandlers.onDownloadPdf}>
                                    <FormattedMessage id="menu.pdf_file" defaultMessage="PDF file"/>
                                </Dropdown.Item>
                                <Dropdown.Item onClick={props.eventHandlers.onDownloadPng}>
                                    <FormattedMessage id="menu.png_file" defaultMessage="PNG file"/>
                                </Dropdown.Item>
                                <Dropdown.Item onClick={props.eventHandlers.onDownloadSvg}>
                                    <FormattedMessage id="menu.svg_file" defaultMessage="SVG file"/>
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>

                        <Menu.Item onClick={props.eventHandlers.onCenterView}>
                            <Icon name="eye" />
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
                return (
                    <>
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
                    </>
                );
        }
    }

    function fileMenus(screenSize: ScreenSize) {
        // Don't show "open" menus in non-standalone mode.
        if (!props.standalone) {
            return null;
        }

        switch (screenSize) {
            case ScreenSize.LARGE:
                // Show dropdown if chart is shown, otherwise show individual menu items.
                return props.showingChart ? (
                    <>
                        <UploadMenu menuType={MenuType.Menu} {...props} />
                        {/*<UrlMenu menuType={MenuType.Menu} {...props} />*/}
                    </>
                ) : (
                    <Dropdown
                        trigger={
                            <div>
                                <Icon name="folder open"/>
                                <FormattedMessage id="menu.open" defaultMessage="Open"/>
                            </div>
                        }
                        className="item"
                    >
                        <Dropdown.Menu>
                            <UploadMenu menuType={MenuType.Dropdown} {...props} />
                            <UrlMenu menuType={MenuType.Dropdown} {...props} />
                        </Dropdown.Menu>
                    </Dropdown>
                );

            case ScreenSize.SMALL:
                return (
                    <>
                        <UploadMenu menuType={MenuType.Dropdown} {...props} />
                        {/*<UrlMenu menuType={MenuType.Dropdown} {...props} />*/}
                        <Dropdown.Divider/>
                    </>
                );
        }
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
                        {fileMenus(ScreenSize.SMALL)}
                        {chartMenus(ScreenSize.SMALL)}
                    </Dropdown.Menu>
                </Dropdown>
            </>
        );
    }

    function desktopMenus() {
        return (
            <>
                {fileMenus(ScreenSize.LARGE)}
                {chartMenus(ScreenSize.LARGE)}
            </>
        );
    }

    return (
        <>
            <Menu
                as={Media}
                greaterThanOrEqual="large"
                attached="top"
                inverted
                color="blue"
                size="large"
            >
                {desktopMenus()}
            </Menu>
            <Menu
                as={Media}
                at="small"
                attached="top"
                inverted
                color="blue"
                size="large"
            >
                {mobileMenus()}
            </Menu>
        </>
    );
}
