const API_KEY = 'YOUR_API_KEY';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
let nextPageToken;
let url;
let formattedPlaylistId;
let titleList = [];
let videoLinks = [];

chrome.runtime.onMessage.addListener((message) => {

  if(message.popupOpen) {

    chrome.tabs.query({'active': true, 'lastFocusedWindow': true, 'currentWindow': true}, function (tabs) {
      url = tabs[0].url;
      console.log(url);
      let currentUrl = url.match(/[&?]list=([^&]+)/i);
      
      
      if(currentUrl[1]) {
        
        if(titleList.length == 0) {
          chrome.storage.local.set({
            list: []
          }, function () {
            console.log("List stored 1");
          });
        }
        
        chrome.storage.local.get(
          ['list', 'url'],
          function(data) {
            console.log(data.url, currentUrl[1])
            if(data.url != currentUrl[1] || data.list.length != titleList.length || data.list.length == 0) {
              
              titleList = [];
              videoLinks = [];
              getPlaylist(url);
              
            }
            else {
              
              chrome.extension.onConnect.addListener(function(port) {
                port.postMessage({msg: "resultList", titleList, videoLinks});
              });
              
            }
            
          });
  
          chrome.storage.local.set({
            url: currentUrl[1]
          });
          
      }
  
    });

  }

});

// chrome.tabs.onActivated.addListener((activeInfo) => {
//   chrome.tabs.query({'active': true, 'lastFocusedWindow': true, 'currentWindow': true}, function (tabs) {
//     url = tabs[0].url;
//     console.log(url);
//     let currentUrl = url.match(/[&?]list=([^&]+)/i);
    
    
//     if(currentUrl[1]) {
      
//       if(titleList.length == 0) {
//         chrome.storage.local.set({
//           list: []
//         }, function () {
//           console.log("List stored 1");
//         });
//       }
      
//       chrome.storage.local.get(
//         ['list', 'url'],
//         function(data) {
//           console.log(data.url, currentUrl[1])
//           if(data.url != currentUrl[1] || data.list.length != titleList.length || data.list.length == 0) {
            
//             titleList = [];
//             videoLinks = [];
//             getPlaylist(url);
            
//           }
//           else {
            
//             chrome.extension.onConnect.addListener(function(port) {
//               port.postMessage({msg: "resultList", titleList, videoLinks});
//             });
            
//           }
          
//         });

//         chrome.storage.local.set({
//           url: currentUrl[1]
//         });
        
//     }

//   });
// });

function onGAPILoad() {

  gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  }).then(function () {

    console.log('gapi initialized');
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      gapi.auth.setToken({
        'access_token': token,
      });

    });
  }, function(error) {

    console.log('error', error);

  });

}

function getPlaylist(url) {

  let playlistId = url;
  let tempId = playlistId.match(/[&?]list=([^&]+)/i);
  formattedPlaylistId = tempId[1];

  return gapi.client.youtube.playlistItems.list({
    "part": "snippet",
    "maxResults": 50,
    "playlistId": formattedPlaylistId
  }).then(function(response) {

    // chrome.extension.onConnect.addListener(function(port) {
    //   port.postMessage({msg: "loading"});
    // });

    console.log("Response", response);

    let playlistItems = response.result.items;
    playlistItems.forEach(item => {
      titleList.push(item.snippet.title);
      videoLinks.push("https://www.youtube.com/watch?v=" + item.snippet.resourceId.videoId + "&list=" + formattedPlaylistId);
    });

    requestPlaylist(formattedPlaylistId, response.result.nextPageToken);

  })
           
}

function requestPlaylist(playlistId, pageToken) {
  console.log('page token: ', pageToken)

  let requestOptions = {
    playlistId: playlistId,
    part: "snippet",
    maxResults: 50
  }

  if(pageToken) {

    requestOptions.pageToken = pageToken;

    return gapi.client.youtube.playlistItems.list(requestOptions)
      .then(function(response) {
  
        console.log(response);
        nextPageToken = response.result.nextPageToken;
  
        let playlistItems = response.result.items;
  
  
        if(playlistItems) {
  
          playlistItems.forEach(item => {
            titleList.push(item.snippet.title);
            videoLinks.push("https://www.youtube.com/watch?v=" + item.snippet.resourceId.videoId + "&list=" + formattedPlaylistId);
          });
  
        }
  
        if(pageToken) {
  
          nextPageToken = response.result.nextPageToken
  
          if(nextPageToken) {
  
            return requestPlaylist(playlistId, nextPageToken);
  
          }
          else {
  
            console.log(titleList);
            chrome.extension.onConnect.addListener(function(port) {
              port.postMessage({msg: "resultList", titleList, videoLinks});
            });
            
            chrome.storage.local.set({
              list: titleList
            });
            
  
          }
  
        }
  
      });

  }
  else {

    console.log(titleList);
    chrome.extension.onConnect.addListener(function(port) {
      port.postMessage({msg: "resultList", titleList, videoLinks});
    });

    chrome.storage.local.set({
      list: titleList
    });

  }

}
