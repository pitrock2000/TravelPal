#!/bin/sh
HDSTOREDIR="/tmp/mnt/data/uapps/TravelPal"
SDSPDCAMDIR="/tmp/mnt/sd_nav/content/speedcam"
BUSADDRESS="unix:path=/tmp/dbus_service_socket"

guidenceChmon() { dbus-monitor --address "${BUSADDRESS}" member='GuidanceChanged' | awk 'NR==21 {NR=7; print "speedlimData#"$2}';}
navPressedmon() { dbus-monitor --address "${BUSADDRESS}" member='NaviButtonPress' | awk '/NaviButtonPress/ {print "navipressed#1"}';}

getGRTimeSec() { GRTIMESEC=$(smdb-read -n vdm_vdt_history_data -e GlobalRealTime | awk '{printf "%i\n", $1/10}');}

getGPSposition() {
  GPS=$(dbus-send --print-reply --address="${BUSADDRESS}" --dest=com.jci.lds.data /com/jci/lds/data com.jci.lds.data.GetPosition)
  GPSLON=$(echo "$GPS" | awk 'NR==5 {print $2}'); [ -z "$GPSLON" ] && GPSLON=0
  GPSLAT=$(echo "$GPS" | awk 'NR==4 {print $2}'); [ -z "$GPSLAT" ] && GPSLAT=0
}

getCMUlang() {
  for i in `seq 1 5`; do
    CMULANG=$(dbus-send --print-reply --address="${BUSADDRESS}" --dest=com.jci.navi2NNG /com/jci/navi2NNG com.jci.navi2NNG.GetLanguage | awk 'NR==2 {print $2}')
    [ ! -z "$CMULANG" ] && [ $CMULANG -ne 0 ] && return
    sleep 1
  done
  CMULANG=0;
}

setNAVIparams() {
  if [ -e "${SDSPDCAMDIR}/speedcam.txt" ]; then
    NAVISTATUS=2 #navi card with user spdcams
    SPDCAMFILE="${SDSPDCAMDIR}/speedcam.txt"
    return
  elif [ -e "${SDSPDCAMDIR}" ]; then
    NAVISTATUS=1 #built-in spdcams
  else
    NAVISTATUS=0 #no navi card
  fi
  SPDCAMFILE="${HDSTOREDIR}/speedcam.txt"
}

runMonitors() {
  NAVISTATUS=0
  for i in `seq 1 5`; do
    getCurrentData
    [ -e /dev/sd? ] && sleep 1 && break
    sleep 1
  done
  setNAVIparams
  if [ $NAVISTATUS -ne 0 ]; then
    guidenceChmon &
    navPressedmon &
    speedcamAlmon &
  else
    speedcamSearch &
  fi
}

speedcamAdd() {
  setNAVIparams
  getGPSposition
  if [ $GPSLON != 0 ] || [ $GPSLAT != 0 ]; then
    [ ! -z "$1" ] && spdlim="$1" || spdlim=50
    spdcamdata="$GPSLON,$GPSLAT,1,$spdlim,0,0"
    echo "${spdcamdata}" >> "${SPDCAMFILE}" && echo "speedcammod#3"
    [ $NAVISTATUS -eq 2 ] && rm -f "${SDSPDCAMDIR}/speedcam.spdb" && killall jci-linux_imx6_volans-release &
    return
  fi
  echo "speedcammod#9"
}

speedcamRem() {
  setNAVIparams
  getGPSposition
  if [ $GPSLON != 0 ] || [ $GPSLAT != 0 ]; then
    if [ -e "${SPDCAMFILE}" ]; then
      awk 'BEGIN {FS=","} {if (((($1-'$GPSLON')*cos('$GPSLAT'*3.14/180))**2 < 25*1e-6) && (($2-'$GPSLAT')**2 < 25*1e-6)) {print $1","$2; m=1}}; END {if (! m) print "NOK"}' "${SPDCAMFILE}" | while read line
      do
        [ "$line" == "NOK" ] && exit 1
        sed -i "/^$line/d" "${SPDCAMFILE}"
      done;
      if [ $? -eq 0 ]; then
        echo "speedcammod#4"
        [ $NAVISTATUS -eq 2 ] && rm -f "${SDSPDCAMDIR}/speedcam.spdb" && killall jci-linux_imx6_volans-release &
        return
      fi
    fi
  fi
  echo "speedcammod#9"
}

