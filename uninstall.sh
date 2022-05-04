#!/bin/sh
# TravelPal version 1.0 - May 2022
# Uninstall from default path

OPERADIRUJS="/jci/opera/opera_dir/userjs"
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

initUnInstall() {
  mount -o rw,remount /
  SRCDIR=$(dirname "$(readlink -f "$0")")
  mount -o rw,remount "${SRCDIR}"
  showMsgConf "This will uninstall TravelPal App \n\n Continue to uninstall now?"
}

finishUnInstall() {
  showMsgInfo "App uninstalled successfully \n\n Rebooting..."
  reboot &
  exit 0
}

uninstallAppFiles() {
  rm -r "${INSTALLDST}/TravelPal"
  [ -z "$(ls "${INSTALLDST}")" ] && rm -r "${INSTALLDST}"
  rm -f "${OPERADIRUJS}/tprun.js"
  if [ -e "/jci/scripts/stage_2.sh" ]; then
    SYSSCRIPT="/jci/scripts/stage_2.sh"
  else SYSSCRIPT="/jci/scripts/stage_wifi.sh"
  fi
  if grep -Fq '###tp datahandler start' "${SYSSCRIPT}"; then
    sed -i "/^###tp datahandler start/,/^###tp datahandler end/d" "${SYSSCRIPT}"
    chmod +x "${SYSSCRIPT}"
  fi
  if [ ! -e "${INSTALLDST}/TravelPal" ] && [ ! -e "${OPERADIRUJS}/tprun.js" ]; then
    showMsgInfo "App files removed \n\n Please wait"
  else 
    showMsgInfo "Some App files could not be removed \n\n Exiting..." 5
    exit 0
  fi
}

initUnInstall
uninstallAppFiles
finishUnInstall