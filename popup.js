
class Link {
    constructor(url) {
        this.url = url;
        // this.favicon = ...; logic for favicon to base64
    }

    toString() {
        return new URL(this.url).host.replace("www.", "");
    }
}

for (let index = 0; index < 9; index++) {
    // 1. create link object
    let link = new Link("https://www.google.be" + index);

    // 2. create placeholders for the link
    let div = document.createElement("div");
    div.setAttribute("class", "item");

    // 3. url name
    let textnode = document.createTextNode(link.toString());

    div.appendChild(textnode);

    document.getElementById("row").appendChild(div);
}


// function openWebsites() {
//     for (let i = 0; i < urls.length; i++) {
//         let url = urls[i];
//         if (url !== '') {
//             chrome.tabs.create({
//                 url: url,
//                 active: false
//             });
//         }
//     }
// }