speedcamAlmon() {
  dbus-monitor --address "${BUSADDRESS}" member='VoicePrompt' | awk '/[Rr]adar|[CcKk]amer|[Cc]ámar/ {print "speedcam"}' | while read line
  do
    echo "speedcamData#-1"
    sleep 0.2
    if [ $NAVISTATUS -eq 2 ]; then
      getGPSposition
      heading=$(echo "$GPS" | awk 'NR==7 {if ('$NAVISTATUS' != 0) $2=$2-180; print $2}')
      gpsSpeed=$(echo "$GPS" | awk 'NR==8 {printf "%.f\n", $2}')
      awk 'BEGIN {FS=",";dtor=3.14/180;sinhe=sin('$heading'*dtor); coshe=cos('$heading'*dtor); sL=0.001+0.00009*'$gpsSpeed'}
        {xcr=($1-'$GPSLON')*cos('$GPSLAT'*dtor); ycr=$2-'$GPSLAT';
        if ( ((xcr**2 + ycr**2) < sL**2) && ((atan2(xcr*coshe - ycr*sinhe,xcr*sinhe + ycr*coshe))**2 < (14*dtor)**2 ) ) {print $1" "$2" "$4" "sqrt(xcr**2 + ycr**2)*0.9e5;exit}}' "${SPDCAMFILE}" | while read line
      do
        rspdlim=$(echo $line | awk '{print $3}')
        rdist=$(echo $line | awk '{rd=int($4/50); printf "%.f\n", rd*50}')
        [ $gpsSpeed -gt 5 ] && echo "speedcamData#$rspdlim#$rdist"
      done
    fi
  done
}

speedcamSearch() {
  while [ $NAVISTATUS -eq 0 ]; do
    getGPSposition
    if [ $GPSLON != 0 ] || [ $GPSLAT != 0 ]; then
      heading=$(echo "$GPS" | awk 'NR==7 {if ('$NAVISTATUS' != 0) $2=$2-180; print $2}')
      gpsSpeed=$(echo "$GPS" | awk 'NR==8 {printf "%.f\n", $2}')
      awk 'BEGIN {FS=",";dtor=3.14/180;sinhe=sin('$heading'*dtor); coshe=cos('$heading'*dtor); sL=0.001+0.00009*'$gpsSpeed'}
        {xcr=($1-'$GPSLON')*cos('$GPSLAT'*dtor); ycr=$2-'$GPSLAT';
        if ( ((xcr**2 + ycr**2) < sL**2) && ((atan2(xcr*coshe - ycr*sinhe,xcr*sinhe + ycr*coshe))**2 < (10*dtor)**2 ) ) {print $1" "$2" "$4" "sqrt(xcr**2 + ycr**2)*0.9e5;exit}} ' "${SPDCAMFILE}" | while read line
      do
        rlon=$(echo $line | awk '{print $1}')
        rlat=$(echo $line | awk '{print $2}')
        rspdlim=$(echo $line | awk '{print $3}')
        rdist=$(echo $line | awk '{rd=int($4/50); printf "%.f\n", rd*50}')
        appr="true"
        while [ $appr ]; do
          [ $gpsSpeed -gt 5 ] && echo "speedcamData#$rspdlim#$rdist"
          [ $gpsSpeed -gt 20 ] && [ $NAVISTATUS -eq 0 ] && dbus-send --address="${BUSADDRESS}" /com/NNG/Api/Server com.NNG.Api.Server.Audio.VoicePrompt uint64:0 int32:0 string:"Radar"
          sleept=$(echo $gpsSpeed | awk '{t=18-$1/10; if (t<10) {t=10}; printf "%.f\n", t}')
          sleep $sleept
          appr=""
          glon0=$GPSLON; glat0=$GPSLAT;
          getGPSposition
          gpsSpeed=$(echo "$GPS" | awk 'NR==8 {printf "%.f\n", $2}')
          appr=$(echo $rlon $rlat | awk '{if ((($1-'$GPSLON')**2 + ($2-'$GPSLAT')**2) < (($1-'$glon0')**2 + ($2-'$glat0')**2)) {print sqrt(($1-'$GPSLON')**2 + ($2-'$GPSLAT')**2)*0.9e5}}')
          rdist=$(echo $appr | awk '{rd=int($1/50); printf "%.f\n", rd*50}')
        done
      done
      sleep 15
    fi
  done
}

