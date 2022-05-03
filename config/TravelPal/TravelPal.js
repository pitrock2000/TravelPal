/*
// TravelPal v.1.0 - May 2022 - initial release
*/
function TravelPalCtrl()
{
  this.tpCtrlWs = null;
  this.wsConnLimit = false;
  this.totTravelTime = 0;
  this.totTravelTimePrevStep = 0;
  this.currTripStartTime = 0;
  this.totDriveTime = 0;
  this.totDriveTimePrevStages = 0;
  this.totDriveDist = 0;
  this.totDriveDistPrevStep = 0;
  this.totDriveAvFlEff = 40;
  this.totDriveAvFlEffPrevStages = 0;
  this.totDriveAvSpeed = 0;
  this.mediaStr = ["","",""];
  this.prevStationFreq = "";
  this.currSpeedLim = 0;
  this.currSpeedLimTimer = null;
  this.currTPCtrlStatus = 0;
  this.currContext = "Other";
  this.infoPanelVisible = false;
  this.mediaKeyPressC = -1;
  this.lenUnitCode = 1;
  this.saveEnabled = true;
  this.compassEnabled = false;
  this.allowLog = true;
  this.logStr = "";

  this.textStrings = {
    "totDist"   : "DIST",
    "totTime"   : "TIME",
    "drvSpeed"  : "SPEED",
    "drvFuel"   : "FUEL",
    "spdcDist"  : "DIST",
    "msgCode1"  : "InfoPanel toggle",
    "msgCode2"  : "Speedcam add | remove",
    "msgCode3"  : "Speedcam added",
    "msgCode4"  : "Speedcam removed",
    "msgCode5"  : "Please wait",
    "msgCode9"  : "Cannot edit",
    "msgCode11" : "- TravelPal - \n Please focus on driving",
    "msgCode55" : "Language file error \n Using defaults",
    "msgCode99" : "- TravelPal - \n Connection Error"
  }

  this.createStructure();

  this.dataProcId = setInterval(function() {
    this.currContext = this.getCurrentContext();
    if (this.currContext != "Other") {
      clearInterval(this.dataProcId);
      window.addEventListener('animationend', function() { this.tponAnimationEnd(); }.bind(this), false);
      this.startDataProcessing('travlRd');
    }
  }.bind(this),1000);

}; // end of TravelPalCtrl

TravelPalCtrl.prototype.tpIniLog = function(text)
{
  if (this.allowLog) {
    var ctime = new Date();
    this.logStr += ("[ " + (ctime.getTime()/1000).toFixed(1) + " ] " + text + "#");
  }
}; // end of tpIniLog

