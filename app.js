let storageData;
const stopWatchState = {
  timeElapsedRunning: false,
  intervalId: undefined,
  timeHistory: [],
  selectValue: ''
}

let runningTimer;
let startButton;
let resetButton;
let tagSelect;

const databaseId = '3b9012607a56467e9ea45dd7fd0dd2d2';

function getElements() {
  runningTimer = document.getElementById("page-content");
  startButton = document.getElementById("start-button");
  resetButton = document.getElementById("reset-button");
  tagSelect = document.getElementById("tag-select");
}

function getNewDateFormatted() {
  let offset = -5;
  let date = new Date();
  return new Date(date.getTime() + offset * 60 * 60 * 1000).toISOString();
}

function triggerFetch() {
  const body = {
    parent: { database_id: databaseId },
    properties: {
      title: {
        title:[
          {
            "text": {
              "content": "timelog"
            }
          }
        ]
      },
      Tag: {
        "select": {
          "name": tagSelect.value || "unknown"
        }
      },
      Date: {
        "date": {
          "start": getNewDateFormatted()
        }
      },
      Log: {
        "rich_text": [
          {
            "text": {
              "content": stopWatchState.timeHistory[stopWatchState.timeHistory.length - 1]['timer']
            }
          }
        ]
      }
    },
  }
  chrome.runtime.sendMessage({"action": "fetch", "data": body});
}

function checkStorage(callback) {
  chrome.storage.local.get("data", result => {
    storageData = result.data || {};
    callback();
  })
}

function clearLocalStorage() {
  chrome.storage.local.clear(function() {
  });
}

document.addEventListener("DOMContentLoaded", () => {
  getElements();

  startButton.addEventListener("click", function() {
    startStopWatch();
  });
    
  resetButton.addEventListener("click", function() {
    clearLocalStorage();
    if (stopWatchState.timeHistory.length > 0) {
      triggerFetch();
      resetStopWatch();
    } 
  })
  
  checkStorage(() => {
    if (JSON.stringify(storageData) !== '{}' && storageData.timeElapsedRunning) {
      tagSelect.value = storageData.selectValue;
      stopWatchState.timeHistory = storageData.timeHistory;
      startStopWatch("local");
    }
    else if (JSON.stringify(storageData) !== '{}' && !storageData.timeElapsedRunning) {
      stopWatchState.timeHistory = storageData.timeHistory;
      runningTimer.innerText = stopWatchState.timeHistory.length > 0 ? stopWatchState.timeHistory[stopWatchState.timeHistory.length - 1]['timer']: "00:00";
    }
  });
})

function startStopWatch(resumeFrom = "button") {
  let startDate;

  if(!stopWatchState.intervalId) {
    if(!stopWatchState.timeElapsedRunning) {
      startDate = new Date();
      startButton.innerText = "Stop";
      
      if(stopWatchState.timeHistory.length > 0 && resumeFrom === "button") {
        getResumeTime(startDate);
      }
      else if (stopWatchState.timeHistory.length > 0 && resumeFrom === "local") {
        let [lastElement] = stopWatchState.timeHistory.slice(-1);
        startDate = new Date(lastElement["startTime"]);
        stopWatchState.intervalId = storageData.intervalId;
        stopWatchState.timeElapsedRunning = storageData.timeElapsedRunning;
      }

      stopWatchState.intervalId = setInterval(() => {
        let elapsedTimeObject = getElapsedTime(startDate);
        runningTimer.innerText = elapsedTimeObject["timer"];
        stopWatchState.timeHistory.push(elapsedTimeObject);
        stopWatchState.selectValue = tagSelect.value;
        chrome.storage.local.set({"data": stopWatchState})
      }, 1000);
      
      stopWatchState.timeElapsedRunning = true;
    }
  } 
  else {
    //timer is stopped logic
    if(stopWatchState.timeElapsedRunning) {
      resetState();
      chrome.storage.local.set({"data": stopWatchState})
      runningTimer.innerText = stopWatchState.timeHistory.length > 0 ? stopWatchState.timeHistory[stopWatchState.timeHistory.length - 1]['timer']: "00:00";
    }
  }
}

function getResumeTime(startDate) {
  let [lastElement] = stopWatchState.timeHistory.slice(-1);
  let dateDiff = diffBetweenDate(new Date(lastElement['startTime']), new Date(lastElement["endTime"]));
  startDate.setHours(startDate.getHours() - dateDiff.hours);
  startDate.setMinutes(startDate.getMinutes() - dateDiff.minutes);
  startDate.setSeconds(startDate.getSeconds() - dateDiff.seconds);
}

function resetStopWatch() {
  resetState();
  stopWatchState.timeHistory = [];
  runningTimer.innerText = "00:00";
}

function resetState() {
  clearInterval(stopWatchState.intervalId);
  stopWatchState.timeElapsedRunning = false;
  stopWatchState.intervalId = null;
  startButton.innerText = "Start";
}

function diffBetweenDate(date1, date2) {
  let diff = Math.abs(date1.getTime() - date2.getTime());
  let hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  let minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * (1000 * 60);
  let seconds = Math.floor(diff / 1000);
  
  return {
      hours: hours,
      minutes: minutes,
      seconds: seconds
  };
}

function getElapsedTime(startTime)
{
  let endTime = new Date();
  let timeDiff = endTime.getTime() - startTime.getTime();

  timeDiff = timeDiff / 1000;

  let seconds = Math.floor(timeDiff % 60);
  let secondsAsString = seconds < 10 ? "0" + seconds : seconds + "";

  timeDiff = Math.floor(timeDiff / 60);

  let minutes = timeDiff % 60;
  let minutesAsString = minutes < 10 ? "0" + minutes : minutes + "";

  timeDiff = Math.floor(timeDiff / 60);

  let hours = timeDiff % 24;

  timeDiff = Math.floor(timeDiff / 24);

  let days = timeDiff;
  let totalHours = hours + (days * 24);
  let totalHoursAsString = totalHours < 10 ? "0" + totalHours : totalHours + "";

  let timer = "";

  if (totalHoursAsString === "00") {
      timer = minutesAsString + ":" + secondsAsString;
  } else {
      timer = totalHoursAsString + ":" + minutesAsString + ":" + secondsAsString;
  }

  return {
    "timer": timer, 
    'startTime': startTime.toISOString(),
    "endTime": endTime.toISOString()
  };
}