takeaction() {
  getGRTimeSec
  taction=$(echo "${action}" | head -c 7)
  if [ "${taction}" = "travlRd" ]; then
    tdata=$(head -1 "${HDSTOREDIR}/tpdata")
    [ -z "${tdata}"] && tdata="[0,0,0,0,0]"
    langpack=$(echo $(cat "${HDSTOREDIR}/langpack.json") | sed 's/,}\|, }/ }/g;s/}"\|} "/}, "/g')
    rm -f "${HDSTOREDIR}/loginijs"
    echo "savedData#${tdata}#${GRTIMESEC}#${CMULANG}#${langpack}"
  elif [ "${taction}" = "travlWr" ]; then
    tdata=$(echo "${action}" | sed "s/travlWr\|\]//g" | awk '{print $0","'$GRTIMESEC'"]"}')
    echo "${tdata}" > "${HDSTOREDIR}/tpdata"
    rm -f "${SDSPDCAMDIR}/speedcam.spdb"
  elif [ "${taction}" = "saveLog" ]; then
    tdata=$(echo "${action}" | sed 's/saveLog\|"//g')
    echo "$(hwclock)#${tdata}" | awk -F# '{for (i=1;i<NF+1;i++) print $i}' >> "${HDSTOREDIR}/loginijs"
  elif [ "${taction}" = "spdcame" ]; then
    tdata=$(echo "${action}" | sed 's/spdcame\|"//g')
    [ "${tdata}" = "X" ] && speedcamRem || speedcamAdd "${tdata}"
  fi
  action=""
  sleep 0.2
}

getCurrentData() {
  GPS=$(dbus-send --print-reply --address="${BUSADDRESS}" --dest=com.jci.lds.data /com/jci/lds/data com.jci.lds.data.GetPosition)
  HEADING=$(echo "$GPS" | awk 'NR==7 {if ('$NAVISTATUS' != 0) $2=$2-180; print $2}')
  GPSSPEED=$(echo "$GPS" | awk 'NR==8 {printf "%.f\n", $2}')
  DRVTIME=`smdb-read -n vdm_vdt_pid_data -e Drv1DrvTm`
  DRVDIST=`smdb-read -n vdm_vdt_pid_data -e Drv1Dstnc`
  FUELEFC=`smdb-read -n vdm -e Drv1AvlFuelE`
  LENUNIT=$(dbus-send --print-reply --address="${BUSADDRESS}" --dest=com.jci.navi2NNG /com/jci/navi2NNG com.jci.navi2NNG.GetLengthUnit | awk 'NR==2 {print $2}')
  echo "currentData#${HEADING}#${DRVDIST}#${FUELEFC}#${DRVTIME}#${GPSSPEED}#${LENUNIT}"
}

while read action; do break; done
getCMUlang
takeaction
runMonitors
while true; do
  getCurrentData
  read -t 1 action && takeaction
done