TravelPalCtrl.prototype.createStructure = function()
{
  // Add link to css
  this.csl = document.createElement('link');
  this.csl.setAttribute('rel','stylesheet');
  this.csl.setAttribute('href','/data/uapps/TravelPal/TravelPal.css');
  document.head.appendChild(this.csl);

  // Add main DIV
  this.mainElt = document.createElement('div');
  this.mainElt.className = "TravelPalCtrl";

  // Add the test DIV
  this.testel = document.createElement('div');
  this.testel.className = 'TravelPalCtrlTestEl';
  
  // Add Compass DIV
  this.compassIconDivBase = document.createElement('div');
  this.compassIconDivBase.className = "TravelPalCtrlCompassIconBase";

  this.compassIconDiv = document.createElement('div');
  this.compassIconDiv.className = "TravelPalCtrlCompassIcon";

  // Add Trip DIVs
  this.tripDistTimeIconDiv = document.createElement('div');
  this.tripDistTimeIconDiv.className = "TravelPalCtrlTripDistTimeIcon";
  this.tripDistTimeIconParVal = document.createElement('p');
  this.tripDistTimeIconParSub = document.createElement('p');

  this.tripAverIconDiv = document.createElement('div');
  this.tripAverIconDiv.className = "TravelPalCtrlTripAverIcon";
  this.tripAverIconParVal = document.createElement('p');
  this.tripAverIconParSub = document.createElement('p');

  // Add Speed limit DIV
  this.speedLimPanel = document.createElement('div');
  this.speedLimPanel.className = "TravelPalCtrlSpeedLimPanel";
  this.speedLimIconDiv = document.createElement('div');
  this.speedLimIconDiv.className = "TravelPalCtrlSpeedLimIcon";
  this.speedLimIconParImg = document.createElement('p');
  this.speedLimIconParImg.className = "TravelPalCtrlSpeedLimImgBase";
  this.speedLimIconParRdist = document.createElement('p');
  this.speedLimIconParRdistSub = document.createElement('p');

  // Add messageBar DIV
  this.messageBarDiv = document.createElement('div');
  this.messageBarDiv.className = "TravelPalCtrlMessageBar";

  // Add travelInfoPanel DIV
  this.travelInfoPanel = document.createElement('div');
  this.travelInfoPanel.className = "TravelPalCtrlTravelInfoPanel";
  this.travelInfoPanelParTxt = document.createElement('p');
  
 // Add spdcamEditor Table
  this.spdcamEditor = document.createElement('tr');
  this.spdcamEditor.className = "TravelPalCtrlSpdcamEditor";
  for (i=0;i<4;i++) {
    this.spdcamEditor.appendChild(document.createElement('td'));
    this.spdcamEditor.cells[i].width = "120px";
    this.spdcamEditor.cells[i].style.border = "1px solid #303030";
    this.spdcamEditor.cells[i].style.borderRadius = "6px";
  }

 // Style and init child elements

  this.travelInfoPanelParTxt.style = 'position:relative; top:-21px; left: 4px; height:25px; width:210px; overflow:hidden;';

  this.tripDistTimeIconParVal.style = 'position:relative; top:-16px; font-size:20px;';
  this.tripDistTimeIconParSub.style = 'position:relative; top:-76px; font-size:10px; color:white;';
  this.tripDistTimeIconParVal.innerText = "-\n-";

  this.tripAverIconParVal.style = 'position:relative; top:-16px; font-size:20px;';
  this.tripAverIconParSub.style = 'position:relative; top:-76px; font-size:10px; color:white;';
  this.tripAverIconParVal.innerText = "-\n-";

// speedlim
  this.speedLimIconParRdist.style = 'position: relative;top: -200px;font-size: 20px;font-weight: normal;text-align: center;color: #ffff90;';
  this.speedLimIconParRdistSub.style = 'position: relative; display: none; top: -220px;font-size: 12px;text-align: center;color: #ffff90;';

  // Add elements to the DOM

  // Test el
  this.mainElt.appendChild(this.testel);

  // travelInfoPanel
  this.tripDistTimeIconDiv.appendChild(this.tripDistTimeIconParVal);
  this.tripDistTimeIconDiv.appendChild(this.tripDistTimeIconParSub);
  this.tripAverIconDiv.appendChild(this.tripAverIconParVal);
  this.tripAverIconDiv.appendChild(this.tripAverIconParSub);
  this.compassIconDivBase.appendChild(this.compassIconDiv);

  this.travelInfoPanel.appendChild(this.tripDistTimeIconDiv);
  this.travelInfoPanel.appendChild(this.tripAverIconDiv);
  this.travelInfoPanel.appendChild(this.compassIconDivBase);
  this.travelInfoPanel.appendChild(this.travelInfoPanelParTxt);
  this.mainElt.appendChild(this.travelInfoPanel);

  // MessageBar
  this.mainElt.appendChild(this.messageBarDiv);

  // Speed limit
  this.speedLimPanel.appendChild(this.speedLimIconDiv);
  this.speedLimPanel.appendChild(this.speedLimIconParImg);
  this.speedLimPanel.appendChild(this.speedLimIconParRdist);
  this.speedLimPanel.appendChild(this.speedLimIconParRdistSub);
  this.mainElt.appendChild(this.speedLimPanel);
  
  // spdcamEditor
  this.mainElt.appendChild(this.spdcamEditor);
  
  // Main Element
  setTimeout(function() { document.body.appendChild(this.mainElt);}.bind(this),0);

}; // end of createStructure

