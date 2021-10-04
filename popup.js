let port = chrome.extension.connect({
  name: "Sample Communication"
});

chrome.runtime.sendMessage({popupOpen: true});

port.onMessage.addListener(function(message) {
  console.log(message);

  let ul = document.getElementById('results');

  if(message.msg == "loading") {

    console.log('loading')
    let li = document.createElement('li');
    let a = document.createElement('a');
    a.setAttribute('href', '#');
    a.textContent = "Loading...";
    li.appendChild(a);

    ul.appendChild(li);

  }

  if(message.msg == "resultList") {

    while(ul.firstChild) {
      ul.removeChild(ul.firstChild);
    }

    let titleList = [];
    let videoLinks = [];

    titleList = message.titleList;
    videoLinks = message.videoLinks;

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

});

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