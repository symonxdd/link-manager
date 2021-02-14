// class Link {
//     constructor(url) {
//         this.url = url;
//         // this.favicon = ...; logic for favicon to base64
//     }

//     toString() {
//         return new URL(this.url).host.replace("www.", "");
//     }
// }

let toast = new Toasty({
    transition: "pinItUp",
    insertBefore: true,
    duration: 0
});



const passwordToggle = document.getElementById("password-switch");
const passwordButton = document.getElementById("password-button");
const passwordDeleteButton = document.getElementById("password-delete-button");
const passwordInput = document.getElementById("password-input");
const passwordHashProtected = document.getElementById("hash");
// const passwordCancel = document.getElementById("cancel-password");
const addLinkButton = document.getElementById("add-link-button");
const addLinkTextbox = document.getElementById("add-link-textbox");
const deleteAllLinks = document.getElementById("delete-all-links");
const deleteAllLinksCheckbox = document.querySelector(".confirm-delete-all-links#customControlAutosizing");
const fileBrowser = document.getElementById("inputGroupFile01");
const loadFileButton = document.getElementById("load-file");
const linksContainer = document.getElementById("links");
const loadFromPasteButton = document.getElementById("from-clipboard");


// global event
document.addEventListener('DOMContentLoaded', () => {
    restoreOptions();
    loadLinks();
});

// clipboard paste listener
window.addEventListener('paste', e => {
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    handlePaste(paste);
});

// event listeners
passwordToggle.addEventListener('change', () => {
    savePasswordStatus();
    reportPasswordStatus();
});

loadFileButton.addEventListener('click', () => {

});

fileBrowser.addEventListener('change', e => {
    const file = e.target.files[0];

    if (file != undefined) {
        loadFileButton.disabled = false;

        // show filename
        document.querySelector(".custom-file-label").innerHTML = file.name;

        // handle contents
        if (file != undefined) {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                let content = reader.result;
                console.log(content.split(','));
                loadFileButton.innerHTML = "Load " + content.split(',').length + " links";

                document.getElementById('output').textContent = content;
            }
        }
    }
});


let confirmCounter = 0;
passwordButton.addEventListener('click', () => {
    if (passwordInput.value != "") {

        // first click
        if (confirmCounter == 0) {
            confirmCounter++;
        }
        // second click
        else {
            savePassword();
            confirmCounter = 0;
        }

        updatePasswordConfirmUI();
    }
});

let deleteCounter = 0;
passwordDeleteButton.addEventListener('click', () => {
    if (passwordDeleteButton.disabled == false) {
        if (deleteCounter == 0) { // first click
            deleteCounter++;
        } else {
            deletePassword();
            deleteCounter = 0;
        }

        updatePasswordDeleteUI();
    }
});

deleteAllLinks.addEventListener('click', () => {
    chrome.storage.sync.get({ urls: [] }, items => {
        if (items.urls != "") {
            if (deleteAllLinksCheckbox.checked) {
                chrome.storage.sync.clear(() => {
                    toast.success("All links deleted");
                    loadLinks();
                });
            }
            else {
                toast.warning("Are you sure?");
            }
        }
    });
});

// element.addEventListener("focus", e => { e.target.select(); });

addLinkButton.addEventListener('click', () => {
    if (addLinkTextbox.value != "") {
        saveNewLinks(addLinkTextbox.value);
    }
});

// passwordCancel.addEventListener('click', () => {
//     passwordConfirm.style.backgroundColor = "#007BFF";
//     passwordConfirm.innerHTML = "Confirm";
//     passwordTextbox.disabled = false;
//     document.querySelector("#password-form > div:nth-child(2) > input:nth-child(1)").disabled = false;
//     passwordCancel.style.visibility = "collapse";
//     confirmCounter = 0;
// });

/**
 * @returns {boolean} true if link is valid; false otherwise
 * @param {string} string
 */
function isValidLink(string) {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

    return !!pattern.test(string);
}