TravelPalCtrl.prototype.initializeData = function(savedtravdata, currtime, carlang, langpack)
{
  this.tpIniLog("Starting initializeData");
  
  // Travel saved data init
  try {
    var straveldata = JSON.parse(savedtravdata);
  } catch (et) {
    this.tpIniLog("Error: SavedData file import: " + et);
    var straveldata = [0,0,0,0,0];
  }
  var carStarttime = Number(currtime);
  var carStoptime = straveldata[4];
  if ((carStarttime - carStoptime)/60 < 90) {
    this.totTravelTime = straveldata[0] + carStarttime - carStoptime;
    this.totDriveTimePrevStages = this.totDriveTime = straveldata[1];
    this.totDriveDist = straveldata[2];
    this.totDriveAvFlEffPrevStages = straveldata[3];
    if (this.totDriveTimePrevStages > 0) {
      this.totDriveAvFlEff = this.totDriveAvFlEffPrevStages / this.totDriveTimePrevStages;
      this.totDriveAvSpeed = this.totDriveDist / (this.totDriveTimePrevStages/3600);
    }
  }
  // Lang data init
  try {
    var textStr = JSON.parse(langpack);
  } catch (el) {
    this.tpIniLog("Error: Language file import: " + el);
    this.langerror = true;
  }
  if (textStr) {
    var myLang = (carlang && (carlang != 0)) ? carlang : "2057";
    for (var prop in this.textStrings) {
    this.textStrings[prop] = (textStr[myLang] && textStr[myLang][prop]) ? textStr[myLang][prop] : this.textStrings[prop];
  }}

  this.tripDistTimeIconParSub.innerText = this.textStrings.totDist + '\n' + this.textStrings.totTime;
  this.tripAverIconParSub.innerText = this.textStrings.drvSpeed + '\n' + this.textStrings.drvFuel;
  this.speedLimIconParRdistSub.innerText = this.textStrings.spdcDist;
  
  this.spdcamEditor.cells[3].innerText = "X";

  this.tpIniLog("Data ready. Writing log to file");
  this.allowLog = false;
  this.tpCtrlWs.send('saveLog' + JSON.stringify(this.logStr));
  
  this.showTravelData();
  
  window.addEventListener('keydown', function(event) { this.tponkeydown(event); }.bind(this), true);
  window.addEventListener('keyup', function(event) { this.tponkeyup(event); }.bind(this), true);

}; // end of initializeData

TravelPalCtrl.prototype.showIniScreen = function()
{
  this.mainElt.style.opacity = 1;
  this.showMessageBar(11);
  this.toggleTravelInfoPanel();
  if (this.langerror) setTimeout(function() { this.showMessageBar(55);}.bind(this),3000);
}; // end of showIniScreen

TravelPalCtrl.prototype.tponAnimationEnd = function()
{
  clearTimeout(this.stoperId);
  this.stoperId = setTimeout(function() {
    this.currContext = this.getCurrentContext();
    if (this.saveEnabled && (this.currContext == "PowerDown")) {
      this.saveEnabled = false;
      this.tpCtrlWs.send('travlWr' + JSON.stringify([this.totTravelTime, this.totDriveTime, this.totDriveDist, Math.round(this.totDriveAvFlEff*this.totDriveTime)]));
      setTimeout(function(){ this.saveEnabled = true; this.currTPCtrlStatus = 0; }.bind(this),800);
    }
   this.setElementsVisibility(this.currContext);
  }.bind(this), 90);
}; // end of tponAnimationEnd

TravelPalCtrl.prototype.tponkeydown = function(event)
{
  if ((event.keyCode == 69) && (this.mediaKeyPressC == 0) && this.infoPanelVisible && (this.currContext == "Media")) {
    this.travelInfoPanel.style.color = "orange";
    this.okd = setTimeout(function() {
      this.resetTravelData();
      this.mediaKeyPressC = -1;
      this.travelInfoPanel.style.color = "#e0e0e0";
    }.bind(this),1000);
  }
}; // end of tponkeydown

