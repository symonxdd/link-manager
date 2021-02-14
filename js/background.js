// chrome.runtime.onStartup.addListener(function () {
//     chrome.storage.sync.get(items => {
//         if (items.clearOnStartIsChecked) {
//             clearHistory();
//         }
//     });
// });

// chrome.runtime.onMessage.addListener(function (request, sender, respond) {
//     if (request.action === "PasswordEnabledStatusChanged") {
//         if (request.isChecked) {

            

//             localStorage.setItem('autoIntervalId', autoIntervalId);

//             // console.log(autoIntervalId);
//         }
//         else {
//             const autoIntervalId = localStorage.getItem('autoIntervalId');
//             clearInterval(autoIntervalId);

//             // console.log(autoIntervalId);
//         }
//     }
// });

// chrome.browserAction.onClicked.addListener(() => {
//     clearHistory();
// });

// function setIcon(type) {
//     const successImage = chrome.runtime.getURL("src/img/success.png");
//     const errorImage = chrome.runtime.getURL("src/img/error.png");
//     const defaultImage = chrome.runtime.getURL("src/img/default.png");

//     switch (type) {
//         case "success":
//             chrome.browserAction.setIcon({ path: successImage });
//             break;
//         case "error":
//             chrome.browserAction.setIcon({ path: errorImage });
//             break;
//     }

//     setTimeout(() => {
//         chrome.browserAction.setIcon({ path: defaultImage });
//     }, 750);
// }

// function clearHistory() {
//     try {
//         chrome.browsingData.removeHistory({});
//         setIcon("success");
//     } catch (error) {
//         console.error(error);
//         setIcon("error");
//     }
// }