function handlePaste(paste) {
    if (paste.length != 0) {

        //  removes spaces, tabs & newlines
        paste = paste.replace(/\s/g, '');
        // console.log(paste);

        // removes quotes (single & double)
        paste = paste.replace(/['"]+/g, '');
        // console.log(paste);

        // removes leading and trailing comma
        paste = paste.replace(/(^,)|(,$)/g, "");
        // console.log(paste);

        const links = paste.split(',');
        let validLinks = [];
        let amountValidLinks = 0;

        document.getElementById('output').textContent = "";

        // link validation
        for (let i = 0; i < links.length; i++) {
            const link = links[i];

            if (isValidLink(link)) {
                // testing purposes
                document.getElementById('output').innerHTML += `<span class="text-success d-block">${link}</span>\n`;

                amountValidLinks++;
                validLinks.push(getSchemeLink(link));
            }
            else {
                // testing purposes
                document.getElementById('output').innerHTML += `<span class="text-danger d-block">${link}</span>\n`;
            }
        }

        // error message on corrupted link(s)
        if (amountValidLinks != links.length) {
            const amountInvalidLinks = links.length - amountValidLinks;
            let singularOrPlural = "";

            amountInvalidLinks > 1 ? singularOrPlural = "links are" : singularOrPlural = "link is";
            toast.error(`<strong>${amountInvalidLinks}</strong> ${singularOrPlural} corrupted`);
        }

        if (amountValidLinks >= 1) {
            let singularOrPlural = "";

            loadFromPasteButton.disabled = false;
            amountValidLinks > 1 ? singularOrPlural = "links" : singularOrPlural = "link";


            loadFromPasteButton.innerHTML = `Load ${amountValidLinks} ${singularOrPlural}`;
            loadFromPasteButton.addEventListener('click', () => {
                chrome.storage.sync.get({ urls: [] }, items => {
                    chrome.storage.sync.set({ urls: items.urls.concat(validLinks) }, () => {
                        toast.success(`Successfully <strong>added ${singularOrPlural}</strong>`);
                        loadLinks();
                    });
                });
            });
        }

    }
}

function reportPasswordStatus() {
    chrome.runtime.sendMessage(
        {
            action: 'PasswordEnabledStatusChanged',
            isChecked: passwordToggle.checked,
        });
}

// prevent page reload when confirming password
$("#delete-all-links-form").submit(function (e) {
    e.preventDefault();
});

function saveNewLinks(newLinks) {
    let links = newLinks.split(',');

    if (links.length != 0) {
        chrome.storage.sync.get({ urls: [] }, items => {

            let schemedLinks = "";
            links.forEach(link => {
                schemedLinks += getSchemeLink(link) + ",";
            });

            links = schemedLinks.replace(/,\s*$/, "").split(',');

            chrome.storage.sync.set({ urls: items.urls.concat(links) }, () => {
                toast.success("Successfully <strong>added link(s)</strong>");
                loadLinks();
            });
        });
    }
}

/**
 * @param {string} link 
 * @returns {string} link with scheme
 */
function getSchemeLink(link) {
    link.includes("http") || link.includes("https") ? prefix = "" : prefix = "https://";
    return prefix + link;
}

/**
 * @param {string} link 
 * @returns {string} link without scheme
 */
function removeSchemeLink(link) {
    let tempLink = "";

    link.includes("http://") ? tempLink = link.replace("http://", '') : tempLink = link.replace("https://", '');

    return tempLink;
}

function updatePasswordConfirmUI() {
    if (confirmCounter == 0) {
        passwordButton.style.backgroundColor = "#007BFF";
        passwordButton.innerHTML = "Confirm";
        passwordInput.disabled = false;
        // document.querySelector("#password-form > div:nth-child(2) > input:nth-child(1)").disabled = false;
        // passwordCancel.style.visibility = "collapse";
        passwordInput.value = "";
        restoreOptions();
    }
    else {
        passwordButton.style.backgroundColor = "#1c1e22";
        passwordButton.innerHTML = "Sure?";
        passwordInput.disabled = true;
        // document.querySelector("#password-form > div:nth-child(2) > input:nth-child(1)").disabled = true;
        // passwordCancel.style.visibility = "visible";
    }
}

function updatePasswordDeleteUI() {
    if (deleteCounter == 0) {
        passwordDeleteButton.style.backgroundColor = "#DC3545";
        passwordDeleteButton.innerHTML = "Delete";
        restoreOptions();
    }
    else {
        passwordDeleteButton.style.backgroundColor = "#1C1E22";
        passwordDeleteButton.innerHTML = "Sure?";
    }
}

function openWebsite(url) {
    chrome.tabs.create({
        url: url,
        active: false
    });
}

function loadLinks() {
    linksContainer.innerHTML = "";
    chrome.storage.sync.get({
        urls: []
    }, items => {
        for (let i = 0; i < items.urls.length; i++) {
            const link = items.urls[i];
            const parsed = psl.parse(new URL(link).hostname); // removeSchemeLink(link)
            const newCard = createCard({ url: link, sld: parsed.sld });
            appendCard(newCard);
        }
    });
}

function saveOptions() {
    let password = "";
    passwordInput.value != "" ? password = sha256(passwordInput.value) : password = "";

    const passwordEnabled = passwordToggle.checked;

    chrome.storage.sync.set({
        password: password,
        passwordEnabled: passwordEnabled
    }, () => {
        toast.info("Succesfully changed");
    });
}

function savePasswordOptions() {
    let option = "";
    const password = sha256(passwordInput.value);
    const passwordEnabled = passwordToggle.checked;

    chrome.storage.sync.set({
        password: password,
        passwordEnabled: passwordEnabled
    }, () => {
        passwordToggle.checked ? option = "<strong>on</strong>" : option = "<strong>off</strong>";
        toast.info("Password protection turned " + option);
    });
}

function savePassword() {
    const password = sha256(passwordInput.value);
    chrome.storage.sync.set({
        password: password,
    }, () => {
        toast.success("Succesfully <strong>changed</strong> password");
    });
}

function deletePassword() {
    chrome.storage.sync.set({
        password: "",
    }, () => {
        toast.success("Succesfully <strong>deleted</strong> password");
    });
}

function savePasswordStatus() {
    chrome.storage.sync.set({
        passwordEnabled: passwordToggle.checked
    }, () => {
        passwordToggle.checked ? option = "<strong>on</strong>" : option = "<strong>off</strong>";
        toast.info("Password protection turned " + option);
    });
}

function restoreOptions() {
    // Use default values
    chrome.storage.sync.get({
        urls: [],
        password: "",
        passwordEnabled: false
    }, items => {

        if (items.password == "") {
            passwordDeleteButton.disabled = true;
            passwordInput.placeholder = "Set Password";
        }
        else {
            passwordDeleteButton.disabled = false;
            passwordInput.placeholder = "Update Password";
        }

        // restore `passwordToggle`
        passwordToggle.checked = items.passwordEnabled;
    });
}

function createCard(prop) {
    const div = document.createElement('div');

    div.innerHTML = `<div class="card text-white bg-dark">
    <div class="card-body">
        <img src="https://www.google.com/s2/favicons?domain=${prop.url}" class="link-favicon">
        <h5 class="card-title">${prop.sld}</h5>
        <p class="card-text">${prop.url}
        </p>
        <div class="btn-group">
            <a href="${prop.url}" target="_blank" class="btn btn-warning" role="button">Open</a>
            <button type="button" class="btn btn-warning dropdown-toggle dropdown-toggle-split"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="sr-only">Toggle Dropdown</span>
            </button>
            <div class="dropdown-menu">
                <a class="dropdown-item" href="#">Action</a>
                <a class="dropdown-item" href="#">Another action</a>
                <a class="dropdown-item" href="#">Something else here</a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="#">Separated link</a>
            </div>
        </div>
    </div>
    </div>`;

    // console.log(div.firstChild);
    return div.firstChild;
}

function appendCard(card) {
    linksContainer.appendChild(card);
    // document.body.appendChild(div);
}

