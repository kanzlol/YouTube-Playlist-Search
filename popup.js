const API_KEY = 'YOUR_API_KEY';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
let nextPageToken;
let url;
let formattedUrl;
let formattedPlaylistId;
let titleList = [];
let videoLinks = [];

window.onload = function() {
  onGAPILoad();
}

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
      stuff();

    });
  }, function(error) {

    console.log('error', error);

  });

}


function stuff() {

  chrome.tabs.query({'active': true, 'lastFocusedWindow': true, 'currentWindow': true}, function (tabs) {
    url = tabs[0].url;
    console.log(url);
    let currentUrl = url.match(/[&?]list=([^&]+)/i);
    formattedUrl = currentUrl[1];
    
    
    if(formattedUrl) {
      
      chrome.storage.local.get(
        ['titles', 'videos', 'url'],
        function(data) {
          console.log(data.url, formattedUrl)
          if(data.url != formattedUrl || data.url == '') {
            
            titleList = [];
            videoLinks = [];
            getPlaylist(url);
            
          }
          else {
            console.log("Same playlist")
            updateList(data.titles, data.videos);
            
          }
          
        });
  
        chrome.storage.local.set({
          url: formattedUrl
        });
        
    }
  
  });

}

function getPlaylist(url) {

  let playlistId = url;
  let tempId = playlistId.match(/[&?]list=([^&]+)/i);
  formattedPlaylistId = tempId[1];

  console.log('loading')
  let li = document.createElement('li');
  let a = document.createElement('a');
  a.setAttribute('href', '#');
  a.textContent = "Loading...";
  li.appendChild(a);

  document.getElementById('results').appendChild(li);

  return gapi.client.youtube.playlistItems.list({
    "part": "snippet",
    "maxResults": 50,
    "playlistId": formattedPlaylistId
  }).then(function(response) {


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
  
            console.log("Every pageToken completed", titleList);
            updateList(titleList, videoLinks);
            
            chrome.storage.local.set({
              titles: titleList,
              videos: videoLinks
            });
            
  
          }
  
        }
  
      });

  }
  else {

    console.log("No pageToken", titleList);
    updateList(titleList, videoLinks);

    chrome.storage.local.set({
      titles: titleList,
      videos: videoLinks
    });

  }

}

function updateList(titles, videos) {

  let ul = document.getElementById('results');

  while(ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }

  let titleList = [];
  let videoLinks = [];

  titleList = titles;
  videoLinks = videos;

  console.log(titleList)
  
  for(let i = 0; i < titleList.length; i++) {
    
    let li = document.createElement('li');
    let a = document.createElement('a');
    a.setAttribute('href', videoLinks[i]);
    a.textContent = titleList[i];
    li.appendChild(a);

    ul.appendChild(li);
    li.onclick = function() {
      chrome.tabs.update({active: true, url: a.href});
    }

  }

}

document.getElementById('exists').addEventListener('keyup', updateValue);

function updateValue() {

  let text, filter, ul, li, a, i, txtVal;

  text = document.getElementById('exists').value;
  filter = text.toUpperCase();
  ul = document.getElementById('results');
  li = ul.getElementsByTagName('li');

  for(i = 0; i < li.length; i++) {

    a = li[i].getElementsByTagName("a")[0];
    txtVal = a.textContent || a.innerText;
    
    if(txtVal.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    }
    else {
      li[i].style.display = "none";
    }

  }

}
