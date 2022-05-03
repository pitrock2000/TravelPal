#!/bin/sh
# TravelPal version 1.0 - May 2022
# Monitor Travel Info and edit user speedcams with alerts even without Navi SDcard.
# Features: GENERAL: Turn on/off Travel InfoPanel with a push of a (Media) button. Multi-language and EU/US Units support.
#   INFO: travel distance and time, average driving speed and fuel economy, rotating compass, user reset, 90min-off auto-reset,
#   speed-limit sign on Media screen (need Navi SDcard), audio source and title displayed on Navi screen,
#   SPEEDCAM: user speedcam add/remove (no need for Navi SDcard), user speedcam alert with distance shown
# App does not modify any original JS files nor uses any original JS functions
# It is written in pure JS and uses websocketd server to transfer data from and to car (r/w travel data and speedcams)
# App should work with Infotainment FW versions between 56.00.100 - 59.00.500
# Other FW versions not tested, so shoukd be used with care.
# Thanks to those who worked on original versions of tweaks.
# Note: install and use this App at your own risk and please focus on driving.

OPERAHOME="/jci/opera/opera_home"
OPERAINI="${OPERAHOME}/opera.ini"
OPERADIRUJS="/jci/opera/opera_dir/userjs"
OPERAFPS="${OPERADIRUJS}/fps.js"
INSTALLDST="/tmp/mnt/data/uapps"

showMsgInfo() {
  sleep 0.2; killall -q jci-dialog
  /jci/tools/jci-dialog --info --title="--- TravelPal ---" --text="$1" &
  [ ! -z "$2" ] && sleep "$2" || sleep 4
  killall -q jci-dialog
}

showMsgConf() {
  sleep 0.5; killall -q jci-dialog
  /jci/tools/jci-dialog --confirm --title="--- TravelPal ---" --text="$*" --ok-label="YES" --cancel-label="NO"
  if [ $? -eq 0 ]; then
    sleep 0.5; killall -q jci-dialog; return
  else
    sleep 0.5; killall -q jci-dialog; exit 0
  fi
}

logMsg() {
  echo "$*" >> "$INSTALLLOG"
}

initInstall() {
  # echo 1 > /sys/class/gpio/Watchdog\ Disable/value
  mount -o rw,remount /
  SRCDIR=$(dirname "$(readlink -f "$0")")
  mount -o rw,remount "${SRCDIR}"
  INSTALLLOG="${SRCDIR}/tpinstall.log"
  rm -f "${INSTALLLOG}"
  logMsg "TravelPal install from ${SRCDIR}"
  showMsgInfo "This will install TravelPal App in 4 steps \n Install at your own risk \n\n Go to next screen" 8
}

finishInstall() {
  logMsg "App installed successfully, Rebooting"
  showMsgInfo "Congratulations! \n App installed successfully \n\n Rebooting..." 5
  reboot &
  exit 0
}

checkSystemVersion() {
  verStr=$(grep "^JCI_SW_VER=" /jci/version.ini | sed 's/^.*_\([^_]*\)\"$/\1/')
  verx=$(echo "$verStr" | awk -F. '{print $1}')
  verz=$(echo "$verStr" | awk -F. '{print $3}')
  if [ -z "${verStr}" ]; then
    logMsg "Step 1/4 Error: Infotainment software version unknown, Exiting"
    showMsgInfo "Step 1/4 \n Error: Infotainment software version unknown \n\n Exiting..." 5
    exit 0
  fi
  if [ $verx -ge 55 ] && [ $verx -le 58 ] || [ $verx -eq 59 ] && [ $verz -lt 502 ]; then
    showMsgConf "Step 1/4 \n Infotainment software version: ${verStr} \n Application should be compatibe with this version. \n Continue to install now ?"
  elif [ $verx -eq 59 ] && [ $verz -ge 502 ]; then
    showMsgConf "Step 1/4 \n Infotainment software version: ${verStr} \n Application should be used with care. \n Continue to install now ?"
  elif [ $verx -lt 55 ]; then
    logMsg "Step 1/4 Infotainment Software too old, Exiting"
    showMsgInfo "Step 1/4 \n Infotainment software version too old \n Please upgrade to ver 55+ \n\n Exiting..."
    exit 0
  else
    showMsgConf "Step 1/4 \n Infotainment software version: -${verStr}- \n Application not tested with this version. \n Continue to install now ?"
  fi
  logMsg "Step 1/4 Infotainment software version: ${verStr}; User OK to continue"
}

