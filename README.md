![Checks](https://img.shields.io/github/check-runs/splamei/rhythm-plus-pc-splamei-client/main)
![Issues](https://img.shields.io/github/issues/splamei/rhythm-plus-pc-splamei-client)
![License](https://img.shields.io/github/license/splamei/rhythm-plus-pc-splamei-client)
![Release](https://img.shields.io/github/v/release/splamei/rhythm-plus-pc-splamei-client)
![Commits since release](https://img.shields.io/github/commits-since/splamei/rhythm-plus-pc-splamei-client/latest)
![Repo Size](https://img.shields.io/github/repo-size/splamei/rhythm-plus-pc-splamei-client)

# Rhythm Plus - Splamei Client (PC - Electron)

## If your looking for the Android Client, you can find it [here](https://github.com/splamei/rplus-mobile-client)

## If your looking for the .NET PC Client, you can find it [here](https://github.com/splamei/rplus-pc-client)

A client for PC allowing you to play the [Rhythm Plus music game](https://rhythm-plus.com) within an app right on your device with extra nice features.

Rhythm Plus is a web-based vertical scrolling rhythm game (VSRG), you can make, play, and share any songs from and with anyone! Learn more on it's official [GitHub repo](https://github.com/henryzt/Rhythm-Plus-Music-Game).

## Features

- On device app
  - You will need an active internet connection to the R+ servers to use the client
  - This client relies on Electron, which uses web technologies such as chromium
- Easy to use
- Clean and simple UI
- Extension support
- Discord Rich Presence

## Compatibility

> This is the recommened min specs for your system. This doesn't mean devices that don't hit these requirements won't be able to run the client

- Intel Core i5 10th Gen or AMD Ryzen 5 3600
- GeForce RTX 4060, Radeon RX 6600 or Intel HD Graphics
- 2GB RAM or more
- Windows 10 or Debian 12

## Installation

> The client is currently on in it's pre-release stage so please wait while we work on this section

## Custom Extensions

The client supports most extensions you may want to use. You can install them via the method below:

> [!IMPORTANT]  
> Extensions will have access to the Rhythm Plus game. Please only install extensions you trust to prevent loosing your account.


> [!IMPORTANT]  
> The extensions you use must be unpacked extensions. There is no extension store within the client

1. Open the client and wait for it to launch
2. Navigate to 'Extensions > Open Extension Folder' in the menu bar
	- You should see the extension folder used by the client
3. Drop the unpacked extensions you wish to use in that folder
4. Relaunch the client to use the new extension

> To open the extension's page, if supported by the extension, select your extension in the 'Extensions' menu bar item

## Editing and building

To use the client, you'll need Node.js and npm installed. You can make a tempory build with the `npx electron .` command and build it with the `npm run build:win` command for Windows and `npm run build:linux` for Linux.

## Contributing

Any support to the app would help a lot with it's development. You can help by:

 - Reporting issues / feature requests on the [issue page](https://github.com/splamei/rhythm-plus-pc-splamei-client/issues)
 - Forking the repo
 - Making pull request adding code or fixing bugs
 - Staring or watching
 - Sharing this repo

All contributions to the app will be licenced under the Apache License 2.0 to keep the open-source nature of the app.

Please read `CONTRIBUTING.md` for everything you need to know before contributing.

## License

All code written directly for the client is licenced under the Apache License 2.0 unless otherwise stated

## Branding Rights

The name, branding, logo, etc. and any related assets for Splamei and SplameiPlay is property of Splamei. These assets are not licensed under the Apache License 2.0.

Any and all forks and derived works must use a different name and cannot imply endorsement or affiliation with Splamei, SplameiPlay or projects.

## Socials

[YouTube](https://youtube.com/@splamei) - [Twitch](https://twitch.tv/splamei) - [Twitter](https://twitter.com/splamei) - [BlueSky](http://splamei.bsky.social/) - [Discord](https://discord.gg/g2KTP5X9At)

## Built with ❤️ using Visual Studio Code and Electron