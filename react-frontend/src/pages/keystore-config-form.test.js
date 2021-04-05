import React from 'react';
import KeystoreForm from "./keystore-config-form";
import {act, fireEvent, render, waitFor} from '@testing-library/react';
import Assertions, {mockFetch} from "../setupTests"
import {unmountComponentAtNode} from "react-dom";

let container = null;

/* ********************************************************************************************************* */

beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
});

/* ********************************************************************************************************* */

afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
});

/* ********************************************************************************************************* */

function loadPageWithoutEntries() {
    mockFetch(200, []);
    new Assertions("#keystore-alias-entries").isNotPresent();

    act(() => {
        render(<KeystoreForm />, container);
    });
    expect(global.fetch).toBeCalledTimes(1);
    expect(global.fetch).toBeCalledWith("/keystore/infos")
    global.fetch.mockRestore();
}

/* ********************************************************************************************************* */

function getFakeKeystoreInfos() {
    return {
        "numberOfEntries": 3,
        "certificateAliases": ["goldfish", "localhost", "unit-test"]
    };
}

function getFakeCertInfo(alias) {

    const certificateInfos = {
        "goldfish": {
            "issuerDn": "CN=goldfish",
            "subjectDn": "CN=goldfish",
            "sha256fingerprint": "eafbea8af66e666310d6f73899d45a39a876b80037af7ae5fac2143ece6c9cee",
            "validFrom": "2021-03-27T18:42:14Z",
            "validUntil": "2121-03-27T18:42:14Z"
        },
        "localhost": {
            "issuerDn": "CN=goldfish",
            "subjectDn": "CN=localhost",
            "sha256fingerprint": "4226c730a65e6352f214cad920a9a2e7f2e4e4884c7184aab4e25e3413ebdf50",
            "validFrom": "2021-03-30T18:11:28Z",
            "validUntil": "2121-03-30T18:11:28Z"
        },
        "unit-test": {
            "issuerDn": "CN=goldfish",
            "subjectDn": "CN=unit-test",
            "sha256fingerprint": "1e90dcc6e12aecf6529273b9627126d20ac6d14fb2bdd1dcbfd26baf7012c5bb",
            "validFrom": "2021-03-30T18:12:01Z",
            "validUntil": "2121-03-30T18:12:01Z"
        }
    };

    return certificateInfos[alias];
}

/* ********************************************************************************************************* */

test("verify certificate data is displayed and deletable", async () => {
    const fakeKeystoreInfos = getFakeKeystoreInfos();

    mockFetch(200, fakeKeystoreInfos);

    new Assertions("#keystore-alias-entries").isNotPresent();

    act(() => {
        render(<KeystoreForm />, container);
    });
    expect(global.fetch).toBeCalledTimes(1);
    expect(global.fetch).toBeCalledWith("/keystore/infos")
    global.fetch.mockRestore();

    await waitFor(() => {
        new Assertions("#keystore-alias-entries").isPresent();
        new Assertions("#keystore-infos-alert").isPresent().isVisible()
            .assertEquals('Application Keystore contains "3" entries');
    });

    // creating a copy of the aliases because we would otherwise pass a reference into the react component that will
    // be sliced on element deletion causing this array to be effected
    let aliasArray = [...fakeKeystoreInfos.certificateAliases];

    // validate the data content on the card-deck
    for (let alias of aliasArray) {

        const cardId = "alias-card-" + alias;
        let certInfo = null;

        // validate card is displayed without any data but with image and a button to load the data
        {
            const loadCertDataButtonAssertion = new Assertions("#load-certificate-data-button-for-" + alias)
                .isPresent().isVisible();
            expect(loadCertDataButtonAssertion.element.previousSibling.tagName).toBe("IMG");
            certInfo = getFakeCertInfo(alias);
            mockFetch(200, certInfo);
            await loadCertDataButtonAssertion.clickElement(() => {
                new Assertions("#issuer-dn-" + alias).isPresent().isVisible();
            })
            expect(global.fetch).toBeCalledTimes(1);
            expect(global.fetch).toBeCalledWith("/keystore/load-alias?alias=" + alias)
            global.fetch.mockRestore();
        }

        // validate displayed data
        {
            new Assertions("#alias-name-" + alias).isVisible().assertEquals(alias);
            new Assertions("#issuer-dn-" + alias).isVisible().assertEquals(certInfo.issuerDn);
            new Assertions("#subject-dn-" + alias).isVisible().assertEquals(certInfo.subjectDn);
            new Assertions("#sha-256-" + alias).isVisible().assertEquals(certInfo.sha256fingerprint);
            new Assertions("#valid-from-" + alias).isVisible().assertEquals(certInfo.validFrom);
            new Assertions("#valid-until-" + alias).isVisible().assertEquals(certInfo.validUntil);
        }


        // click the delete button and verify that the delete dialog is shown
        {
            const baseId = "#delete-dialog-" + alias;
            new Assertions(baseId).isNotPresent();
            const deleteButtonIconAssertion = new Assertions("#delete-button-" + alias);
            await deleteButtonIconAssertion.clickElement(() => new Assertions(baseId).isPresent().isVisible());
            new Assertions(baseId + "-header").isPresent()
                .isVisible().assertEquals("Delete '" + alias + "'");

            // cancel deletion
            {
                const cancelButtonAssertion = new Assertions(baseId + "-button-cancel").isPresent()
                    .isVisible().assertEquals("cancel");
                await cancelButtonAssertion.clickElement(() => new Assertions(baseId).isNotPresent());
            }

            // show delete dialog again
            await deleteButtonIconAssertion.clickElement(() => new Assertions(baseId).isPresent().isVisible());

            // accept deletion
            {
                const deleteButtonAssertion = new Assertions(baseId + "-button-accept").isPresent()
                    .isVisible().assertEquals("delete");
                mockFetch(204, "");
                await deleteButtonAssertion.clickElement(() => {
                    new Assertions(cardId).isNotPresent();
                    new Assertions("#card-list-deletion-success").isPresent()
                        .assertEquals('Key entry for alias "' + alias + '" was successfully deleted');
                });
                expect(global.fetch).toBeCalledTimes(1);
                expect(global.fetch).toBeCalledWith("/keystore/delete-alias?alias=" + alias,
                    {method: "DELETE"})
                // remove the mock to ensure tests are completely isolated
                global.fetch.mockRestore();
            }
        }
    }
    new Assertions("#keystore-infos-alert").isPresent().isVisible()
        .assertEquals('Application Keystore contains "0" entries');
});

