

const lockButton = document.getElementById("lock");

lockButton.addEventListener('click', () => {
    chrome.storage.sync.clear(callback => {
        console.log(callback);
    });
});

document.getElementById('openAll').addEventListener("click", () => {
    chrome.storage.sync.get({ urls: "", }, items => {
        for (let i = 0; i < items.urls.length; i++) {
            openWebsite(items.urls[i]);
        }
    });
});



// document.getElementById('openAll').addEventListener("click", () => {
//     for (let i = 0; i < itemCollection.length; i++) {
//         itemCollection[i].click();
//     }
// });

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

function openWebsite(url) {
    chrome.tabs.create({
        url: url,
        active: false
    });
}