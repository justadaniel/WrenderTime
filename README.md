# WrenderTime
<font color="red">**Warning:** macOS is extremely buggy! A lot of the features on that work on Windows don't run on Mac well.</font>

I wanted to make WrenderTime because I tend to walk away from my computer when it's rendering a video. This application monitors directories and looks for when Adobe exports videos to them. The app sits in the system tray on Windows and on in the menu bar on macOS.

To setup IFTTT, you need to create a webhook action on their site, set the event name to `wrender_finished` and put the API key in the WrenderTime Preferences under _Services_. When setting up the action, `value1` will be the message that is sent from WrenderTime.


#### Instructions
1. Create a folder on your system to export a video to every time.
2. Set the watch folder in the preferences.
3. Press start watch on the main screen to start watching for the files.
4. Export a video using a supported encoder to the watch folder.
5. When the video has finished, you should see a notification popup, and if you have IFTTT setup, the action should run.


#### To-Do
###### Features
- [ ] Feature-Parody on MacOS
- [ ] Auto-Updater
- [ ] Better App Icon
- [ ] Video Preview Support

###### Encoder Support
- [X] H.264
- [X] QuickTime
- [ ] H.265/HEVC