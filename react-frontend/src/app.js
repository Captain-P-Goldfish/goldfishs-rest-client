import React from "react";
import logo from "./logo.svg";
import {Nav, Navbar} from "react-bootstrap";
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import {LinkContainer} from 'react-router-bootstrap'
import SystemOverview from "./system/system-overview";
import ScimClient from "./scim/scim-client";
import OpenidProvider from "./openid/openid-provider";


class Application extends React.Component
{

    constructor(props)
    {
        super(props);
        this.state = {configLoaded: false}
    }

    async loadAppConfig()
    {
        if (this.state.configLoaded)
        {
            return;
        }
        let scimClient = new ScimClient("/scim/v2/ServiceProviderConfig");
        let serviceProvider = await scimClient.listResources();
        serviceProvider.resource.then(resource =>
        {
            window.MAX_RESULTS = resource.filter.maxResults;
            window.MAX_OPERATIONS = resource.bulk.maxOperations;
        })
        this.setState({configLoaded: true})
    }

    render()
    {
        this.loadAppConfig();

        return (
            <React.Fragment>
                <Router>
                    <Navbar bg="navigation" expand="md">
                        <Navbar.Brand href="#home">Captain Goldfish's Rest Client</Navbar.Brand>
                        <Navbar.Collapse id="basic-navbar-nav">
                            <Nav className="mr-auto" />
                            <img src={logo} className="react-logo" alt="logo" />
                        </Navbar.Collapse>
                    </Navbar>

                    <Navbar bg="navigation-left" className={"navbar-left"} expand="md" variant="dark">
                        <Navbar.Collapse>

                            <Nav className="flex-column">

                                <LinkContainer exact to="/">
                                    <Nav.Link>Home</Nav.Link>
                                </LinkContainer>
                                <LinkContainer exact to="/openid">
                                    <Nav.Link>OpenID</Nav.Link>
                                </LinkContainer>
                                <LinkContainer exact to="/system">
                                    <Nav.Link>System</Nav.Link>
                                </LinkContainer>
                            </Nav>
                        </Navbar.Collapse>
                    </Navbar>

                    <div className="main">
                        {/* A <Switch> looks through its children <Route>s and
                         renders the first one that matches the current URL. */}
                        <Switch>
                            <Route path="/system">
                                <SystemOverview />
                            </Route>
                            <Route path="/openid">
                                <OpenidProvider />
                            </Route>
                            <Route path="/">
                                <h2>Welcome</h2>
                            </Route>
                        </Switch>
                    </div>
                </Router>
            </React.Fragment>
        );
    }
}


export default Application;
