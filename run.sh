#!/bin/sh

ANDROID_HOME=~/AppData/Local/Android/Sdk/
PATH=$PATH:$ANDROID_HOME/emulator
PATH=$PATH:$ANDROID_HOME/platform-tools

cd ./Backend/
node index.js &

cd ../Application/
npm run android