/* ********************************************************************************************************* */

test("Load page without any key entries", async () => {
    loadPageWithoutEntries();
    new Assertions("#keystore-infos-alert").isPresent().isVisible()
        .assertEquals('Application Keystore contains "0" entries');
});

/* ********************************************************************************************************* */

test("upload Keystore entries", async () => {
    loadPageWithoutEntries();
    const filename = "myKeystore.jks";
    const keystoreFile = new File(["hello world"], filename);
    const keystorePassword = "123456";
    const aliasOverride = "hello-world";
    const privateKeyPassword = "123456";
    const stateId = "34c8dc36-1543-4aac-97a1-16fb43b451f7";

    // verify forms are enabled or disabled
    {
        new Assertions("#uploadForm").isPresent().isVisible().hasNotClass("disabled");
        new Assertions("#aliasSelectionForm").isPresent().isVisible().hasClass("disabled");
    }

    // handle file input field
    {
        const keystoreFileAssertion = new Assertions("#keystoreFile").isPresent().isVisible();
        fireEvent.change(keystoreFileAssertion.element, {target: {files: [keystoreFile]}})
    }
    // handle keystore password input field
    {
        const keystorePasswordAssertion = new Assertions("#keystorePassword")
            .isPresent().isVisible().assertEquals("");
        fireEvent.change(keystorePasswordAssertion.element, {target: {value: keystorePassword}})
    }

    // mock fetch
    {
        mockFetch(200, {
            "stateId": stateId,
            "aliases": [
                "unit-test",
                "goldfish",
                "localhost"
            ]
        });
    }

    // submit form
    {
        new Assertions("#uploadForm").isPresent().hasNotClass("disabled");
        new Assertions("#aliasSelectionForm").isPresent().hasClass("disabled");

        await new Assertions("#uploadButton")
            .isPresent()
            .isVisible()
            .assertEquals("Upload")
            .clickElement(() => {
                new Assertions("#uploadForm-alert-success").isPresent().isVisible()
                    .assertEquals("Keystore was successfully uploaded");
                new Assertions("#uploadForm").hasClass("disabled");
                new Assertions("#aliasSelectionForm").hasNotClass("disabled");
            });
        expect(global.fetch).toBeCalledTimes(1);
        let data = new FormData();
        data.append("keystoreFile", keystoreFile)
        data.append("keystorePassword", keystorePassword)
        expect(global.fetch).toBeCalledWith("/keystore/upload",
            {
                body: data,
                method: "POST"
            })
        global.fetch.mockRestore();
    }

    // check values of alias selection box
    {
        const aliasesElement = new Assertions("#aliases").isPresent().isVisible().element;
        expect(aliasesElement.options.length).toBe(3);
        expect(aliasesElement.options[0].textContent).toBe("unit-test");
        expect(aliasesElement.options[1].textContent).toBe("goldfish");
        expect(aliasesElement.options[2].textContent).toBe("localhost");
    }

    // verify that first entry is selected and enter data to input fields
    {
        new Assertions("#aliases")
            .isPresent().isVisible().hasValueSelected("unit-test");

        const aliasOverrideAssertion = new Assertions("#aliasOverride").isPresent().isVisible();
        fireEvent.change(aliasOverrideAssertion.element, {target: {value: aliasOverride}})

        const privateKeyPasswordAssertion = new Assertions("#privateKeyPassword").isPresent().isVisible();
        fireEvent.change(privateKeyPasswordAssertion.element, {target: {value: privateKeyPassword}})
    }

    // mock fetch
    {
        mockFetch(201, {
            "alias": "unit-test",
            "certificateInfo": {
                "issuerDn": "CN=goldfish",
                "subjectDn": "CN=unit-test",
                "sha256fingerprint": "1e90dcc6e12aecf6529273b9627126d20ac6d14fb2bdd1dcbfd26baf7012c5bb",
                "validFrom": "2021-03-30T18:12:01Z",
                "validUntil": "2121-03-30T18:12:01Z"
            }
        });
    }

    // click save button
    {
        await new Assertions("#saveButton").isPresent().isVisible().clickElement(() => {
            new Assertions("#aliasSelectionForm-alert-success").isPresent().isVisible()
                .assertEquals("Key Entry was successfully added");
            new Assertions("#alias-card-unit-test").isPresent().isVisible();
        })
        expect(global.fetch).toBeCalledTimes(1);
        let data = new FormData();
        data.append("stateId", stateId)
        data.append("aliases", ["unit-test"])
        data.append("aliasOverride", aliasOverride)
        data.append("privateKeyPassword", privateKeyPassword)
        expect(global.fetch).toBeCalledWith("/keystore/select-alias",
            {
                body: data,
                method: "POST"
            });
        global.fetch.mockRestore();
    }
});


/* ********************************************************************************************************* */