TravelPalCtrl.prototype.tponkeyup = function(event)
{
  if (this.currContext != "Media") return;
  if (event.keyCode == 69) {
        if (this.mediaKeyPressC < 2) {
          clearTimeout(this.pressoku);
          clearTimeout(this.okd);
          this.travelInfoPanel.style.color = "#e0e0e0";
          this.mediaKeyPressC++;
          var time = (this.mediaKeyPressC == 1) ? 500 : 2700;
          this.pressoku = setTimeout(function() {
            if (this.mediaKeyPressC == 1) {
              this.toggleTravelInfoPanel();
            } else if (this.mediaKeyPressC == 2) {
              this.waitingForInput = null;
              this.toggleSpdcamEditor(0);
            }
            this.mediaKeyPressC = 0;
          }.bind(this), time);
          if (this.mediaKeyPressC > 0) {
            this.showMessageBar(this.mediaKeyPressC);
            if (this.mediaKeyPressC == 2) {
              event.stopPropagation();
              this.waitingForInput = true; this.camField = 0; 
              this.updateSpdcamEditor(0); this.toggleSpdcamEditor(1);
            }
          } else if (this.infoPanelVisible == false) { this.showIniScreen(); }
        }
  } else if (this.waitingForInput) {
    event.stopPropagation();
    if (event.keyCode == 39 || event.keyCode == 77) {
      if (this.camField < 3) this.camField++;
    } else if (event.keyCode == 37 || event.keyCode == 78) {
      if (this.camField > 0) this.camField--;
    } else if (event.keyCode == 13) {
      clearTimeout(this.pressoku);
      this.toggleSpdcamEditor(0);
      this.waitingForInput = null;
      this.mediaKeyPressC = 0;
      this.showMessageBar(5);
      this.tpCtrlWs.send('spdcame' + JSON.stringify( this.spdcamEditor.cells[this.camField].innerText ));
    }
    this.updateSpdcamEditor(this.camField);
  }
}; // end of tponkeyup

TravelPalCtrl.prototype.updateSpdcamEditor = function(field)
{
  for (i=0;i<4;i++) { this.spdcamEditor.cells[i].style.backgroundColor = "transparent"; }
  this.spdcamEditor.cells[field].style.backgroundColor = "#ffa030";
}; // end of updateSpdcamEditor

TravelPalCtrl.prototype.toggleSpdcamEditor = function(sw)
{
  if (sw == 1) {
    var scoeff = (this.lenUnitCode == 1) ? 1 : 0.625;
    for (i=0;i<3;i++) {this.spdcamEditor.cells[i].innerText = Math.floor((50+i*20)/5*scoeff)*5;}
    this.spdcamEditor.style.display = "block"
  } else if (sw == 0) {
    this.spdcamEditor.style.display = "none";
  }
}; // end of toggleSpdcamEditor

TravelPalCtrl.prototype.tponNavkeypressed = function(navipressc)
{
  clearTimeout(this.navpressId);
  this.navpressId = setTimeout(function() { this.toggleTravelInfoPanel();}.bind(this),500);
  this.showMessageBar(navipressc);
}; // end of tponNavkeypressed

TravelPalCtrl.prototype.getCurrentContext = function()
{
  var powerDiv1 = document.querySelector("div.NoCtrlTmplt.Transitions_fadeIn_300_300");
  var powerDiv2 = document.querySelector("div.StatusBarCtrl_Hidden");
  var powerDiv3 = document.querySelector("div.TemplateFull");
  if (powerDiv1 && powerDiv2 && !powerDiv3) return "PowerDown";

  var homeBtn = document.querySelector("div.StatusBarCtrlHomeBtn");
  var homeBtnvis = (homeBtn && homeBtn.style.display == "block") ? true : false;
  var leftBtn = document.querySelector("div.LeftBtnCtrl");
  var leftBtnhdn = (leftBtn && leftBtn.style.visibility == "hidden") ? true : false;
 
  if (!leftBtnhdn || !homeBtnvis) return "Other";

  var mediaDiv = document.querySelector("div.NowPlaying4Ctrl");
  if (mediaDiv && leftBtnhdn && homeBtnvis) return "Media";

  var naviDiv = document.querySelector("div.EmNaviTmplt");
  if (naviDiv && homeBtnvis) return "Navi";

  if (homeBtnvis) return "SomeScreen";

  return "Other";
}; // end of getCurrentContext

TravelPalCtrl.prototype.setElementsVisibility = function(ctx)
{
  if ((ctx != "Media") && (ctx != "Navi") || (this.infoPanelVisible == false)) {
    this.travelInfoPanel.style.display = "none";
    if (ctx != "Media") this.speedLimPanel.style.display = "none";
  } else if ((ctx == "Media") && (this.infoPanelVisible)) {
    this.travelInfoPanel.style.display = "block";
    this.travelInfoPanel.style.visibility = "hidden";
    if (this.currSpeedLimTimer) this.speedLimPanel.style.display = "block";
  } else if ((ctx == "Navi") && (this.infoPanelVisible)) {
    this.travelInfoPanel.style.display = "block";
    this.travelInfoPanel.style.visibility = "visible";
    this.speedLimPanel.style.display = "none";
  }
}; // end of setElementsVisibility