checkSystemWatchdog() {
  if [ ! -e /jci/sm/sm.conf.org ]; then
    cp -a /jci/sm/sm.conf /jci/sm/sm.conf.org
    logMsg "Step 2/4 System Watchdog: backup file sm.conf.org created"
  else
    logMsg "Step 2/4 System Watchdog: backup file sm.conf.org already present"
  fi
  if ! grep -Fq 'watchdog_enable="false"' /jci/sm/sm.conf || ! grep -Fq 'args="-u /jci/gui/index.html --noWatchdogs"' /jci/sm/sm.conf
  then
    sed -i 's/watchdog_enable="true"/watchdog_enable="false"/g' /jci/sm/sm.conf
    sed -i 's|args="-u /jci/gui/index.html"|args="-u /jci/gui/index.html --noWatchdogs"|g' /jci/sm/sm.conf
    logMsg "Step 2/4 System Watchdog: file sm.conf modified, Dog permanently disabled"
  else
    logMsg "Step 2/4 System Watchdog: file sm.conf not modified, Dog already disabled"
  fi
  showMsgInfo "Step 2/4 \n System Watchdog file ... OK \n"
}

checkOperaFiles() {
  if [ ! -e "${OPERAINI}.org" ]; then
    cp "${OPERAINI}" "${OPERAINI}.org"
    logMsg "Step 3/4 User Javascripts: backup file opera.ini.org created"
  else 
    logMsg "Step 3/4 User Javascripts: backup file opera.ini.org already present"
  fi
  if ! grep -Fq 'User JavaScript=1' "${OPERAINI}"; then
    sed -i 's/User JavaScript=0/User JavaScript=1/g' "${OPERAINI}"
    logMsg "Step 3/4 User Javascripts: file opera.ini modified, User JS enabled"
  else 
    logMsg "Step 3/4 User Javascripts: file opera.ini not modified, User JS already enabled"
  fi
  if [ ! -e "${OPERAFPS}.org" ]; then
    mv "${OPERAFPS}" "${OPERAFPS}.org"
    logMsg "Step 3/4 User Javascripts: file fps.js renamed to fps.js.org"
  else 
    logMsg "Step 3/4 User Javascripts: file fps.js.org already present"
  fi
  showMsgInfo "Step 3/4 \n Opera files ... OK \n"
}

installAppFiles() {
  mkdir -p "${INSTALLDST}"
  cp -r "${SRCDIR}/config/TravelPal" "${INSTALLDST}"
  chmod +x "${INSTALLDST}/TravelPal/vendor/websocketd"
  ln -s "${INSTALLDST}/TravelPal/TravelPal.js" "${OPERADIRUJS}/tprun.js"
  if [ -e "${INSTALLDST}/TravelPal/TravelPal.js" ] && [ -e "${OPERADIRUJS}/tprun.js" ]; then
    logMsg "Step 4/4 Install files: app files copied"
  else 
    logMsg "Step 4/4 Error: App files could not be copied, Exiting..."
    showMsgInfo "Step 4/4 \n Error: App files could not be copied \n Check install files and try again \n\n Exiting..." 5
    exit 0
  fi
  if [ -e "/jci/scripts/stage_2.sh" ]; then
    SYSSCRIPT="/jci/scripts/stage_2.sh"
  else SYSSCRIPT="/jci/scripts/stage_wifi.sh"
  fi
  if ! grep -Fq 'websocketd --port=9966' "${SYSSCRIPT}"; then
    echo "###tp datahandler start" >> "${SYSSCRIPT}"
    echo "chmod +x ${INSTALLDST}/TravelPal/datahandler.sh" >> "${SYSSCRIPT}"
    echo "${INSTALLDST}/TravelPal/vendor/websocketd --port=9966 ${INSTALLDST}/TravelPal/datahandler.sh &" >> "${SYSSCRIPT}"
    echo "###tp datahandler end" >> "${SYSSCRIPT}"
    chmod +x "${SYSSCRIPT}"
    logMsg "Step 4/4 Install files: System startup script modified"
  else
    logMsg "Step 4/4 Install files: System startup script already modified"
  fi
  showMsgInfo "Step 4/4 \n App files and startup script ... OK \n Please wait" 18
}

initInstall
checkSystemVersion
checkSystemWatchdog
checkOperaFiles
installAppFiles
finishInstall
