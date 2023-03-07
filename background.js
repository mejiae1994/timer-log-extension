const integrationToken = 'API Key goes here. Removed for obvious reasons.';

chrome.runtime.onMessage.addListener((msg, sender) => {
  if(msg.action === "fetch") {
    postNotionPage(msg);
  }
});

function postNotionPage(message) {
  fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${integrationToken}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify(message.data)
  }).then(response => response.json())
  .then(data => {
    console.log("sucess!", data);
  }).catch();
}