TravelPalCtrl.prototype.updateGPSHeading = function(heading, speed)
{
  if ((this.compassEnabled == false) && (heading != 0) && (heading*heading != 180*180)) {
    this.compassIconDiv.style.opacity = 1;
    this.compassEnabled = true;
    speed = 4;
  }
  if (Number(speed) > 3) {
    heading = Math.round(Number(heading));
    var str = this.compassIconDiv.style.transform;
    var prevrot = Number(str.slice(7, str.search("d")));
    var dr = -(heading+prevrot) % 360;
    if (Math.abs(dr) > 180) dr = -360*parseInt(dr/180)+dr;
    this.compassIconDiv.style.transform = 'rotate(' + (prevrot+dr) + 'deg)';
  }
} // end of updateGPSHeading

TravelPalCtrl.prototype.updateMediaData = function()
{
  if (this.currContext == "Navi") {
    var source = document.querySelector("div.titleFieldText");
    if (source) {
    var text = "";
    if (source.innerText == "FM") {
      var station = document.querySelector("div.textGeneric");
      if (station) {
        var stationd = station.innerText;
        var sFreq = stationd.slice(0,stationd.search("Hz")-2);
        var sInfo = stationd.substr(stationd.search("Hz")+3,8);
        if ( sFreq != this.prevStationFreq ) {
          this.mediaStr = ["","",""];
          this.prevStationFreq = sFreq;
        } else if (sInfo != this.mediaStr[2]) {
          this.mediaStr[0] = this.mediaStr[1];
          this.mediaStr[1] = this.mediaStr[2];
          this.mediaStr[2] = sInfo;
        }
        for (text="", i=0; i<2; i++) { text += this.mediaStr[i] + " "; }
        text += this.mediaStr[2];
        this.travelInfoPanel.style.letterSpacing = "2px";
      }
    } else {
      var title = document.querySelector("div.textTitle").innerText ||
                    document.querySelector("div.textGeneric").innerText;
      text = (title) ? title : "---";
      this.travelInfoPanel.style.letterSpacing = "0px";
    }
      this.travelInfoPanelParTxt.innerText = source.innerText.substr(0,2) + ": " + text;
    }
  }
}; // end of updateMediaData

TravelPalCtrl.prototype.updateSpeedlimData = function(spdlim)
{
  spdlim = Number(spdlim);
  if (spdlim > 0) {
    clearTimeout(this.currSpeedLimTimer);
    this.currSpeedLimTimer = null;
    this.currSpeedLim = spdlim;
    if (spdlim < 100) {
      this.speedLimIconDiv.style.left = "8px"; this.speedLimIconDiv.style.letterSpacing = "0px";
      this.speedLimIconDiv.style.fontSize = "28px";
    } else {
      this.speedLimIconDiv.style.left = "7px"; this.speedLimIconDiv.style.letterSpacing = "-1px";
      this.speedLimIconDiv.style.fontSize = "26px";
    }
    this.speedLimIconDiv.innerText = spdlim;
    if (this.currContext == "Media") this.speedLimPanel.style.display = "block";
    this.currSpeedLimTimer = setTimeout(function(){
      if (!this.spdcamID) this.speedLimPanel.style.display = "none";
      this.currSpeedLimTimer = null;
    }.bind(this),15000);
  } else if (spdlim == 0) {
    this.speedLimPanel.style.display = "none";
  }
}; // end of updateSpeedlimData

TravelPalCtrl.prototype.updateOverSpdCheck = function(speed)
{
  speed = Number(speed);
  if (this.currSpeedLimTimer) {
   // this.lenUnitCode = enum( UNIT_MILES_YARD=0, UNIT_KM=1, UNIT_MILES_FEET=2 )
    var scoeff = (this.lenUnitCode == 1) ? 1 : 0.625;
    var speeddiff = speed*scoeff - this.currSpeedLim;
    if (speeddiff > 40*scoeff) {
      this.speedLimIconDiv.style.backgroundColor = "#ffcc40";
    } else if (speeddiff > 10*scoeff) {
      this.speedLimIconDiv.style.backgroundColor = "#ffff88";
    } else {
      this.speedLimIconDiv.style.backgroundColor = "#ffffff";
    }
    this.speedLimIconDiv.innerText += "";
  }
}; // end of updateOverSpdCheck

