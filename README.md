# TravelPal
Travel Info and User Speedcams for Mazda Infotainment System

TravelPal version 1.0 - May 2022

Monitor Travel Info and edit user speedcams with alerts even without Navi SDcard.

Features: GENERAL: Turn on/off Travel InfoPanel with a push of a (Media) button. Multi-language and EU/US Units support.
  INFO: travel distance and time, average driving speed and fuel economy, rotating compass, user reset, 90min-off auto-reset,
  speed-limit sign on Media screen (need Navi SDcard), audio source and title displayed on Navi screen.
  SPEEDCAM: user speedcam add/remove (no need for Navi SDcard), user speedcam alert with distance shown.

App does not modify any original JS files nor uses any original JS functions.
It is written in pure JS and uses websocketd server to transfer data from and to car (r/w travel data and speedcams).
App should work with Infotainment FW versions between 56.00.100 - 59.00.500.
Other FW versions not tested, so should be used with care.
Thanks to those who worked on original versions of tweaks.
Note: install and use this App at your own risk and please focus on driving.

How to install.

Option 1. SSH access - copy install.sh file and config folder to any place in Mzd system. Add exec rights and run.
Option 2. Pendrive access - copy install.sh file and config folder to empty 8-16 GB pendrive. In addition copy files from pendrv folder to pendrive. Insert pendrive and wait.
For both options installation process will be presented on the screen in several steps. Additionally tpinstall.log file will be created on source folder.

User's guide.

App starts to run in the background when the car is opened.
To turn on and off (toggle) InfoPanel with Travel data press Media button once when in Media screen and Navi button when in Navi screen.
To reset Travel data when in Media screen press and hold Media button for about a second until zeros appear. 
To edit User Speed camera when in Media screen press Media button twice and use knob to choose speed limit to add camera and choose X to remove camera if on the list.
Speedcams can be added and then removed from the list, but built-in cameras cannot be removed unless built-in Navi app is patched.
Speed cameras added to the list are displayed on Media screen when approached as icon with optional distance if detected within certain range.

Please write to me in case of issues or questions.

Have fun!
