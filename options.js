class Link {
    constructor(url) {
        this.url = url;
        // this.favicon = ...; logic for favicon to base64
    }

    toString() {
        return new URL(this.url).host.replace("www.", "");
    }
}

const options = {
    transition: "fade",
    insertBefore: true,
    duration: 6000,
    autoClose: false,
    // prependTo: document.getElementsByTagName("html").childNodes[0]
    // prependTo: document.body.parentNode
    // prependTo: document.body.childNodes[12]
    // prependTo: document.getElementsByTagName("html")[0]
    // prependTo: document.getElementById("kutje")
};


let toast = new Toasty(options);
let confirmCounter = 0;

const passwordToggle = document.getElementById("password-switch");
const passwordTextbox = document.getElementById("password");
const passwordHashProtected = document.getElementById("hash");
const passwordConfirm = document.getElementById("change-password");
// const passwordCancel = document.getElementById("cancel-password");
const addLinkButton = document.getElementById("add-link-button");
const addLinkTextbox = document.getElementById("add-link-textbox");
const deleteAllLinks = document.getElementById("delete-all-links");
const deleteAllLinksCheckbox = document.querySelector(".confirm-delete-all-links#customControlAutosizing");
const fileBrowser = document.getElementById("inputGroupFile01");
const loadFileButton = document.getElementById("load-file");

// global event
document.addEventListener('DOMContentLoaded', () => {
    restoreOptions();
    loadLinks();
});

window.addEventListener('paste', e => {
    let paste = (e.clipboardData || window.clipboardData).getData('text');
    handlePaste(paste);
});

// event listeners
passwordToggle.addEventListener('change', () => {
    // saveOptions();
    savePasswordOptions();
    reportPasswordEnabledStatus();
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

passwordConfirm.addEventListener('click', () => {
    if (passwordTextbox.value != "") {
        if (confirmCounter == 1) {
            // second click
            savePassword();
            confirmCounter = 0;
        } else {
            confirmCounter++;
            restoreOptions();
        }

        updateUI();
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
    if (paste != "") {
        const links = paste.split(',');

        document.getElementById('output').textContent = "";
        let counterValidLink = 0;

        for (let i = 0; i < links.length; i++) {
            if (isValidLink(links[i])) {
                document.getElementById('output').textContent += links[i] + "\n";
                counterValidLink++;
            }
            else {
                document.getElementById('output').textContent += "Couln't load: " + links[i] + "\n";
            }

            if (counterValidLink > 0) {
                loadFileButton.disabled = false;
                loadFileButton.innerHTML = "Load " + counterValidLink + " links";
            }
        }
    }
}

function reportPasswordEnabledStatus() {
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

            let cleanedLinks = "";
            links.forEach(link => {
                cleanedLinks += getCleanLink(link) + ",";
            });

            links = cleanedLinks.replace(/,\s*$/, "").split(',');

            chrome.storage.sync.set({ urls: items.urls.concat(links) }, () => {
                toast.success("Link added");
                loadLinks();
            });
        });
    }
}

function getCleanLink(link) {
    link.includes("http") || link.includes("https") ? prefix = "" : prefix = "https://";
    return prefix + link;
}

function updateUI() {
    if (confirmCounter == 0) {
        passwordConfirm.style.backgroundColor = "#007BFF";
        passwordConfirm.innerHTML = "Confirm";
        passwordTextbox.disabled = false;
        // document.querySelector("#password-form > div:nth-child(2) > input:nth-child(1)").disabled = false;
        // passwordCancel.style.visibility = "collapse";
        passwordTextbox.value = "";
        restoreOptions();
    }
    else {
        passwordConfirm.style.backgroundColor = "#1c1e22";
        passwordConfirm.innerHTML = "Sure?";
        passwordTextbox.disabled = true;
        // document.querySelector("#password-form > div:nth-child(2) > input:nth-child(1)").disabled = true;
        // passwordCancel.style.visibility = "visible";
    }
}

function openWebsite(url) {
    chrome.tabs.create({
        url: url,
        active: false
    });
}

function loadLinks() {
    document.getElementById("row").innerHTML = "";

    chrome.storage.sync.get({
        urls: []
    }, items => {
        for (let i = 0; i < items.urls.length; i++) {
            // 1. create link object
            let newLink = new Link(items.urls[i]);
            // console.log(items.urls[i]);

            // 2. create placeholders for the link
            let link = document.createElement("a");
            link.setAttribute("class", "link");
            link.setAttribute("data-href", newLink.url);
            // link.innerHTML = newLink.toString();
            link.innerHTML = newLink.url;

            link.addEventListener("click", () => {
                openWebsite(newLink.url);
            });

            document.getElementById("row").appendChild(link);
        }
    });
}

function saveOptions() {
    const password = sha256(passwordTextbox.value);
    const passwordEnabled = passwordToggle.checked;

    chrome.storage.sync.set({
        password: password,
        hash: password,
        passwordEnabled: passwordEnabled
    }, () => {
        toast.info("Succesfully changed");
    });
}

function savePassword() {
    const password = sha256(passwordTextbox.value);
    chrome.storage.sync.set({
        hash: password,
    }, () => {
        toast.success("Succesfully <strong>changed</strong> password");
    });
}

function savePasswordOptions() {
    let option = "";
    const password = sha256(passwordTextbox.value);
    const passwordEnabled = passwordToggle.checked;

    chrome.storage.sync.set({
        password: password,
        hash: password,
        passwordEnabled: passwordEnabled
    }, () => {
        passwordToggle.checked ? option = "<strong>on</strong>" : option = "<strong>off</strong>";
        toast.info("Successfully turned " + option);
    });
}

function restoreOptions() {
    // Use default values
    chrome.storage.sync.get({
        urls: [],
        password: "",
        hash: "",
        passwordEnabled: false
    }, items => {
        if (items.hash != "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") {
            passwordTextbox.placeholder = "Update Password";
        }
        else {
            passwordTextbox.placeholder = "Set Password";
        }

        // restore `passwordToggle`
        passwordToggle.checked = items.passwordEnabled;
    });
}