TravelPalCtrl.prototype.updateTravelData = function(time,dist,fuelE)
{
  var currTimeSec = Math.floor(new Date()/1000);
  this.totTravelTime += currTimeSec - this.totTravelTimePrevStep;
  this.totTravelTimePrevStep = currTimeSec;
  if ( time != "000000") { // Engine running
    // --set new Stage--
    if (this.currTPCtrlStatus != 1) {
      this.currTripStartTime = currTimeSec - 2;
      this.startNewTravelStage();
      this.currTPCtrlStatus = 1;
    }
    // --drive time--
    this.totDriveTime = this.totDriveTimePrevStages + currTimeSec - this.currTripStartTime;
    // --fuel--
    fuelE = Number(fuelE);
    fuelE = (fuelE < 40) ? 40 : fuelE;
    this.totDriveAvFlEff = (this.totDriveAvFlEffPrevStages + fuelE*(currTimeSec - this.currTripStartTime))/this.totDriveTime;
    // --distance--
    dist = Number(dist);
    if (dist > 0) {
      this.totDriveDist += dist - this.totDriveDistPrevStep;
      this.totDriveDistPrevStep = dist;
    }
    // --speed--
    this.totDriveAvSpeed = this.totDriveDist/(this.totDriveTime/3600);

  } else { this.currTPCtrlStatus = 0; }

  this.totDriveAvFlEff = (this.totDriveAvFlEff < 40) ? 40 : this.totDriveAvFlEff;

  this.showTravelData();
}; // end of updateTravelData

TravelPalCtrl.prototype.showTravelData = function()
{
  // this.lenUnitCode = enum( UNIT_MILES_YARD=0, UNIT_KM=1, UNIT_MILES_FEET=2 )
  var distcoeff = (this.lenUnitCode == 1) ? 0.020 : 0.012427;
  var tdprec = this.totDriveDist*distcoeff < 20;
  var dm = Math.floor(this.totTravelTime / 60 % 60);
  var travelTimeStr = Math.floor(this.totTravelTime/3600) + ':' + (dm>9 ? dm : '0' + dm) ;
  var fuelEff = (this.lenUnitCode == 1) ? 1000/this.totDriveAvFlEff : ((this.lenUnitCode == 0) ? 0.28248*this.totDriveAvFlEff : 0.23521*this.totDriveAvFlEff);
  var fuelres = (this.totDriveTime != 0);

  this.tripDistTimeIconParVal.innerText = (this.totDriveDist*distcoeff).toFixed(tdprec) +'\n' + travelTimeStr;
  this.tripAverIconParVal.innerText = (this.totDriveAvSpeed*distcoeff).toFixed(0) +'\n' + (fuelEff*fuelres).toFixed(1);
}; // end of showTravelData

TravelPalCtrl.prototype.startNewTravelStage = function()
{
  this.totDriveTimePrevStages = this.totDriveTime;
  this.totDriveAvFlEffPrevStages = Math.round(this.totDriveAvFlEff*this.totDriveTime);
  if (this.currTPCtrlStatus == 0) this.totDriveDistPrevStep = 0;
}; // end of startNewTravelStage

TravelPalCtrl.prototype.resetTravelData = function()
{
  this.totTravelTime = this.totDriveTime = 0;
  this.totDriveDist = this.totDriveAvSpeed = 0;
  this.totDriveAvFlEff = 40;
  this.currTPCtrlStatus = 2;
  this.showTravelData();
  
}; // end of resetTravelData

TravelPalCtrl.prototype.showSpeedcamAlert = function(spdcamspdlim, spdcamdist)
{
  clearTimeout(this.spdcamID); this.spdcamID = null; 
  this.speedLimIconParImg.classList.add("TravelPalCtrlSpeedLimImgCam"); 

  if (spdcamdist) {
    this.speedLimIconDiv.innerText = spdcamspdlim;
    if (this.lenUnitCode != 1) spdcamdist = (0.625*spdcamdist/1000).toFixed(1);
    this.speedLimIconParRdist.innerText = spdcamdist;
    this.speedLimIconParRdist.style.display = "block";
    this.speedLimIconParRdistSub.style.display = "block";
  } else {
    this.speedLimIconParRdist.style.display = "none";
    this.speedLimIconParRdistSub.style.display = "none";
    this.updateSpeedlimData(50);
  }
  if (this.currContext == "Media") this.speedLimPanel.style.display = "block";
  this.spdcamID = setTimeout(function(){
    this.speedLimIconParImg.classList.remove("TravelPalCtrlSpeedLimImgCam");
    this.speedLimIconDiv.innerText += "";
    this.speedLimIconParRdist.style.display = "none";
    this.speedLimIconParRdistSub.style.display = "none";
    if (!this.currSpeedLimTimer) this.speedLimPanel.style.display = "none";
    this.spdcamID = null;
 }.bind(this),10000);
}; // end of showSpeedcamAlert

TravelPalCtrl.prototype.toggleTravelInfoPanel = function()
{
  if (this.infoPanelVisible == true) {
    this.infoPanelVisible = false;
  } else {
    this.infoPanelVisible = true;
  }
  this.setElementsVisibility(this.currContext);
}; // end of toggleTravelInfoPanel

TravelPalCtrl.prototype.showMessageBar = function(mcode)
{
  clearTimeout(this.infoOffID);
  var time = (mcode == 1) ? 500 : 2700;
  this.messageBarDiv.style.lineHeight = ((mcode==2 || mcode>10 ) ? 47 : 90) + "px";
  this.messageBarDiv.innerText = this.textStrings["msgCode" + mcode];
  this.messageBarDiv.style.opacity = 1;
  this.infoOffID = setTimeout(function(){
    this.messageBarDiv.style.opacity = 0;
  }.bind(this),time-50);
}; // end of showMessageBar

TravelPalCtrl.prototype.startDataProcessing = function(action)
{
  this.tpIniLog("Connecting to websocket");

  this.tpCtrlWs = new WebSocket('ws://localhost:9966/');
  this.tpCtrlWs.onmessage = function(event) {
    var res = event.data.split('#');
    switch (res[0]) {
      case 'savedData':
        this.tpIniLog("Websocket saved Data received");
        this.initializeData(res[1],res[2],res[3],res[4]); // savedtravdata,currtime,carlang,langpack
      break;
      case 'currentData':
        this.lenUnitCode = res[6];
        this.updateOverSpdCheck(res[5]); // speed
        this.updateGPSHeading(res[1],res[5]); // head, speed
        this.updateTravelData(res[4],res[2],res[3]); // time,dist,fuelE
        this.updateMediaData();
      break;
      case 'speedlimData':
        this.updateSpeedlimData(res[1]); // spdlim
      break;
      case 'speedcamData':
        this.showSpeedcamAlert(res[1],res[2]); // spdcamspdlim, spdcamdist
      break;
      case 'speedcammod':
        this.showMessageBar(res[1]); // mcode
      break;
      case 'navipressed':
        this.tponNavkeypressed(res[1]); // navipressc
      break;
      case 'testData':
        setTimeout(function(){
          this.textStrings.msgCode100 = "Navistatus: " + res[1] + ", nloops: " + res[2] + ", langloops: " + res[3];
          this.showMessageBar(100);
        }.bind(this), 12000);
      break;
      default:
        // none
      break;
    } // end of switch
  }.bind(this); // end of onmessage
  this.tpCtrlWs.onopen = function() {
    this.wsConnLimit = true;
    this.tpIniLog("Websocket opened");
    this.tpCtrlWs.send(action);
  }.bind(this); // end of onopen
  this.tpCtrlWs.onerror = function() {
    if (!this.wsConnLimit) {
      setTimeout(function(){
        this.tpIniLog("Error connecting to Websocket");
        this.mainElt.style.opacity = 1;
        this.showMessageBar(99);
        setTimeout(function(){
          if (!this.wsConnLimit) {
            this.wsConnLimit = true;
            this.startDataProcessing('travlRd');
          }
        }.bind(this), 5000);
      }.bind(this), 5000);
    } else { document.body.removeChild(document.getElementsByClassName("TravelPalCtrl")[0]);}
  }.bind(this); // end of onerror
}; // end of startDataProcessing

(function(){
  setTimeout(function(){ travelPalObj = new TravelPalCtrl();}, 5000);
})();